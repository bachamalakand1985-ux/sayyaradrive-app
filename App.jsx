import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  Car, Plane, MapPinned, Key, ShoppingBag, UtensilsCrossed, Truck,
  Briefcase, Users, Bell, Menu, ChevronRight, ArrowLeft, MapPin, Circle,
  Square, Navigation, Zap, Users2, CheckCircle2, PlaneLanding, PlaneTakeoff,
  Calendar, Clock, ArrowRightLeft, Route, Search,
  Plus, Tag, X, Star, ShoppingBag as Bag, Minus,
  Package, Phone, DollarSign,
  Mail, LogOut, Power, Sparkles, Send, Bot, Shield, User, Check,
  Link, Globe, Trophy, MessageCircle, Mic, RefreshCw, Flag, Image as ImageIcon, PhoneOff, PhoneCall,
  Settings, LogIn, HelpCircle
} from "lucide-react";

/* ---------- support contact ---------- */
const SUPPORT_WHATSAPP_NUMBER = "966581965361";

/* ---------- shared tokens ---------- */
const BG = "#070E1F", CARD = "#101B36", BORDER = "#1E2E52";
const GOLD = "#D9A653", GREEN = "#5B8FD4", TEXT = "#F1F5FB";
const MUTE = "#9FB0CE", FAINT = "#6C7FA6";
const HERE_API_KEY = "-ZUX_FxV-ok4896M-TXR2aqAShTd04KfYRqS_3_JGAM";

/* ---------- shared HERE Maps SDK loader ---------- */
let hereSdkPromise = null;
/* ---------- shared push notification sender ---------- */
async function sendPush(driverPhone, title, body) {
  if (!driverPhone) return;
  try {
    await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverPhone, title, body }),
    });
  } catch (e) { /* push is best-effort; in-app notification already saved */ }
}

/* ---------- lightweight in-memory cache (cuts redundant API calls when navigating back/forth) ---------- */
const _dataCache = new Map();
async function cachedFetch(key, fetchFn, ttlMs = 60000) {
  const cached = _dataCache.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) return cached.data;
  const data = await fetchFn();
  _dataCache.set(key, { data, ts: Date.now() });
  return data;
}

function loadHereMapsSDK() {
  if (hereSdkPromise) return hereSdkPromise;
  hereSdkPromise = new Promise((resolve, reject) => {
    function loadScript(src) {
      return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) return res();
        const s = document.createElement("script"); s.src = src; s.async = true;
        s.onload = res; s.onerror = () => rej(new Error("fail"));
        document.head.appendChild(s);
      });
    }
    function loadCss(href) {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    }
    (async () => {
      try {
        loadCss("https://js.api.here.com/v3/3.1/mapsjs-ui.css");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-core.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-service.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js");
        resolve();
      } catch (e) { reject(e); }
    })();
  });
  return hereSdkPromise;
}

/* ---------- LIVE DRIVER TRACKING MAP (passenger side — shows driver marker moving toward pickup) ---------- */
function LiveDriverMap({ pickupCoords, driverLat, driverLng }) {
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    loadHereMapsSDK().then(() => {
      if (cancelled || !window.H || !mapDivRef.current || mapObjRef.current) return;
      const platform = new window.H.service.Platform({ apikey: HERE_API_KEY });
      const defaultLayers = platform.createDefaultLayers();
      const map = new window.H.Map(mapDivRef.current, defaultLayers.vector.normal.map, { zoom: 13, center: pickupCoords, pixelRatio: window.devicePixelRatio || 1 });
      new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
      const pickupIcon = new window.H.map.Icon("data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect x="3" y="3" width="14" height="14" rx="3" fill="#5B8FD4" stroke="#070E1F" stroke-width="2"/></svg>`));
      map.addObject(new window.H.map.Marker(pickupCoords, { icon: pickupIcon }));
      if (driverLat && driverLng) {
        const carIcon = new window.H.map.Icon("data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="11" fill="#0F211E" stroke="#D9A653" stroke-width="2"/><path d="M8 15 L9 11 Q9.5 10 10.5 10 H15.5 Q16.5 10 17 11 L18 15 Z" fill="#D9A653"/></svg>`), { anchor: { x: 13, y: 13 } });
        const marker = new window.H.map.Marker({ lat: driverLat, lng: driverLng }, { icon: carIcon });
        map.addObject(marker);
        driverMarkerRef.current = marker;
        map.getViewModel().setLookAtData({ bounds: new window.H.geo.Rect(
          Math.max(pickupCoords.lat, driverLat) + 0.01, Math.min(pickupCoords.lng, driverLng) - 0.01,
          Math.min(pickupCoords.lat, driverLat) - 0.01, Math.max(pickupCoords.lng, driverLng) + 0.01,
        ) });
      }
      mapObjRef.current = map;
      setStatus("ready");
      window.addEventListener("resize", () => map.getViewPort().resize());
    }).catch(() => setStatus("error"));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapObjRef.current || !window.H || !driverLat || !driverLng) return;
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setGeometry({ lat: driverLat, lng: driverLng });
    } else {
      const carIcon = new window.H.map.Icon("data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="11" fill="#0F211E" stroke="#D9A653" stroke-width="2"/><path d="M8 15 L9 11 Q9.5 10 10.5 10 H15.5 Q16.5 10 17 11 L18 15 Z" fill="#D9A653"/></svg>`), { anchor: { x: 13, y: 13 } });
      const marker = new window.H.map.Marker({ lat: driverLat, lng: driverLng }, { icon: carIcon });
      mapObjRef.current.addObject(marker);
      driverMarkerRef.current = marker;
    }
  }, [driverLat, driverLng]);

  return (
    <div className="w-full rounded-2xl overflow-hidden relative mt-4" style={{ height: 160, background: CARD, border: `1px solid ${BORDER}` }}>
      <div ref={mapDivRef} className="w-full h-full" />
      {status === "loading" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><Navigation size={18} color={GOLD} /></div>}
      {status === "error" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><p className="text-[10px]" style={{ color: FAINT }}>Map unavailable</p></div>}
    </div>
  );
}

/* ---------- SOUND ALERT (used for driver-side new ride offer notification, no external file needed) ---------- */
function playOfferAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function beep(freq, delay) {
      setTimeout(() => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        o.start(); o.stop(ctx.currentTime + 0.32);
      }, delay);
    }
    beep(880, 0); beep(1100, 380);
  } catch (e) { /* audio is best-effort */ }
}

const SAUDI_CITY_COORDS = {
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Jeddah: { lat: 21.4858, lng: 39.1925 },
  Makkah: { lat: 21.3891, lng: 39.8579 },
  Madinah: { lat: 24.5247, lng: 39.5692 },
  Dammam: { lat: 26.4207, lng: 50.0888 },
  Khobar: { lat: 26.2172, lng: 50.1971 },
  Taif: { lat: 21.2703, lng: 40.4158 },
  Abha: { lat: 18.2164, lng: 42.5053 },
  Tabuk: { lat: 28.3838, lng: 36.5550 },
  Najran: { lat: 17.4924, lng: 44.1277 },
  Jazan: { lat: 16.8892, lng: 42.5511 },
  "Al Kharj": { lat: 24.1556, lng: 47.3350 },
  Buraidah: { lat: 26.3260, lng: 43.9750 },
  "Khamis Mushait": { lat: 18.3000, lng: 42.7333 },
  Hofuf: { lat: 25.3833, lng: 49.5833 },
  Sakaka: { lat: 29.9697, lng: 40.2064 },
};

/* ---------- reusable draggable pickup pin map ---------- */
function PinMapPicker({ coords, onMove, height = 150 }) {
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadHereMapsSDK();
        if (cancelled || !window.H || !mapDivRef.current) return;
        const platform = new window.H.service.Platform({ apikey: HERE_API_KEY });
        const defaultLayers = platform.createDefaultLayers();
        const map = new window.H.Map(mapDivRef.current, defaultLayers.vector.normal.map, { zoom: 14, center: coords, pixelRatio: window.devicePixelRatio || 1 });
        const behavior = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        const icon = new window.H.map.Icon(
          "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="9" fill="#D9A653" stroke="#0F211E" stroke-width="3"/></svg>`),
          { size: { w: 30, h: 30 }, anchor: { x: 15, y: 15 } }
        );
        const marker = new window.H.map.Marker(coords, { icon, volatility: true });
        marker.draggable = true;
        map.addObject(marker);
        map.addEventListener("dragstart", (ev) => { if (ev.target === marker) map.getViewPort().element.style.cursor = "grabbing"; });
        map.addEventListener("drag", (ev) => {
          if (ev.target !== marker) return;
          const pointer = ev.currentPointer;
          marker.setGeometry(map.screenToGeo(pointer.viewportX, pointer.viewportY));
        });
        map.addEventListener("dragend", (ev) => {
          if (ev.target !== marker) return;
          map.getViewPort().element.style.cursor = "default";
          const geo = marker.getGeometry();
          onMove({ lat: geo.lat, lng: geo.lng });
        });
        map.addEventListener("tap", (ev) => {
          if (ev.target !== map) return;
          const pointer = ev.currentPointer;
          const geo = map.screenToGeo(pointer.viewportX, pointer.viewportY);
          marker.setGeometry(geo);
          onMove({ lat: geo.lat, lng: geo.lng });
        });
        markerRef.current = marker;
        mapObjRef.current = map;
        window.addEventListener("resize", () => map.getViewPort().resize());
        setStatus("ready");
      } catch (e) { if (!cancelled) setStatus("error"); }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mapObjRef.current && markerRef.current && status === "ready") {
      mapObjRef.current.setCenter(coords);
      markerRef.current.setGeometry(coords);
    }
  }, [coords.lat, coords.lng]);

  return (
    <div className="rounded-2xl overflow-hidden relative mb-4" style={{ height, background: CARD, border: `1px solid ${BORDER}` }}>
      <div ref={mapDivRef} className="w-full h-full" />
      {status === "loading" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><Navigation size={18} color={GOLD} /></div>}
      {status === "error" && <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: CARD }}><p className="text-[11px]" style={{ color: FAINT }}>Map couldn't load — check connection.</p></div>}
      {status === "ready" && <p className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px]" style={{ background: "rgba(15,33,30,0.85)", color: FAINT }}>Drag the pin to set pickup point</p>}
    </div>
  );
}


/* ---------- Saudi Arabia cities & districts ---------- */
const SAUDI_CITIES = {
  Riyadh: ["Al Olaya", "Al Malaz", "Al Naseem", "Al Yasmin", "King Fahd District", "Al Sulimaniyah", "Diriyah", "Al Rawdah", "Al Nakheel", "Al Malqa", "Al Narjis", "Hittin", "Al Wadi", "Al Sahafah", "Al Aqiq", "Al Ghadir", "King Abdullah District", "Al Nada", "Al Rabie", "Al Izdihar", "Al Falah", "Al Wurud", "Al Muruj", "An Nuzhah", "Qurtubah", "Al Rimal", "Ishbiliyah", "Al Rayyan", "Al Mursalat", "Al Munsiyah", "Al Andalus", "Al Rabwah", "Al Masif", "Al Muhammadiyah", "Diplomatic Quarter", "Al Murabba", "Ad Dirah", "Al Batha", "Umm Al Hamam East", "Umm Al Hamam West", "As Sulay", "Ad Dar Al Baida", "Al Manar", "Ash Shifa", "Ash Shuhada", "Al Fayha", "Al Jazeera", "Al Yamamah", "Namar", "Dhahrat Laban", "Irqah", "Al Aziziyah", "Laban", "Badr", "Uraija", "As Suwaidi", "Okaz", "Al Wisham", "Al Marwah", "Al Manakh", "Al Faisaliyah", "Salah Al Din", "Ar Rehab", "Ar Rahmaniyah", "Al Iskan", "Al Hazm", "Taybah", "As Salam", "Ad Dubbat", "Ar Rawabi", "Al Yarmuk", "Al Qadisiyah", "Ash Sharafeyah", "Ad Difa", "Al Khaleej"],
  Jeddah: ["Al Balad", "Al Hamra", "Al Rawdah", "Al Salamah", "Al Zahra", "Obhur", "Al Faisaliyah"],
  Dammam: ["Al Faisaliyah", "Al Shati", "Al Adamah", "Al Manar", "Uhud District"],
  Makkah: ["Al Aziziyah", "Al Awali", "Al Naseem", "Ajyad", "Al Shubaikah"],
  Madinah: ["Al Haram", "Quba", "Al Aziziyah", "Al Salam", "Al Naqa"],
  Khobar: ["Al Aqrabiyah", "Al Thuqbah", "Al Ulaya", "Al Rakah", "Al Bandariyah"],
  Taif: ["Al Hawiyah", "Shubra", "Al Salamah", "Al Faisaliyah"],
  Abha: ["Al Manhal", "Al Sad", "Al Numais", "Al Warood"],
  Tabuk: ["Al Wajh Road", "Al Muruj", "Al Nahdah", "Sharma"],
  Qassim: ["Buraidah Center", "Unaizah", "Al Rass", "Al Bukayriyah"],
  Jubail: ["Al Fanateer", "Al Huwaylat", "Al Deffi", "Al Jalmoodah"],
  Yanbu: ["Yanbu Al Bahr", "Yanbu Al Sinaiyah", "Al Sharaf"],
  Najran: ["Al Ma'athah", "Al Fahd", "Al Nasseem"],
  Hail: ["Al Salam", "Al Wadi", "Al Nafal"],
  Jazan: ["Al Rawdah", "Al Safa", "Al Muntazah"],
  "Al Kharj": ["Al Nasim", "Al Salhiyah", "Al Rowaidah"],
  Buraidah: ["Al Faysaliyah", "King Fahd", "Al Iskan"],
  "Khamis Mushait": ["Al Sad", "Al Nahdah", "Al Sharaf"],
  Hofuf: ["Al Muthanna", "Al Rakah", "Al Naseem"],
  Sakaka: ["Al Nakheel", "Al Wasat", "Al Sharqi"],
};
const SAUDI_CITY_LIST = Object.keys(SAUDI_CITIES);
const SAUDI_PLACES = SAUDI_CITY_LIST.flatMap((city) =>
  SAUDI_CITIES[city].map((district) => ({ label: `${district}, ${city}`, district, city }))
);

/* ---------- geolocation helper ---------- */
function detectLocation({ onStart, onSuccess, onError, _retriesLeft = 2 }) {
  if (!navigator.geolocation) {
    onError && onError("Geolocation isn't supported on this browser.", "unsupported");
    return;
  }
  onStart && onStart();

  async function resolveWithCoords(latitude, longitude) {
    try {
      const res = await fetch(
        `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&lang=en-US&apiKey=${HERE_API_KEY}`
      );
      if (!res.ok) throw new Error("reverse geocode failed");
      const data = await res.json();
      const address = data?.items?.[0]?.address;
      const label = address?.label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const city = address?.city || null;
      try { localStorage.setItem("sayyara_last_location", JSON.stringify({ lat: latitude, lng: longitude, label, city, ts: Date.now() })); } catch (e) {}
      onSuccess && onSuccess({ lat: latitude, lng: longitude, label, city });
    } catch (e) {
      try { localStorage.setItem("sayyara_last_location", JSON.stringify({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, city: null, ts: Date.now() })); } catch (err) {}
      onSuccess && onSuccess({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (address lookup failed)` });
    }
  }

  function handleFailure(err) {
    // Permission denied — no point retrying, and don't fall back silently since the user explicitly said no
    if (err.code === 1) {
      onError && onError("Location permission denied — allow location access for this site in your browser settings.", "denied");
      return;
    }
    // Timed out / unavailable — retry automatically a couple of times before giving up
    if (_retriesLeft > 0) {
      setTimeout(() => detectLocation({ onStart: undefined, onSuccess, onError, _retriesLeft: _retriesLeft - 1 }), 1200);
      return;
    }
    // Out of retries — fall back to last known location if we have one (offline recovery)
    try {
      const cached = JSON.parse(localStorage.getItem("sayyara_last_location") || "null");
      if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
        onSuccess && onSuccess({ lat: cached.lat, lng: cached.lng, label: `${cached.label} (last known location)`, city: cached.city });
        return;
      }
    } catch (e) {}
    const messages = { 2: "Your location is unavailable right now — try again.", 3: "Location request timed out — try again." };
    onError && onError(messages[err.code] || "Couldn't get your location.", "unavailable");
  }

  // A single getCurrentPosition() reading on mobile can return a coarse, network-based
  // fix before the GPS chip locks on. Sample for a few seconds and keep whichever
  // reading reports the best (lowest) accuracy radius, exiting early on a good fix.
  let best = null;
  let settled = false;
  let watchId = null;

  function settle() {
    if (settled) return;
    settled = true;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (best) resolveWithCoords(best.lat, best.lng);
    else handleFailure({ code: 3 });
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const acc = pos.coords.accuracy ?? 9999;
      if (!best || acc < best.accuracy) {
        best = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: acc };
      }
      if (acc <= 15) settle(); // GPS-grade fix already — no need to keep waiting
    },
    (err) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (best) { settle(); return; }
      handleFailure(err);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );

  setTimeout(settle, 4000); // give the GPS chip a few seconds to refine before locking in the best sample
}

/* ---------- language system ---------- */
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "tl", label: "Tagalog", native: "Tagalog" },
];
const RTL_LANGS = ["ar", "ur"];

const TRANSLATIONS = {
  en: {
    tagline: "One app. Every way to move, earn, and deliver.",
    whereTo: "Where to?",
    bookRideNow: "Book a ride now",
    services: "Services",
    available: "available",
    home: "Home", activity: "Activity", wallet: "Wallet", profile: "Profile",
    ride: "Ride", cityRides: "City rides",
    airport: "Airport", transfers: "Transfers",
    intercity: "Outside city", cityToCity: "City to city",
    rentals: "Rentals", rentACar: "Rent a car",
    marketplace: "Marketplace", buySell: "Buy & sell",
    food: "Food", delivery: "Delivery",
    logistics: "Logistics", sendParcels: "Send parcels",
    jobs: "Jobs", driveEarn: "Drive & earn",
    fleet: "Fleet", manageCars: "Manage cars",
    useMyLocation: "Use my current location",
    detecting: "Detecting location…",
  },
  ar: {
    tagline: "تطبيق واحد. كل وسيلة للتنقل والعمل والتوصيل.",
    whereTo: "إلى أين؟",
    bookRideNow: "احجز رحلة الآن",
    services: "الخدمات",
    available: "متاحة",
    home: "الرئيسية", activity: "النشاط", wallet: "المحفظة", profile: "الملف",
    ride: "رحلة", cityRides: "رحلات داخل المدينة",
    airport: "المطار", transfers: "نقل",
    intercity: "خارج المدينة", cityToCity: "من مدينة لمدينة",
    rentals: "تأجير", rentACar: "استأجر سيارة",
    marketplace: "السوق", buySell: "بيع وشراء",
    food: "طعام", delivery: "توصيل",
    logistics: "لوجستيات", sendParcels: "إرسال طرود",
    jobs: "وظائف", driveEarn: "قد واربح",
    fleet: "الأسطول", manageCars: "إدارة السيارات",
    useMyLocation: "استخدم موقعي الحالي",
    detecting: "جارٍ تحديد الموقع…",
  },
  ur: {
    tagline: "ایک ایپ۔ سفر، کمائی اور ڈیلیوری کا ہر طریقہ۔",
    whereTo: "کہاں جانا ہے؟",
    bookRideNow: "ابھی سواری بک کریں",
    services: "خدمات",
    available: "دستیاب",
    home: "ہوم", activity: "سرگرمی", wallet: "والٹ", profile: "پروفائل",
    ride: "سواری", cityRides: "شہر کے اندر سواری",
    airport: "ہوائی اڈہ", transfers: "ٹرانسفر",
    intercity: "شہر سے باہر", cityToCity: "شہر سے شہر",
    rentals: "کرایہ", rentACar: "کار کرائے پر لیں",
    marketplace: "بازار", buySell: "خرید و فروخت",
    food: "کھانا", delivery: "ڈیلیوری",
    logistics: "لاجسٹکس", sendParcels: "پارسل بھیجیں",
    jobs: "ملازمتیں", driveEarn: "ڈرائیو کریں اور کمائیں",
    fleet: "فلیٹ", manageCars: "گاڑیوں کا انتظام",
    useMyLocation: "میرا موجودہ مقام استعمال کریں",
    detecting: "مقام کا پتہ لگایا جا رہا ہے…",
  },
  hi: {
    tagline: "एक ऐप। चलने, कमाने और डिलीवरी का हर तरीका।",
    whereTo: "कहाँ जाना है?",
    bookRideNow: "अभी सवारी बुक करें",
    services: "सेवाएं",
    available: "उपलब्ध",
    home: "होम", activity: "गतिविधि", wallet: "वॉलेट", profile: "प्रोफ़ाइल",
    ride: "सवारी", cityRides: "शहर के भीतर सवारी",
    airport: "हवाई अड्डा", transfers: "स्थानांतरण",
    intercity: "शहर के बाहर", cityToCity: "शहर से शहर",
    rentals: "किराया", rentACar: "कार किराए पर लें",
    marketplace: "बाज़ार", buySell: "खरीदें और बेचें",
    food: "भोजन", delivery: "डिलीवरी",
    logistics: "लॉजिस्टिक्स", sendParcels: "पार्सल भेजें",
    jobs: "नौकरियां", driveEarn: "ड्राइव करें और कमाएं",
    fleet: "फ्लीट", manageCars: "कारों का प्रबंधन",
    useMyLocation: "मेरा वर्तमान स्थान उपयोग करें",
    detecting: "स्थान का पता लगाया जा रहा है…",
  },
  tl: {
    tagline: "Isang app. Bawat paraan para gumalaw, kumita, at maghatid.",
    whereTo: "Saan tayo pupunta?",
    bookRideNow: "Mag-book ng sakay ngayon",
    services: "Mga serbisyo",
    available: "magagamit",
    home: "Home", activity: "Aktibidad", wallet: "Wallet", profile: "Profile",
    ride: "Sakay", cityRides: "Sakay sa loob ng lungsod",
    airport: "Paliparan", transfers: "Transpers",
    intercity: "Labas ng lungsod", cityToCity: "Lungsod hanggang lungsod",
    rentals: "Renta", rentACar: "Umarkila ng kotse",
    marketplace: "Marketplace", buySell: "Bumili at magbenta",
    food: "Pagkain", delivery: "Delivery",
    logistics: "Logistics", sendParcels: "Magpadala ng parsela",
    jobs: "Trabaho", driveEarn: "Magmaneho at kumita",
    fleet: "Fleet", manageCars: "Pamahalaan ang mga sasakyan",
    useMyLocation: "Gamitin ang kasalukuyang lokasyon ko",
    detecting: "Hinahanap ang lokasyon…",
  },
};

/* ---------- language picker modal ---------- */
function LanguagePicker({ lang, setLang, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8" style={{ background: CARD, border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: BORDER }} />
        <h3 className="text-sm font-semibold mb-4" style={{ color: TEXT }}>Choose language</h3>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); onClose(); }}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: lang === l.code ? "rgba(217,166,83,0.14)" : "transparent", border: `1px solid ${lang === l.code ? GOLD : BORDER}` }}
            >
              <span className="text-sm font-semibold" style={{ color: TEXT }}>{l.native}</span>
              {lang === l.code && <CheckCircle2 size={16} color={GOLD} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Riyadh skyline + desert silhouette background ---------- */
function SkylineBackground({ opacity = 1 }) {
  return (
    <svg
      className="absolute left-0 right-0 bottom-0 w-full pointer-events-none select-none"
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax slice"
      style={{ height: 260, opacity }}
    >
      <defs>
        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BG} stopOpacity="0" />
          <stop offset="100%" stopColor={BG} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* stars */}
      <circle cx="30" cy="25" r="1" fill={GOLD} opacity="0.7" />
      <circle cx="110" cy="14" r="1.3" fill={GOLD} opacity="0.5" />
      <circle cx="250" cy="20" r="1" fill={GOLD} opacity="0.7" />
      <circle cx="370" cy="12" r="1.4" fill={GOLD} opacity="0.5" />
      <circle cx="70" cy="48" r="0.8" fill={TEXT} opacity="0.35" />
      <circle cx="290" cy="42" r="0.8" fill={TEXT} opacity="0.35" />
      <circle cx="200" cy="10" r="1" fill={TEXT} opacity="0.3" />

      {/* crescent moon with glow */}
      <circle cx="345" cy="32" r="18" fill="url(#glowGold)" opacity="0.6" />
      <circle cx="345" cy="32" r="11" fill={GOLD} opacity="0.9" />
      <circle cx="350" cy="28" r="10" fill={BG} />

      {/* desert dunes, layered */}
      <path d="M0,210 Q70,180 150,205 T400,208 V240 H0 Z" fill={CARD} opacity="0.85" />
      <path d="M0,222 Q90,198 190,215 T400,218 V240 H0 Z" fill={BORDER} opacity="0.65" />
      <path d="M0,232 Q120,215 250,228 T400,228 V240 H0 Z" fill="#0B1730" opacity="0.8" />

      {/* Kingdom Centre Tower */}
      <g opacity="0.95">
        <rect x="55" y="95" width="9" height="115" fill={CARD} />
        <path d="M51,97 L55,58 L64,58 L68,97 Q59.5,88 51,97 Z" fill={CARD} />
        <rect x="57" y="60" width="4" height="14" fill={GOLD} opacity="0.5" />
      </g>

      {/* Al Faisaliyah Tower */}
      <g opacity="0.95">
        <polygon points="178,210 172,118 184,118" fill={CARD} />
        <circle cx="178" cy="108" r="8" fill={CARD} />
        <circle cx="178" cy="108" r="3" fill={GOLD} opacity="0.6" />
      </g>

      {/* Masmak-style fort silhouette */}
      <g opacity="0.85">
        <rect x="95" y="185" width="34" height="25" fill={CARD} />
        <rect x="93" y="178" width="6" height="10" fill={CARD} />
        <rect x="122" y="178" width="6" height="10" fill={CARD} />
        <rect x="107" y="175" width="6" height="13" fill={CARD} />
      </g>

      {/* Mosque dome + minarets */}
      <g opacity="0.9">
        <rect x="228" y="160" width="6" height="50" fill={CARD} />
        <circle cx="231" cy="155" r="5" fill={CARD} />
        <path d="M244,210 Q244,178 262,178 Q280,178 280,210 Z" fill={CARD} />
        <rect x="273" y="150" width="5" height="35" fill={CARD} />
        <circle cx="275.5" cy="145" r="4" fill={CARD} />
        <rect x="248" y="150" width="5" height="35" fill={CARD} />
        <circle cx="250.5" cy="145" r="4" fill={CARD} />
      </g>

      {/* Kingdom Tower distant right */}
      <g opacity="0.7">
        <rect x="315" y="140" width="7" height="70" fill={CARD} />
        <path d="M312,142 L315,112 L322,112 L325,142 Q318.5,134 312,142 Z" fill={CARD} />
      </g>

      {/* palm accents */}
      <g opacity="0.75">
        <line x1="345" y1="212" x2="345" y2="192" stroke={CARD} strokeWidth="2" />
        <path d="M345,192 Q333,186 327,192 M345,192 Q357,186 363,192 M345,192 Q336,180 330,184 M345,192 Q354,180 360,184" stroke={CARD} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g opacity="0.6">
        <line x1="20" y1="216" x2="20" y2="200" stroke={CARD} strokeWidth="1.6" />
        <path d="M20,200 Q10,195 6,200 M20,200 Q30,195 34,200" stroke={CARD} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>

      <rect x="0" y="0" width="400" height="240" fill="url(#skyFade)" />
    </svg>
  );
}

function Header({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Go back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}>
          <ArrowLeft size={17} color={TEXT} />
        </button>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: TEXT }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* ---------- SKELETON LOADING ---------- */
/* ---------- SEARCHING ANIMATION (looking for a driver) ---------- */
function SearchingAnimation() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
      <span className="absolute rounded-full animate-ping" style={{ width: 60, height: 60, background: "rgba(217,166,83,0.25)" }} />
      <span className="absolute rounded-full animate-ping" style={{ width: 40, height: 40, background: "rgba(217,166,83,0.35)", animationDelay: "0.3s" }} />
      <div className="relative w-11 h-11 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
        <Car size={18} color={BG} />
      </div>
    </div>
  );
}

function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: BORDER, borderRadius: 10, ...style }}
    />
  );
}
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <Skeleton style={{ height: 110, borderRadius: 0 }} />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton style={{ height: 12, width: "70%" }} />
        <Skeleton style={{ height: 10, width: "45%" }} />
      </div>
    </div>
  );
}
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <Skeleton style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton style={{ height: 12, width: "60%" }} />
        <Skeleton style={{ height: 10, width: "35%" }} />
      </div>
    </div>
  );
}

/* ---------- EMPTY STATE (reusable) ---------- */
function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-5">
      {Icon && <Icon size={32} color={FAINT} />}
      <p className="text-sm font-semibold mt-3">{title}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: FAINT }}>{subtitle}</p>}
      {action}
    </div>
  );
}

/* ---------- HOME ---------- */
const SERVICES = [
  { id: "rentals", label: "Rentals", sub: "Rent a car", subKey: "rentACar", icon: Key },
  { id: "market", label: "Marketplace", sub: "Buy & sell", subKey: "buySell", icon: ShoppingBag },
  { id: "food", label: "Food", sub: "Delivery", subKey: "delivery", icon: UtensilsCrossed },
  { id: "logistics", label: "Logistics", sub: "Send parcels", subKey: "sendParcels", icon: Truck },
  { id: "jobs", label: "Jobs", sub: "Drive & earn", subKey: "driveEarn", icon: Briefcase },
];

/* ---------- identity helper (used by header + profile + app menu) ---------- */
function resolveIdentity(currentDriver) {
  if (currentDriver?.profile) {
    return {
      name: currentDriver.profile.full_name || "Account",
      id: currentDriver.profile.mobile_number || currentDriver.email || "",
      type: currentDriver.type === "driver" ? "Driver" : "Passenger",
      loggedIn: true,
    };
  }
  try {
    const name = localStorage.getItem("sayyara_chat_name");
    const phone = localStorage.getItem("sayyara_chat_phone");
    if (name && phone) return { name, id: phone, type: "Guest ID", loggedIn: false };
  } catch (e) {}
  return { name: "Guest", id: "Not signed in", type: null, loggedIn: false };
}

function AppMenu({ onClose, navigate, currentDriver, driverLogout, identity }) {
  const items = [
    { icon: User, label: "My profile", route: "profile" },
    { icon: MessageCircle, label: "Friends & family", route: "friends" },
    { icon: Bell, label: "Notifications", route: "notifications" },
    { icon: Settings, label: "Account settings", route: "profile" },
    { icon: HelpCircle, label: "Help & support", route: "support_chat" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-[78%] max-w-xs h-full flex flex-col" style={{ background: CARD, borderRight: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-8 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold mb-3" style={{ background: BORDER, color: GOLD }}>
            {identity.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold truncate" style={{ color: TEXT }}>{identity.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{identity.id}</p>
          {identity.type && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(217,166,83,0.14)", color: GOLD }}>
              {identity.type}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { onClose(); navigate(item.route); }}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm"
              style={{ color: TEXT }}
            >
              <item.icon size={16} color={GOLD} /> {item.label}
            </button>
          ))}
        </div>
        <div className="px-5 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          {identity.loggedIn ? (
            <button onClick={() => { onClose(); driverLogout(); }} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "#C0755B", color: "#fff" }}>
              <LogOut size={15} /> Sign out
            </button>
          ) : (
            <button onClick={() => { onClose(); navigate("passenger_login"); }} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>
              <LogIn size={15} /> Log in / Sign up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Home({ navigate, lang, setLang, t, currentDriver, driverLogout }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const identity = resolveIdentity(currentDriver);
  useEffect(() => {
    async function loadUnread() {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("recipient_type", "all").eq("read", false);
      setUnreadCount(count || 0);
    }
    loadUnread();
  }, []);
  return (
    <div className="pb-4 relative overflow-hidden" style={{ color: TEXT }} dir={RTL_LANGS.includes(lang) ? "rtl" : "ltr"}>
      <SkylineBackground opacity={0.9} />
      <div className="relative flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={() => setShowAppMenu(true)} aria-label="Menu" className="flex items-center gap-2 min-w-0">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: CARD }}><Menu size={18} color={TEXT} /></span>
          <span className="flex flex-col items-start leading-tight min-w-0">
            <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: TEXT }}>{identity.name}</span>
            <span className="text-[9px] truncate max-w-[100px]" style={{ color: FAINT }}>{identity.id}</span>
          </span>
        </button>
        <div className="text-[10px] uppercase" style={{ color: GREEN, letterSpacing: "0.25em" }}>Riyadh, Saudi Arabia</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLangPicker(true)}
            className="px-2.5 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{ background: CARD, color: GOLD }}
          >
            {lang.toUpperCase()}
          </button>
          <button onClick={() => navigate("friends")} aria-label="Friends & family chat" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}>
            <MessageCircle size={17} color={TEXT} />
          </button>
          <button onClick={() => navigate("notifications")} aria-label="Notifications" className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: CARD }}>
            <Bell size={17} color={TEXT} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />}
          </button>
        </div>
      </div>
      {showAppMenu && <AppMenu onClose={() => setShowAppMenu(false)} navigate={navigate} currentDriver={currentDriver} driverLogout={driverLogout} identity={identity} />}
      {showLangPicker && <LanguagePicker lang={lang} setLang={setLang} onClose={() => setShowLangPicker(false)} />}
      <div className="relative px-5 pt-4 pb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #B8863B)`, boxShadow: `0 4px 14px rgba(217,166,83,0.35)` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 20 L4 10 L12 4 L20 10 L20 20" stroke={BG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 20 V13 H15 V20" stroke={BG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
            سيارة<span style={{ color: GOLD }}>Drive</span>
          </h1>
        </div>
        <p className="mt-2 text-sm" style={{ color: MUTE }}>{t("tagline")}</p>
      </div>
      <div className="relative px-5 mb-7">
        <button
          onClick={() => navigate("ride")}
          className="relative w-full text-left rounded-3xl p-5 overflow-hidden active:scale-[0.99] transition-transform"
          style={{
            background: `linear-gradient(135deg, ${CARD} 0%, #142347 100%)`,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
            style={{ background: `radial-gradient(circle, rgba(217,166,83,0.18), transparent 70%)` }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>{t("whereTo")}</p>
              <p className="text-xl font-semibold mt-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t("bookRideNow")}</p>
              <p className="text-[11px] mt-1" style={{ color: FAINT }}>Arriving in minutes, anywhere in the city</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}, #B8863B)`, boxShadow: "0 6px 16px rgba(217,166,83,0.4)" }}>
              <ChevronRight size={22} color={BG} style={{ transform: RTL_LANGS.includes(lang) ? "rotate(180deg)" : "none" }} />
            </div>
          </div>
        </button>
      </div>
      <div className="relative px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t("services")}</h2>
          <span className="text-xs" style={{ color: GREEN }}>{SERVICES.length} {t("available")}</span>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => navigate(s.id)} className="flex flex-col items-start gap-2 rounded-xl p-3 text-left active:scale-95" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={18} color={GOLD} /></div>
                <div><p className="text-xs font-semibold leading-tight">{t(s.id === "market" ? "marketplace" : s.id)}</p><p className="text-[10px] mt-0.5" style={{ color: FAINT }}>{t(s.subKey)}</p></div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- RIDE BOOKING ---------- */
const RIDE_TYPES = [
  { id: "economy", label: "Economy", eta: "4 min", price: 18, icon: Car, fareMult: 1 },
  { id: "comfort", label: "Comfort", eta: "6 min", price: 27, icon: Zap, fareMult: 1.4 },
  { id: "family", label: "Family", eta: "8 min", price: 38, icon: Users2, fareMult: 1.9 },
];
const AIRPORTS = ["King Khalid International (RUH)", "King Abdulaziz International (JED)", "King Fahd International (DMM)"];
const AIRPORT_VEHICLES = [
  { id: "sedan", label: "Sedan", seats: "1-3", bags: 2, price: 85, img: "https://loremflickr.com/300/220/sedan,car/all?lock=61" },
  { id: "suv", label: "SUV", seats: "1-5", bags: 4, price: 130, img: "https://loremflickr.com/300/220/suv,car/all?lock=62" },
  { id: "van", label: "Van", seats: "1-8", bags: 8, price: 190, img: "https://loremflickr.com/300/220/passenger-van/all?lock=63" },
];
const AIRPORT_CITY = { [AIRPORTS[0]]: "Riyadh", [AIRPORTS[1]]: "Jeddah", [AIRPORTS[2]]: "Dammam" };
const CITIES = SAUDI_CITY_LIST;
const INTERCITY_OPTIONS = [{ id: "shared", label: "Shared seat", sub: "Share with others", price: 120 }, { id: "private", label: "Private car", sub: "Full car", price: 480 }, { id: "private_suv", label: "Private SUV", sub: "Full SUV", price: 650 }];

function BookRide({ goBack }) {
  const [mode, setMode] = useState("city"); // city | airport | intercity
  const [stage, setStage] = useState("input");
  const [bookingRef, setBookingRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [surge, setSurge] = useState(1);

  function fareFor(tier) {
    const distanceKm = routeInfo ? parseFloat(routeInfo.distanceKm) : 3;
    const durationMin = routeInfo ? routeInfo.durationMin : 10;
    const base = 6, perKm = 1.7, perMin = 0.35;
    const raw = (base + distanceKm * perKm + durationMin * perMin) * (tier.fareMult || 1);
    return Math.round(raw * surge);
  }

  async function computeSurge() {
    try {
      const [{ count: pending }, { count: onlineDrivers }] = await Promise.all([
        supabase.from("rides").select("id", { count: "exact", head: true }).eq("status", "requested").eq("ride_type", "city").eq("city", pickupCity),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("is_online", true),
      ]);
      const p = pending || 0, d = onlineDrivers || 0;
      const ratio = d > 0 ? p / d : p > 0 ? 2 : 0;
      const mult = Math.min(2.5, Math.max(1, 1 + ratio * 0.6));
      setSurge(Math.round(mult * 10) / 10);
    } catch (e) { setSurge(1); }
  }
  useEffect(() => { if (mode === "city" && stage === "choose") computeSurge(); }, [mode, stage]);

  useEffect(() => {
    if (stage === "confirmed" && !bookingRef) {
      const ref = `RIDE-${Date.now().toString(36).toUpperCase()}`;
      setBookingRef(ref);
      const rideData = mode === "city"
        ? { booking_ref: ref, ride_type: "city", pickup_label: pickup, dropoff_label: dropoff, pickup_lat: pickupCoords.lat, pickup_lng: pickupCoords.lng, city: pickupCity, status: "requested", distance_km: routeInfo?.distanceKm || null, duration_min: routeInfo?.durationMin || null, fare_estimate: fareFor(chosenRide), surge_multiplier: surge }
        : mode === "airport"
        ? { booking_ref: ref, ride_type: "airport", pickup_label: direction === "to" ? address : `${AIRPORTS.find(a => a === airport) || airport} (pickup)`, dropoff_label: direction === "to" ? airport : address, pickup_lat: aptCoords.lat, pickup_lng: aptCoords.lng, city: cityForAirport, scheduled_date: aptDate, scheduled_time: aptTime, status: "requested" }
        : { booking_ref: ref, ride_type: "intercity", pickup_label: icPickupLabel || icFrom, dropoff_label: icTo, pickup_lat: icPickupCoords.lat, pickup_lng: icPickupCoords.lng, city: icFrom, scheduled_date: icDate, scheduled_time: icTime, status: "requested" };
      supabase.from("rides").insert(rideData).then(() => {
        try {
          const saved = JSON.parse(localStorage.getItem("sayyara_my_rides") || "[]");
          localStorage.setItem("sayyara_my_rides", JSON.stringify([ref, ...saved].slice(0, 50)));
        } catch (e) {}
      });
    }
    if (stage === "input") setBookingRef(null);
  }, [stage]);

  async function cancelRide() {
    if (bookingRef) {
      await supabase.from("rides").update({ status: "cancelled" }).eq("booking_ref", bookingRef);
      if (rideDriverId) {
        const { data: driver } = await supabase.from("drivers").select("mobile_number").eq("id", rideDriverId).maybeSingle();
        if (driver?.mobile_number) {
          await supabase.from("notifications").insert({ recipient_phone: driver.mobile_number, recipient_type: "driver", title: "Ride cancelled", body: "The passenger cancelled this ride." });
          sendPush(driver.mobile_number, "Ride cancelled", "The passenger cancelled this ride.");
        }
      }
    }
    setStage("cancelled");
  }

  const [rideStatus, setRideStatus] = useState(null);
  const [rideDriverId, setRideDriverId] = useState(null);
  const [driverDistanceKm, setDriverDistanceKm] = useState(null);
  const [driverLiveLoc, setDriverLiveLoc] = useState(null);
  useEffect(() => {
    if (stage !== "confirmed" || !bookingRef) return;
    async function poll() {
      if (document.hidden) return;
      const { data } = await supabase.from("rides").select("status, driver_id, drivers(last_lat, last_lng)").eq("booking_ref", bookingRef).maybeSingle();
      if (data) {
        setRideStatus(data.status); setRideDriverId(data.driver_id);
        const dLoc = data.drivers;
        if (dLoc?.last_lat && (data.status === "accepted" || data.status === "arrived")) {
          const R = 6371;
          const dLat = (dLoc.last_lat - pickupCoords.lat) * Math.PI / 180;
          const dLng = (dLoc.last_lng - pickupCoords.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(dLoc.last_lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          setDriverDistanceKm((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
          setDriverLiveLoc({ lat: dLoc.last_lat, lng: dLoc.last_lng });
        } else {
          setDriverDistanceKm(null);
          setDriverLiveLoc(null);
        }
      }
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [stage, bookingRef]);

  function rideStatusText(defaultTitle, defaultSubtitle) {
    switch (rideStatus) {
      case "accepted": return { title: "Driver on the way", subtitle: "Your driver accepted the ride and is heading to pickup." };
      case "arrived": return { title: "Your driver has arrived", subtitle: "They're waiting at the pickup point." };
      case "in_progress": return { title: "Trip in progress", subtitle: "Enjoy your ride!" };
      case "completed": return { title: "Trip completed", subtitle: "Hope you had a great trip!" };
      default: return { title: defaultTitle, subtitle: defaultSubtitle };
    }
  }

  // --- city ride state ---
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [pickup, setPickup] = useState("Current location");
  const [pickupCoords, setPickupCoords] = useState({ lat: 24.7136, lng: 46.6753 });
  const [pickupCity, setPickupCity] = useState("Riyadh");
  const [dropoff, setDropoff] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeLineRef = useRef(null);

  async function geocodeAndRoute(label) {
    setRouteLoading(true);
    setRouteInfo(null);
    try {
      const geoRes = await fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(label + ", Saudi Arabia")}&apiKey=${HERE_API_KEY}`);
      const geoData = await geoRes.json();
      const pos = geoData?.items?.[0]?.position;
      if (!pos) { setRouteLoading(false); return; }
      setDropoffCoords({ lat: pos.lat, lng: pos.lng });

      const routeRes = await fetch(`https://router.hereapi.com/v8/routes?transportMode=car&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${pos.lat},${pos.lng}&return=summary,polyline&alternatives=1&apiKey=${HERE_API_KEY}`);
      const routeData = await routeRes.json();
      const route = routeData?.routes?.[0];
      const summary = route?.sections?.[0]?.summary;
      if (summary) {
        setRouteInfo({ distanceKm: (summary.length / 1000).toFixed(1), durationMin: Math.round(summary.duration / 60), altCount: routeData.routes.length });
      }
      if (route?.sections?.[0]?.polyline && window.H && mapObjRef.current) {
        if (routeLineRef.current) { mapObjRef.current.removeObject(routeLineRef.current); routeLineRef.current = null; }
        const lineString = window.H.geo.LineString.fromFlexiblePolyline(route.sections[0].polyline);
        const routeLine = new window.H.map.Polyline(lineString, { style: { lineWidth: 4, strokeColor: "#D9A653" } });
        mapObjRef.current.addObject(routeLine);
        routeLineRef.current = routeLine;
        mapObjRef.current.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
      }
    } catch (e) { /* route calculation is best-effort */ }
    setRouteLoading(false);
  }

  const [activeField, setActiveField] = useState(null); // "pickup" | "dropoff" | null
  const cityPlaces = SAUDI_PLACES.filter((p) => p.city === pickupCity);
  const [pickupLive, setPickupLive] = useState([]);
  const [dropoffLive, setDropoffLive] = useState([]);

  // live autosuggest — covers every real neighborhood, not just our static shortlist
  useEffect(() => {
    if (activeField !== "pickup" || !pickup.trim() || pickup === "Current location") { setPickupLive([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const center = SAUDI_CITY_COORDS[pickupCity] || SAUDI_CITY_COORDS.Riyadh;
        const res = await fetch(`https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(pickup)}&at=${center.lat},${center.lng}&in=countryCode:SAU&limit=6&lang=en-US&apiKey=${HERE_API_KEY}`, { signal: controller.signal });
        const data = await res.json();
        const items = (data?.items || []).filter((it) => it.address?.label || it.title).map((it) => ({ label: it.address?.label || it.title, lat: it.position?.lat, lng: it.position?.lng }));
        setPickupLive(items);
      } catch (e) { /* network/aborted — static fallback list still shows below */ }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [pickup, activeField, pickupCity]);

  useEffect(() => {
    if (activeField !== "dropoff" || !dropoff.trim()) { setDropoffLive([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const center = SAUDI_CITY_COORDS[pickupCity] || SAUDI_CITY_COORDS.Riyadh;
        const res = await fetch(`https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(dropoff)}&at=${center.lat},${center.lng}&in=countryCode:SAU&limit=6&lang=en-US&apiKey=${HERE_API_KEY}`, { signal: controller.signal });
        const data = await res.json();
        const items = (data?.items || []).filter((it) => it.address?.label || it.title).map((it) => ({ label: it.address?.label || it.title, lat: it.position?.lat, lng: it.position?.lng }));
        setDropoffLive(items);
      } catch (e) { /* network/aborted — static fallback list still shows below */ }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [dropoff, activeField, pickupCity]);

  const pickupSuggestions = activeField === "pickup" && pickup.trim()
    ? (pickupLive.length > 0 ? pickupLive : cityPlaces.filter((p) => p.label.toLowerCase().includes(pickup.toLowerCase())).slice(0, 6))
    : [];
  const dropoffSuggestions = activeField === "dropoff" && dropoff.trim()
    ? (dropoffLive.length > 0 ? dropoffLive : cityPlaces.filter((p) => p.label.toLowerCase().includes(dropoff.toLowerCase())).slice(0, 6))
    : [];
  const [rideType, setRideType] = useState("economy");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const chosenRide = RIDE_TYPES.find((r) => r.id === rideType);

  useEffect(() => {
    function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script"); s.src = src; s.async = true;
        s.onload = resolve; s.onerror = () => reject(new Error("fail"));
        document.head.appendChild(s);
      });
    }
    function loadCss(href) {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    }
    async function init() {
      try {
        loadCss("https://js.api.here.com/v3/3.1/mapsjs-ui.css");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-core.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-service.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js");
        if (!window.H || !mapRef.current) throw new Error("no sdk");
        const platform = new window.H.service.Platform({ apikey: HERE_API_KEY });
        const defaultLayers = platform.createDefaultLayers();
        const map = new window.H.Map(mapRef.current, defaultLayers.vector.normal.map, { zoom: 14, center: pickupCoords, pixelRatio: window.devicePixelRatio || 1 });
        new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        new window.H.ui.UI.createDefault(map, defaultLayers);
        const icon = new window.H.map.Icon(
          "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="9" fill="#5B8FD4" stroke="#070E1F" stroke-width="3"/></svg>`)
        );
        const marker = new window.H.map.Marker(pickupCoords, { icon });
        map.addObject(marker);
        markerRef.current = marker;
        mapObjRef.current = map;
        setMapStatus("ready");
        window.addEventListener("resize", () => map.getViewPort().resize());
      } catch (e) { setMapStatus("error"); }
    }
    init();
  }, []);

  function useMyLocationCity() {
    detectLocation({
      onStart: () => { setLocating(true); setLocError(""); },
      onSuccess: ({ lat, lng, label, city }) => {
        setPickup(label);
        setPickupCoords({ lat, lng });
        if (city) {
          const matched = SAUDI_CITY_LIST.find((c) => c.toLowerCase() === city.toLowerCase()) ||
            SAUDI_CITY_LIST.find((c) => city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(city.toLowerCase()));
          if (matched) setPickupCity(matched);
        }
        setLocating(false);
        if (mapObjRef.current && markerRef.current) {
          mapObjRef.current.setCenter({ lat, lng });
          markerRef.current.setGeometry({ lat, lng });
        }
      },
      onError: (msg) => { setLocating(false); setLocError(msg); },
    });
  }

  // --- airport transfer state ---
  const [direction, setDirection] = useState("to");
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const [district, setDistrict] = useState(SAUDI_CITIES[AIRPORT_CITY[AIRPORTS[0]]][0]);
  const [address, setAddress] = useState("");
  const [aptCoords, setAptCoords] = useState(SAUDI_CITY_COORDS[AIRPORT_CITY[AIRPORTS[0]]] || SAUDI_CITY_COORDS.Riyadh);
  const [aptLocating, setAptLocating] = useState(false);
  const [aptLocError, setAptLocError] = useState("");
  const [aptDate, setAptDate] = useState(""); const [aptTime, setAptTime] = useState("");
  const [vehicle, setVehicle] = useState("sedan");
  const chosenVehicle = AIRPORT_VEHICLES.find((v) => v.id === vehicle);
  const cityForAirport = AIRPORT_CITY[airport];

  async function reverseGeocodeCoords(lat, lng) {
    try {
      const res = await fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=en-US&apiKey=${HERE_API_KEY}`);
      const data = await res.json();
      return data?.items?.[0]?.address?.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
  }

  async function onAptPinMove(coords) {
    setAptCoords(coords);
    const label = await reverseGeocodeCoords(coords.lat, coords.lng);
    setAddress(label);
  }

  function useMyLocationAirport() {
    detectLocation({
      onStart: () => { setAptLocating(true); setAptLocError(""); },
      onSuccess: ({ label, lat, lng }) => { setAddress(label); setAptCoords({ lat, lng }); setAptLocating(false); },
      onError: (msg) => { setAptLocating(false); setAptLocError(msg); },
    });
  }

  // --- intercity state ---
  const [icFrom, setIcFrom] = useState("Riyadh"); const [icTo, setIcTo] = useState("Jeddah");
  const [icDate, setIcDate] = useState(""); const [icTime, setIcTime] = useState("");
  const [icPickupCoords, setIcPickupCoords] = useState(SAUDI_CITY_COORDS.Riyadh);
  const [icPickupLabel, setIcPickupLabel] = useState("");

  async function onIcPinMove(coords) {
    setIcPickupCoords(coords);
    const label = await reverseGeocodeCoords(coords.lat, coords.lng);
    setIcPickupLabel(label);
  }
  const [icOption, setIcOption] = useState("shared");
  const chosenIntercity = INTERCITY_OPTIONS.find((o) => o.id === icOption);

  function switchMode(m) {
    setMode(m);
    setStage("input");
  }

  const canContinue =
    mode === "city" ? dropoff.trim() :
    mode === "airport" ? (aptDate && aptTime) :
    (icFrom !== icTo && icDate && icTime);

  function goChoose() {
    if (canContinue) setStage("choose");
  }

  const MODE_TABS = [
    { id: "city", label: "City" },
    { id: "airport", label: "Airport" },
    { id: "intercity", label: "Outside city" },
  ];

  return (
    <div style={{ color: TEXT }}>
      <Header title="Book a ride" onBack={goBack} />

      {/* trip type switcher */}
      <div className="px-5 mb-4 flex rounded-full p-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {MODE_TABS.map((m) => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            className="flex-1 rounded-full py-2 text-xs font-semibold"
            style={{ background: mode === m.id ? GOLD : "transparent", color: mode === m.id ? BG : MUTE }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ---------- CITY RIDE ---------- */}
      {mode === "city" && stage === "input" && (
        <>
          <div className="mx-5 rounded-2xl relative overflow-hidden" style={{ height: 200, background: CARD, border: `1px solid ${BORDER}` }}>
            <div ref={mapRef} className="w-full h-full" />
            {mapStatus === "loading" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><Navigation size={20} color={GOLD} /></div>}
            {mapStatus === "error" && <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: CARD }}><p className="text-[11px]" style={{ color: FAINT }}>Map couldn't load — check connection or try again.</p></div>}
          </div>
          <div className="px-5 mt-4 relative">
            <div className="rounded-2xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <Circle size={10} color={GREEN} fill={GREEN} />
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  onFocus={() => setActiveField("pickup")}
                  onBlur={() => setTimeout(() => setActiveField((f) => (f === "pickup" ? null : f)), 150)}
                  className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}
                />
              </div>
              <div className="flex items-center gap-3 py-3">
                <Square size={9} color={GOLD} fill={GOLD} />
                <input
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  onFocus={() => setActiveField("dropoff")}
                  onBlur={() => setTimeout(() => setActiveField((f) => (f === "dropoff" ? null : f)), 150)}
                  placeholder="Where to?"
                  className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}
                />
              </div>
            </div>
            {pickupSuggestions.length > 0 && (
              <div className="absolute left-5 right-5 mt-1 rounded-xl overflow-hidden z-20" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                {pickupSuggestions.map((p) => (
                  <button key={p.label} onMouseDown={() => { setPickup(p.label); setActiveField(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <MapPin size={12} color={GREEN} /> {p.label}
                  </button>
                ))}
              </div>
            )}
            {dropoffSuggestions.length > 0 && (
              <div className="absolute left-5 right-5 mt-1 rounded-xl overflow-hidden z-20" style={{ background: CARD, border: `1px solid ${BORDER}`, top: 68 }}>
                {dropoffSuggestions.map((p) => (
                  <button key={p.label} onMouseDown={() => { setDropoff(p.label); setActiveField(null); geocodeAndRoute(p.label); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <MapPin size={12} color={GOLD} /> {p.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={useMyLocationCity} disabled={locating} className="w-full mt-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold" style={{ background: "rgba(217,166,83,0.12)", color: GOLD }}>
              <Navigation size={13} className={locating ? "animate-pulse" : ""} /> {locating ? "Detecting location…" : "Use my current location"}
            </button>
            {locError && <p className="text-[11px] text-center mt-2" style={{ color: "#C0755B" }}>{locError}</p>}
            {routeLoading && <p className="text-[11px] text-center mt-2" style={{ color: FAINT }}>Calculating route…</p>}
            {routeInfo && !routeLoading && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs" style={{ color: MUTE }}>
                <span className="flex items-center gap-1"><Route size={12} color={GOLD} /> {routeInfo.distanceKm} km</span>
                <span className="flex items-center gap-1"><Clock size={12} color={GOLD} /> ~{routeInfo.durationMin} min</span>
                {routeInfo.altCount > 1 && <span style={{ color: FAINT }}>{routeInfo.altCount} routes available</span>}
              </div>
            )}
            <button onClick={goChoose} disabled={!canContinue} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: canContinue ? GOLD : BORDER, color: canContinue ? BG : "#5C736D" }}>
              Find rides
            </button>
          </div>
        </>
      )}

      {mode === "city" && stage === "choose" && (
        <div className="px-5 mt-1">
          {surge > 1.1 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "rgba(192,117,91,0.14)", border: `1px solid rgba(192,117,91,0.35)` }}>
              <Zap size={13} color="#C0755B" />
              <p className="text-[11px] font-semibold" style={{ color: "#C0755B" }}>{surge}x surge pricing — high demand nearby</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {RIDE_TYPES.map((r) => {
              const Icon = r.icon, isSel = rideType === r.id;
              return (
                <button key={r.id} onClick={() => setRideType(r.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
                    <div className="text-left"><p className="text-sm font-semibold">{r.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{r.eta} away</p></div>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosenRide.label}</button>
        </div>
      )}

      {mode === "city" && stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          {(!rideStatus || rideStatus === "requested") ? <SearchingAnimation /> : <CheckCircle2 size={44} color={GREEN} />}
          <h2 className="mt-4 text-lg font-semibold">{rideStatusText("Ride confirmed").title}</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>{rideStatusText("Ride confirmed", "Looking for a nearby driver. You'll be connected by WhatsApp.").subtitle}</p>
          {driverDistanceKm !== null && (
            <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: GOLD }}><Car size={12} /> Driver is {driverDistanceKm} km away</p>
          )}
          {(rideStatus === "accepted" || rideStatus === "arrived") && driverLiveLoc && (
            <LiveDriverMap pickupCoords={pickupCoords} driverLat={driverLiveLoc.lat} driverLng={driverLiveLoc.lng} />
          )}
          {rideStatus === "completed" && (
            <div className="w-full">
              <div className="rounded-2xl px-4 py-3 mt-4 text-left" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold mb-2" style={{ color: MUTE }}>Trip summary</p>
                <p className="text-xs" style={{ color: FAINT }}>{pickup} → {dropoff}</p>
                {routeInfo && (
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: TEXT }}>
                    <span className="flex items-center gap-1"><Route size={12} color={GOLD} /> {routeInfo.distanceKm} km</span>
                    <span className="flex items-center gap-1"><Clock size={12} color={GOLD} /> {routeInfo.durationMin} min</span>
                  </div>
                )}
              </div>
              <RatingPrompt ratingType="driver" targetId={rideDriverId} targetLabel="your driver" bookingRef={bookingRef} prompt="How was your driver?" />
            </div>
          )}
          <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this ride</button>
          <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          {rideStatus !== "completed" && <button onClick={cancelRide} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>}
        </div>
      )}
      {mode === "city" && stage === "cancelled" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <X size={44} color="#C0755B" />
          <h2 className="mt-4 text-lg font-semibold">Ride cancelled</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your ride has been cancelled.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}

      {/* ---------- AIRPORT TRANSFER ---------- */}
      {mode === "airport" && stage === "input" && (
        <div className="px-5">
          <div className="flex rounded-full p-1 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <button onClick={() => setDirection("to")} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold" style={{ background: direction === "to" ? GOLD : "transparent", color: direction === "to" ? BG : MUTE }}><PlaneTakeoff size={13} /> To airport</button>
            <button onClick={() => setDirection("from")} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold" style={{ background: direction === "from" ? GOLD : "transparent", color: direction === "from" ? BG : MUTE }}><PlaneLanding size={13} /> From airport</button>
          </div>
          <div className="rounded-2xl px-4 py-2 mb-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Plane size={15} color={GOLD} />
              <select value={airport} onChange={(e) => { setAirport(e.target.value); const newCity = AIRPORT_CITY[e.target.value]; setDistrict(SAUDI_CITIES[newCity][0]); setAptCoords(SAUDI_CITY_COORDS[newCity] || SAUDI_CITY_COORDS.Riyadh); }} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                {AIRPORTS.map((a) => <option key={a} style={{ background: CARD }}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <MapPin size={15} color={GREEN} />
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                {SAUDI_CITIES[cityForAirport].map((d) => <option key={d} style={{ background: CARD }}>{d}, {cityForAirport}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 py-3">
              <ChevronRight size={15} color={GREEN} />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Building / street (optional)" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
          </div>
          <PinMapPicker coords={aptCoords} onMove={onAptPinMove} height={130} />
          <button onClick={useMyLocationAirport} disabled={aptLocating} className="w-full mb-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold" style={{ background: "rgba(217,166,83,0.12)", color: GOLD }}>
            <Navigation size={13} className={aptLocating ? "animate-pulse" : ""} /> {aptLocating ? "Detecting location…" : "Use my current location"}
          </button>
          {aptLocError && <p className="text-[11px] text-center mb-3" style={{ color: "#C0755B" }}>{aptLocError}</p>}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Calendar size={14} color={GOLD} /><input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)} className="bg-transparent outline-none text-xs w-full" style={{ color: TEXT }} /></div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Clock size={14} color={GOLD} /><input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)} className="bg-transparent outline-none text-xs w-full" style={{ color: TEXT }} /></div>
          </div>
          <button onClick={goChoose} disabled={!canContinue} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: canContinue ? GOLD : BORDER, color: canContinue ? BG : "#5C736D" }}>See vehicles</button>
        </div>
      )}

      {mode === "airport" && stage === "choose" && (
        <div className="px-5">
          <div className="flex flex-col gap-2">
            {AIRPORT_VEHICLES.map((v) => {
              const isSel = vehicle === v.id;
              return (
                <button key={v.id} onClick={() => setVehicle(v.id)} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <img src={v.img} alt={v.label} loading="lazy" className="w-16 h-14 rounded-lg object-cover shrink-0" style={{ background: BORDER }} />
                  <div className="flex-1 flex items-center justify-between"><div className="text-left"><p className="text-sm font-semibold">{v.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{v.seats} seats · {v.bags} bags</p></div><p className="text-sm font-semibold">{v.price} SAR</p></div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosenVehicle.label} — {chosenVehicle.price} SAR</button>
        </div>
      )}

      {mode === "airport" && stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">{rideStatusText("Transfer booked").title}</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>{rideStatusText("Transfer booked", "Driver details shared via WhatsApp.").subtitle}</p>
          {rideStatus === "completed" && (
            <div className="w-full">
              <RatingPrompt ratingType="driver" targetId={rideDriverId} targetLabel="your driver" bookingRef={bookingRef} prompt="How was your driver?" />
            </div>
          )}
          <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this transfer</button>
          <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          {rideStatus !== "completed" && <button onClick={cancelRide} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>}
        </div>
      )}
      {mode === "airport" && stage === "cancelled" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Transfer cancelled</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your transfer has been cancelled.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}

      {/* ---------- INTERCITY ---------- */}
      {mode === "intercity" && stage === "input" && (
        <div className="px-5">
          <div className="rounded-2xl px-4 py-2 mb-4 relative" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><MapPin size={14} color={GREEN} /><select value={icFrom} onChange={(e) => { setIcFrom(e.target.value); setIcPickupCoords(SAUDI_CITY_COORDS[e.target.value] || SAUDI_CITY_COORDS.Riyadh); setIcPickupLabel(""); }} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <div className="flex items-center gap-3 py-3"><MapPin size={14} color={GOLD} /><select value={icTo} onChange={(e) => setIcTo(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <button onClick={() => { setIcFrom(icTo); setIcTo(icFrom); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BORDER }}><ArrowRightLeft size={14} color={GOLD} /></button>
          </div>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: FAINT }}>Exact pickup point in {icFrom}</p>
          <PinMapPicker coords={icPickupCoords} onMove={onIcPinMove} />
          {icPickupLabel && <p className="text-[11px] mb-4 -mt-2 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={11} color={GOLD} /> {icPickupLabel}</p>}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Calendar size={15} color={GOLD} /><input type="date" value={icDate} onChange={(e) => setIcDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Clock size={15} color={GOLD} /><input type="time" value={icTime} onChange={(e) => setIcTime(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <button onClick={goChoose} disabled={!canContinue} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: canContinue ? GOLD : BORDER, color: canContinue ? BG : "#5C736D" }}>See options</button>
        </div>
      )}

      {mode === "intercity" && stage === "choose" && (
        <div className="px-5">
          <div className="rounded-xl px-4 py-3 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}><p className="text-sm font-semibold">{icFrom} → {icTo}</p><p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: FAINT }}><Route size={11} /> {icDate} at {icTime}</p></div>
          <div className="flex flex-col gap-2">
            {INTERCITY_OPTIONS.map((o) => {
              const isSel = icOption === o.id;
              return (
                <button key={o.id} onClick={() => setIcOption(o.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="text-left"><p className="text-sm font-semibold">{o.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{o.sub}</p></div>
                  <p className="text-sm font-semibold">{o.price} SAR</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosenIntercity.label} — {chosenIntercity.price} SAR</button>
        </div>
      )}

      {mode === "intercity" && stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">{rideStatusText("Trip booked").title}</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>{icFrom} → {icTo} · {icDate} at {icTime}</p>
          {rideStatus && rideStatus !== "requested" && <p className="mt-1 text-xs" style={{ color: GREEN }}>{rideStatusText("", "").subtitle}</p>}
          {rideStatus === "requested" && <p className="mt-2 text-xs flex items-center gap-1.5" style={{ color: GREEN }}><MessageCircle size={13} /> Your driver will message you on WhatsApp with pickup details before departure.</p>}
          {rideStatus === "completed" && (
            <div className="w-full">
              <RatingPrompt ratingType="driver" targetId={rideDriverId} targetLabel="your driver" bookingRef={bookingRef} prompt="How was your driver?" />
            </div>
          )}
          <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this trip</button>
          <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          {rideStatus !== "completed" && <button onClick={cancelRide} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>}
        </div>
      )}
      {mode === "intercity" && stage === "cancelled" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Trip cancelled</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your trip has been cancelled.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}

      <div className="h-10" />
      {chatOpen && bookingRef && (
        <RideChat bookingRef={bookingRef} contextLabel={mode === "city" ? "City ride" : mode === "airport" ? "Airport transfer" : "Outside city trip"} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

/* ---------- DRIVER APP ---------- */
function DriverApp({ goBack, navigate, currentDriver }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const driverMarkerObjRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [online, setOnline] = useState(false);
  const [request, setRequest] = useState(null);
  const [tripState, setTripState] = useState("idle");
  const [driverLoc, setDriverLoc] = useState({ lat: 24.7136, lng: 46.6753 });
  const [locLabel, setLocLabel] = useState("Riyadh (default)");
  const [locError, setLocError] = useState("");
  const [locDenied, setLocDenied] = useState(false);
  const [declinedIds, setDeclinedIds] = useState([]);
  const [driverChatOpen, setDriverChatOpen] = useState(false);
  const [offerDeadline, setOfferDeadline] = useState(null);
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(0);
  const driverRow = currentDriver?.profile;

  useEffect(() => {
    if (driverRow?.id && !online) {
      setOnline(true);
      supabase.from("drivers").update({ is_online: true, last_lat: driverLoc.lat, last_lng: driverLoc.lng }).eq("id", driverRow.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverRow?.id]);

  useEffect(() => {
    detectLocation({
      onSuccess: ({ lat, lng, label }) => { setDriverLoc({ lat, lng }); setLocLabel(label); setLocDenied(false); },
      onError: (msg, type) => { setLocError(msg); setLocDenied(type === "denied"); },
    });
  }, []);

  useEffect(() => {
    function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script"); s.src = src; s.async = true;
        s.onload = resolve; s.onerror = () => reject(new Error("fail"));
        document.head.appendChild(s);
      });
    }
    function loadCss(href) {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    }
    async function init() {
      try {
        loadCss("https://js.api.here.com/v3/3.1/mapsjs-ui.css");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-core.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-service.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js");
        if (!window.H || !mapRef.current) throw new Error("no sdk");
        const platform = new window.H.service.Platform({ apikey: HERE_API_KEY });
        const defaultLayers = platform.createDefaultLayers();
        const map = new window.H.Map(mapRef.current, defaultLayers.vector.normal.traffic, { zoom: 13, center: driverLoc, pixelRatio: window.devicePixelRatio || 1 });
        new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        new window.H.ui.UI.createDefault(map, defaultLayers);
        const driverIcon = new window.H.map.Icon(
          "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#0F211E" stroke="#D9A653" stroke-width="2"/><path d="M9 17.5 L10.5 12.5 Q11 11 12.5 11 H17.5 Q19 11 19.5 12.5 L21 17.5 Z M9 17.5 H21 V19.5 Q21 20.5 20 20.5 H19 Q18 20.5 18 19.5 V19 H12 V19.5 Q12 20.5 11 20.5 H10 Q9 20.5 9 19.5 Z" fill="#D9A653"/><circle cx="11.5" cy="19" r="1.3" fill="#0F211E"/><circle cx="18.5" cy="19" r="1.3" fill="#0F211E"/></svg>`),
          { size: { w: 30, h: 30 }, anchor: { x: 15, y: 15 } }
        );
        const driverMarker = new window.H.map.Marker(driverLoc, { icon: driverIcon });
        map.addObject(driverMarker);
        driverMarkerObjRef.current = driverMarker;
        mapObjRef.current = map;
        setMapStatus("ready");
        window.addEventListener("resize", () => map.getViewPort().resize());
      } catch (e) { setMapStatus("error"); }
    }
    init();
  }, []);

  // Show pickup marker on the map when a ride request comes in
  useEffect(() => {
    if (!mapObjRef.current || !window.H) return;
    if (pickupMarkerRef.current) {
      mapObjRef.current.removeObject(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (request && request.pickup_lat) {
      const pickupCoords = { lat: request.pickup_lat, lng: request.pickup_lng };
      const icon = new window.H.map.Icon(
        "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#5B8FD4" stroke="#070E1F" stroke-width="3"/></svg>`)
      );
      const marker = new window.H.map.Marker(pickupCoords, { icon });
      mapObjRef.current.addObject(marker);
      pickupMarkerRef.current = marker;
      mapObjRef.current.getViewModel().setLookAtData({ bounds: new window.H.geo.Rect(
        Math.max(driverLoc.lat, pickupCoords.lat) + 0.01,
        Math.min(driverLoc.lng, pickupCoords.lng) - 0.01,
        Math.min(driverLoc.lat, pickupCoords.lat) - 0.01,
        Math.max(driverLoc.lng, pickupCoords.lng) + 0.01,
      ) });
    }
  }, [request]);

  // Sequential auto-dispatch: system offers each unassigned ride to the single nearest available driver at a time,
  // with a 15s exclusive claim window. If declined or the window expires, the ride recirculates to the next-nearest driver.
  useEffect(() => {
    if (!online || !driverRow || request) return;
    async function poll() {
      const nowIso = new Date().toISOString();
      const wantsOutsideCity = driverRow.city_type === "intercity";
      let query = supabase.from("rides").select("*").eq("status", "requested").is("driver_id", null);
      query = wantsOutsideCity ? query.eq("ride_type", "intercity") : query.in("ride_type", ["city", "airport"]);
      const { data } = await query.order("created_at", { ascending: true }).limit(20);
      const candidates = (data || []).filter((r) => !declinedIds.includes(r.id) && (!r.offered_driver_id || (r.offer_expires_at && r.offer_expires_at < nowIso)));
      if (candidates.length === 0) return;
      const withDistance = candidates.map((r) => {
        if (!r.pickup_lat) return { ...r, _distance: Infinity };
        const R = 6371;
        const dLat = (r.pickup_lat - driverLoc.lat) * Math.PI / 180;
        const dLng = (r.pickup_lng - driverLoc.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(driverLoc.lat * Math.PI / 180) * Math.cos(r.pickup_lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return { ...r, _distance: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
      });
      withDistance.sort((a, b) => a._distance - b._distance);
      // Try to atomically claim an exclusive 15s offer on the nearest candidate first, falling through if another driver beats us to it
      for (const candidate of withDistance) {
        const expiresAt = new Date(Date.now() + 15000).toISOString();
        const { data: claimed } = await supabase.from("rides")
          .update({ offered_driver_id: driverRow.id, offer_expires_at: expiresAt })
          .eq("id", candidate.id)
          .is("driver_id", null)
          .or(`offered_driver_id.is.null,offer_expires_at.lt.${nowIso}`)
          .select();
        if (claimed && claimed.length > 0) {
          setRequest(candidate);
          break;
        }
      }
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [online, driverRow, declinedIds, request, driverLoc]);

  // Play an alert sound and start the 15s decision countdown whenever a new offer arrives
  useEffect(() => {
    if (!request) { setOfferDeadline(null); return; }
    playOfferAlertSound();
    setOfferDeadline(Date.now() + 15000);
  }, [request]);

  useEffect(() => {
    if (!offerDeadline) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((offerDeadline - Date.now()) / 1000));
      setOfferSecondsLeft(secs);
      if (secs <= 0) autoDeclineOffer();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [offerDeadline]);

  async function autoDeclineOffer() {
    if (request) {
      await supabase.from("rides").update({ offered_driver_id: null, offer_expires_at: null }).eq("id", request.id).eq("offered_driver_id", driverRow?.id);
      setDeclinedIds((ids) => [...ids, request.id]);
    }
    setRequest(null);
    setOfferDeadline(null);
  }

  async function goOnline() {
    setOnline(true);
    if (driverRow?.id) {
      await supabase.from("drivers").update({ is_online: true, last_lat: driverLoc.lat, last_lng: driverLoc.lng }).eq("id", driverRow.id);
    }
  }
  async function goOffline() {
    setOnline(false); setRequest(null); setTripState("idle");
    if (driverRow?.id) {
      await supabase.from("drivers").update({ is_online: false }).eq("id", driverRow.id);
    }
  }

  // Live location broadcast while online — updates every 20s so passengers watching an active ride see real movement
  useEffect(() => {
    if (!online || !driverRow?.id) return;
    const interval = setInterval(() => {
      detectLocation({
        onSuccess: ({ lat, lng, label }) => {
          setDriverLoc({ lat, lng }); setLocLabel(label);
          supabase.from("drivers").update({ last_lat: lat, last_lng: lng }).eq("id", driverRow.id);
          if (driverMarkerObjRef.current) driverMarkerObjRef.current.setGeometry({ lat, lng });
        },
        onError: () => {},
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [online, driverRow?.id]);

  async function declineRequest() {
    if (request) {
      await supabase.from("rides").update({ offered_driver_id: null, offer_expires_at: null }).eq("id", request.id);
      setDeclinedIds((ids) => [...ids, request.id]);
    }
    setRequest(null);
    setOfferDeadline(null);
  }

  async function acceptRequest() {
    if (!request || !driverRow?.id) return;
    await supabase.from("rides").update({ status: "accepted", driver_id: driverRow.id, offer_expires_at: null }).eq("id", request.id);
    setOfferDeadline(null);
    setTripState("accepted");
  }

  async function markArrived() {
    if (request) await supabase.from("rides").update({ status: "arrived" }).eq("id", request.id);
    setTripState("arrived");
  }

  async function startTrip() {
    if (request) await supabase.from("rides").update({ status: "in_progress" }).eq("id", request.id);
    setTripState("in_progress");
  }

  async function completeTrip() {
    if (request) await supabase.from("rides").update({ status: "completed" }).eq("id", request.id);
    setTripState("completed");
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Driver" onBack={goBack} right={
        <button onClick={online ? goOffline : goOnline} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: online ? GREEN : BORDER, color: online ? BG : MUTE }}>
          <Power size={13} /> {online ? "Online" : "Go online"}
        </button>
      } />
      {currentDriver?.profile && (
        <div className="px-5 mb-3">
          <button onClick={() => navigate("driver_profile")} className="w-full rounded-xl px-4 py-2.5 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs" style={{ color: MUTE }}>Logged in as <span style={{ color: TEXT, fontWeight: 600 }}>{currentDriver.profile.full_name}</span></p>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: FAINT }}>{currentDriver.profile.city_type === "intercity" ? "Outside city" : "Inside-city"}</span>
              <ChevronRight size={13} color={FAINT} />
            </div>
          </button>
        </div>
      )}
      <div className="mx-5 rounded-2xl overflow-hidden relative" style={{ height: 220, background: CARD, border: `1px solid ${BORDER}` }}>
        <div ref={mapRef} className="w-full h-full" />
        {mapStatus === "loading" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><Navigation size={20} color={GOLD} /></div>}
        {mapStatus === "error" && <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: CARD }}><p className="text-[11px]" style={{ color: FAINT }}>Map blocked in this preview — will work on sayyaradrive.com</p></div>}
      </div>
      <p className="px-5 mt-2 text-[11px] flex items-center gap-1" style={{ color: FAINT }}><Navigation size={11} color={GREEN} /> {locLabel}</p>
      {locError && (
        <div className="px-5 mt-1">
          <p className="text-[11px]" style={{ color: "#C0755B" }}>{locError}</p>
          {locDenied ? (
            <p className="text-[10px] mt-1" style={{ color: FAINT }}>Look for the location icon in your browser's address bar to re-enable it, then reload the page.</p>
          ) : (
            <button onClick={() => detectLocation({ onSuccess: ({ lat, lng, label }) => { setDriverLoc({ lat, lng }); setLocLabel(label); setLocError(""); }, onError: (msg, type) => { setLocError(msg); setLocDenied(type === "denied"); } })} className="text-[11px] mt-1 underline" style={{ color: GOLD }}>Retry</button>
          )}
        </div>
      )}
      {online && !request && tripState === "idle" && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>You're online — waiting for requests…</p>}
      {!online && currentDriver?.profile && (
        <div className="px-5 mt-6">
          <p className="text-sm text-center" style={{ color: FAINT }}>Go online to start receiving ride requests.</p>
        </div>
      )}
      {!online && !currentDriver?.profile && (
        <div className="px-5 mt-6">
          <p className="text-sm text-center" style={{ color: FAINT }}>Go online to start receiving ride requests.</p>
          <button onClick={() => navigate("driver_login")} className="w-full mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><User size={15} color={GOLD} /> Already have an account? Log in / Sign up</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <button onClick={() => navigate("register_driver")} className="w-full mt-2 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Car size={15} color={GOLD} /> New driver? Submit an application first</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <p className="text-[10px] mt-2 text-center" style={{ color: FAINT }}>New drivers: submit an application for review. Once approved, use "Log in / Sign up" to create your account.</p>
        </div>
      )}
      {request && tripState === "idle" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">New ride request</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(217,166,83,0.15)", color: GOLD }}>{request.ride_type}</span>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: offerSecondsLeft <= 5 ? "rgba(192,117,91,0.2)" : "rgba(91,143,212,0.15)", color: offerSecondsLeft <= 5 ? "#C0755B" : GREEN }}>{offerSecondsLeft}</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: MUTE }}>{request.pickup_label} → {request.dropoff_label}</p>
            <div className="flex items-center gap-3 mt-1">
              {request._distance !== undefined && isFinite(request._distance) && (
                <p className="text-[11px] flex items-center gap-1" style={{ color: GOLD }}><Route size={11} /> {request._distance.toFixed(1)} km to pickup</p>
              )}
              {request.fare_estimate && (
                <p className="text-[11px] flex items-center gap-1" style={{ color: GREEN }}><DollarSign size={11} /> ~{request.fare_estimate} SAR</p>
              )}
            </div>
            {request.scheduled_date && <p className="text-[11px] mt-1" style={{ color: FAINT }}>{request.scheduled_date} {request.scheduled_time}</p>}
            <div className="w-full h-1 rounded-full mt-3 overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full transition-all" style={{ width: `${(offerSecondsLeft / 15) * 100}%`, background: offerSecondsLeft <= 5 ? "#C0755B" : GOLD }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={declineRequest} className="flex-1 rounded-full py-2.5 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Decline</button>
              <button onClick={acceptRequest} className="flex-1 rounded-full py-2.5 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Accept</button>
            </div>
          </div>
        </div>
      )}
      {tripState === "accepted" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <p className="text-sm font-semibold mb-3">Trip accepted — heading to pickup</p>
            <button onClick={() => setDriverChatOpen(true)} className="w-full mb-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat with passenger</button>
            <button onClick={markArrived} className="w-full rounded-full py-2.5 text-sm font-semibold" style={{ background: GREEN, color: BG }}>I've arrived at pickup</button>
          </div>
        </div>
      )}
      {tripState === "arrived" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <p className="text-sm font-semibold mb-3">Waiting for passenger</p>
            <button onClick={() => setDriverChatOpen(true)} className="w-full mb-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat with passenger</button>
            <button onClick={startTrip} className="w-full rounded-full py-2.5 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Start trip</button>
          </div>
        </div>
      )}
      {tripState === "in_progress" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <p className="text-sm font-semibold mb-3">Trip in progress</p>
            <button onClick={() => setDriverChatOpen(true)} className="w-full mb-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat with passenger</button>
            <button onClick={completeTrip} className="w-full rounded-full py-2.5 text-sm font-semibold" style={{ background: GREEN, color: BG }}>Complete trip</button>
          </div>
        </div>
      )}
      {tripState === "completed" && request && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: "rgba(91,143,212,0.1)", border: `1px solid rgba(91,143,212,0.3)` }}>
            <CheckCircle2 size={28} color={GREEN} />
            <p className="text-sm font-semibold mt-2">Trip completed</p>
          </div>
          <RatingPrompt ratingType="passenger" targetId={null} targetLabel="the passenger" bookingRef={request.booking_ref} prompt="How was your passenger?" reviewerName={currentDriver?.profile?.full_name} />
          <button onClick={() => { setTripState("idle"); setRequest(null); }} className="w-full mt-3 rounded-full py-2.5 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
        </div>
      )}
      {driverChatOpen && request && (
        <RideChat
          bookingRef={request.booking_ref}
          contextLabel={`${request.ride_type} ride — ${request.pickup_label}`}
          onClose={() => setDriverChatOpen(false)}
          senderRole="driver"
          senderName={currentDriver?.profile?.full_name || "Driver"}
        />
      )}
    </div>
  );
}

/* ---------- PARTNER / PROVIDER REGISTRATION ---------- */
const REGISTER_CONFIGS = {
  driver: {
    title: "Driver registration",
    icon: Car,
    intro: "Join SayyaraDrive as a driver and start earning on your own schedule.",
    detailFields: [
      { key: "vehicleModel", label: "Vehicle model", placeholder: "e.g. Toyota Camry 2021" },
      { key: "plateNumber", label: "Plate number", placeholder: "e.g. RUH 4021" },
      { key: "vehicleYear", label: "Vehicle year", placeholder: "e.g. 2021" },
    ],
    documents: ["National ID / Iqama", "Driving license", "Vehicle registration (Istimara)"],
  },
  rental_owner: {
    title: "List your car",
    icon: Key,
    intro: "Earn money by renting out your car when you're not using it.",
    detailFields: [
      { key: "vehicleModel", label: "Car model", placeholder: "e.g. Hyundai Elantra 2022" },
      { key: "plateNumber", label: "Plate number", placeholder: "e.g. JED 1122" },
      { key: "dailyRate", label: "Preferred daily rate (SAR)", placeholder: "e.g. 120" },
    ],
    documents: ["National ID / Iqama", "Vehicle registration (Istimara)", "Insurance document"],
  },
  seller: {
    title: "Become a seller",
    icon: ShoppingBag,
    intro: "Open your own store on the SayyaraDrive marketplace.",
    detailFields: [
      { key: "storeName", label: "Store / seller name", placeholder: "e.g. Riyadh Auto Parts" },
      { key: "category", label: "Main category", placeholder: "e.g. Spare parts, Electronics" },
    ],
    documents: ["National ID / Iqama", "Commercial registration (optional for individuals)"],
  },
  food_partner: {
    title: "Restaurant partner",
    icon: UtensilsCrossed,
    intro: "Bring your restaurant onto SayyaraDrive and reach more customers.",
    detailFields: [
      { key: "restaurantName", label: "Restaurant name", placeholder: "e.g. Najd Kitchen" },
      { key: "cuisine", label: "Cuisine type", placeholder: "e.g. Arabic, Fast food" },
    ],
    documents: ["Commercial registration", "Municipality license", "National ID / Iqama of owner"],
  },
  logistics_partner: {
    title: "Delivery partner",
    icon: Truck,
    intro: "Deliver parcels across your city and get paid per delivery.",
    detailFields: [
      { key: "vehicleType", label: "Vehicle type", placeholder: "e.g. Motorbike, Car, Van" },
    ],
    documents: ["National ID / Iqama", "Driving license (if applicable)"],
  },
  fleet_owner: {
    title: "Fleet company registration",
    icon: Users,
    intro: "Register your company's fleet to manage multiple vehicles and drivers.",
    detailFields: [
      { key: "companyName", label: "Company name", placeholder: "e.g. Al Rasheed Transport Co." },
      { key: "fleetSize", label: "Number of vehicles", placeholder: "e.g. 12" },
    ],
    documents: ["Commercial registration", "National ID / Iqama of owner"],
  },
};

function PartnerRegister({ goBack, type }) {
  const cfg = REGISTER_CONFIGS[type];
  const Icon = cfg.icon;
  const [step, setStep] = useState(1); // 1 personal, 2 details, 3 documents, 4 confirmed
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState(SAUDI_CITIES["Riyadh"][0]);
  const [details, setDetails] = useState({});
  const [checkedDocs, setCheckedDocs] = useState({});

  const step1Valid = name.trim() && phone.trim();
  const step2Valid = cfg.detailFields.every((f) => (details[f.key] || "").trim());
  const step3Valid = cfg.documents.every((d) => checkedDocs[d]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function toggleDoc(d) {
    setCheckedDocs((c) => ({ ...c, [d]: !c[d] }));
  }

  async function submitApplication() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const detailsText = cfg.detailFields.map((f) => `${f.label}: ${details[f.key]}`).join(" · ");
      await supabase.from("partner_applications").insert({
        type,
        full_name: name,
        phone,
        email: email || null,
        city,
        district,
        details: detailsText,
        status: "pending",
      });
      await supabase.from("notifications").insert({
        recipient_type: "admin",
        title: "New application received",
        body: `${name} applied as a ${type.replace(/_/g, " ")}`,
      });
      setStep(4);
    } catch (e) {
      setSubmitError("Something went wrong submitting your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const STEPS = ["Personal", "Details", "Documents"];

  return (
    <div style={{ color: TEXT }}>
      <Header title={cfg.title} onBack={goBack} />

      {step <= 3 && (
        <>
          <div className="px-5 mb-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.14)" }}>
              <Icon size={20} color={GOLD} />
            </div>
            <p className="text-xs" style={{ color: MUTE }}>{cfg.intro}</p>
          </div>

          <div className="px-5 mb-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: i + 1 <= step ? GOLD : BORDER }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="px-5">
          <p className="text-xs font-semibold mb-2" style={{ color: GREEN }}>PERSONAL INFORMATION</p>
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <User size={14} color={GOLD} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Phone size={14} color={GOLD} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (WhatsApp)" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Mail size={14} color={GOLD} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="rounded-xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <MapPin size={14} color={GREEN} />
                <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(SAUDI_CITIES[e.target.value][0]); }} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                  {SAUDI_CITY_LIST.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <MapPin size={14} color={GOLD} />
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                  {SAUDI_CITIES[city].map((d) => <option key={d} style={{ background: CARD }}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid} className="w-full rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: step1Valid ? GOLD : BORDER, color: step1Valid ? BG : "#5C736D" }}>
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="px-5">
          <p className="text-xs font-semibold mb-2" style={{ color: GREEN }}>
            {type === "seller" || type === "food_partner" || type === "fleet_owner" ? "BUSINESS DETAILS" : "VEHICLE DETAILS"}
          </p>
          <div className="flex flex-col gap-3 mb-6">
            {cfg.detailFields.map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <ChevronRight size={14} color={GOLD} />
                <input
                  value={details[f.key] || ""}
                  onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back</button>
            <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid} className="flex-1 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: step2Valid ? GOLD : BORDER, color: step2Valid ? BG : "#5C736D" }}>
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="px-5">
          <p className="text-xs font-semibold mb-2" style={{ color: GREEN }}>REQUIRED DOCUMENTS</p>
          <p className="text-[11px] mb-4" style={{ color: FAINT }}>Confirm you have these ready — you'll upload them after submitting, or send via WhatsApp.</p>
          <div className="flex flex-col gap-2 mb-6">
            {cfg.documents.map((d) => (
              <button key={d} onClick={() => toggleDoc(d)} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: CARD, border: checkedDocs[d] ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: checkedDocs[d] ? GOLD : "transparent", border: `1px solid ${checkedDocs[d] ? GOLD : BORDER}` }}>
                  {checkedDocs[d] && <Check size={13} color={BG} />}
                </div>
                <span className="text-sm">{d}</span>
              </button>
            ))}
          </div>
          {submitError && <p className="text-[12px] mb-2" style={{ color: "#C0755B" }}>{submitError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back</button>
            <button onClick={submitApplication} disabled={!step3Valid || submitting} className="flex-1 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: step3Valid ? GOLD : BORDER, color: step3Valid ? BG : "#5C736D" }}>
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} />
          <h2 className="mt-4 text-lg font-semibold">Application submitted</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>
            Our team will review your application and contact you on WhatsApp within 2-3 business days.
          </p>
          <div className="mt-6 w-full rounded-2xl px-4 py-4 text-left" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex justify-between text-sm py-1"><span style={{ color: FAINT }}>Applicant</span><span>{name}</span></div>
            <div className="flex justify-between text-sm py-1"><span style={{ color: FAINT }}>Phone</span><span>{phone}</span></div>
            <div className="flex justify-between text-sm py-1"><span style={{ color: FAINT }}>Location</span><span>{district}, {city}</span></div>
          </div>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}

/* ---------- CAR RENTAL ---------- */
const CARS = [
  // Lumi Rent a Car
  { id: "eco", label: "Economy", model: "Hyundai Accent", price: 95, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,sedan/all?lock=11" },
  { id: "eco2", label: "Economy", model: "Toyota Yaris", price: 90, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,yaris/all?lock=17" },
  { id: "lumi_compact", label: "Compact", model: "Kia Rio", price: 92, provider: "Lumi Rent a Car", transmission: "Manual", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,rio/all?lock=67" },
  { id: "lumi_sedan", label: "Sedan", model: "Nissan Sunny", price: 115, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,sedan/all?lock=51" },
  { id: "lumi_suv", label: "SUV", model: "Hyundai Tucson", price: 195, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,tucson/all?lock=52" },
  { id: "lumi_van", label: "Minivan", model: "Hyundai Staria", price: 255, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,staria/all?lock=68" },
  { id: "lumi_101", label: "Economy", model: "Suzuki Swift", price: 85, provider: "Lumi Rent a Car", transmission: "Manual", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/suzuki,swift/all?lock=101" },
  { id: "lumi_102", label: "Compact", model: "Honda City", price: 98, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/honda,city/all?lock=102" },
  { id: "lumi_103", label: "Sedan", model: "Toyota Corolla", price: 110, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,corolla/all?lock=103" },
  { id: "lumi_104", label: "Sedan", model: "Kia K5", price: 125, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,k5/all?lock=104" },
  { id: "lumi_105", label: "SUV", model: "Kia Sportage", price: 190, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,sportage/all?lock=105" },
  { id: "lumi_106", label: "SUV", model: "Nissan X-Trail", price: 210, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,xtrail/all?lock=106" },
  { id: "lumi_107", label: "Pickup", model: "Toyota Hilux", price: 180, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hilux/all?lock=107" },
  { id: "lumi_108", label: "Minivan", model: "Kia Carnival", price: 245, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,carnival/all?lock=108" },
  { id: "lumi_109", label: "Luxury", model: "Toyota Camry", price: 165, provider: "Lumi Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,camry/all?lock=109" },
  // Theeb Rent a Car
  { id: "theeb_eco", label: "Economy", model: "Kia Cerato", price: 100, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,cerato/all?lock=53" },
  { id: "sedan", label: "Sedan", model: "Toyota Camry", price: 145, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,camry/all?lock=12" },
  { id: "sedan2", label: "Sedan", model: "Honda Accord", price: 135, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/honda,accord/all?lock=18" },
  { id: "theeb_suv", label: "SUV", model: "Hyundai Santa Fe", price: 240, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,santa-fe/all?lock=54" },
  { id: "theeb_suv2", label: "SUV", model: "Toyota Fortuner", price: 225, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 7, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,fortuner/all?lock=69" },
  { id: "theeb_van", label: "Minivan", model: "Toyota Hiace", price: 235, provider: "Theeb Rent a Car", transmission: "Manual", seats: 12, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hiace/all?lock=62" },
  { id: "theeb_pickup", label: "Pickup", model: "Toyota Hilux", price: 195, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/pickup-truck/all?lock=16" },
  { id: "theeb_110", label: "Economy", model: "Nissan Sunny", price: 95, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,sunny/all?lock=110" },
  { id: "theeb_111", label: "Compact", model: "Hyundai Elantra", price: 108, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,elantra/all?lock=111" },
  { id: "theeb_112", label: "Sedan", model: "Mazda 6", price: 130, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/mazda,6/all?lock=112" },
  { id: "theeb_113", label: "SUV", model: "Ford Explorer", price: 260, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/ford,explorer/all?lock=113" },
  { id: "theeb_114", label: "SUV", model: "Chevrolet Traverse", price: 245, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,traverse/all?lock=114" },
  { id: "theeb_115", label: "Luxury", model: "Lexus ES", price: 340, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Hybrid", img: "https://loremflickr.com/400/300/lexus,es/all?lock=115" },
  { id: "theeb_116", label: "Minivan", model: "GMC Savana", price: 250, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 12, fuel: "Petrol", img: "https://loremflickr.com/400/300/gmc,savana/all?lock=116" },
  { id: "theeb_170", label: "Pickup", model: "Ford F-150", price: 240, provider: "Theeb Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/ford,f150-theeb/all?lock=170" },
  // Yelo Rent a Car
  { id: "yelo_eco", label: "Economy", model: "Toyota Yaris", price: 88, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,yaris-red/all?lock=70" },
  { id: "yelo_sedan", label: "Sedan", model: "Toyota Corolla", price: 120, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,corolla/all?lock=55" },
  { id: "suv", label: "SUV", model: "Toyota Fortuner", price: 220, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 7, fuel: "Diesel", img: "https://loremflickr.com/400/300/suv,car/all?lock=13" },
  { id: "suv2", label: "SUV", model: "Nissan Patrol", price: 310, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,patrol/all?lock=19" },
  { id: "yelo_luxury", label: "Luxury", model: "Genesis G80", price: 390, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/genesis,luxury-sedan/all?lock=56" },
  { id: "yelo_pickup", label: "Pickup", model: "Ford Ranger", price: 210, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/ford,ranger/all?lock=71" },
  { id: "yelo_117", label: "Economy", model: "Kia Picanto", price: 80, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,picanto/all?lock=117" },
  { id: "yelo_118", label: "Compact", model: "Hyundai Accent", price: 96, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,accent/all?lock=118" },
  { id: "yelo_119", label: "Sedan", model: "Nissan Altima", price: 128, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,altima/all?lock=119" },
  { id: "yelo_120", label: "SUV", model: "Hyundai Tucson", price: 200, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,tucson/all?lock=120" },
  { id: "yelo_121", label: "SUV", model: "Kia Sorento", price: 230, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,sorento/all?lock=121" },
  { id: "yelo_122", label: "Minivan", model: "Toyota Hiace", price: 240, provider: "Yelo Rent a Car", transmission: "Manual", seats: 12, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hiace/all?lock=122" },
  { id: "yelo_123", label: "Luxury", model: "Mercedes E-Class", price: 400, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/mercedes,eclass/all?lock=123" },
  { id: "yelo_124", label: "Pickup", model: "Toyota Hilux", price: 200, provider: "Yelo Rent a Car", transmission: "Manual", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hilux-red/all?lock=124" },
  { id: "yelo_125", label: "Compact", model: "Honda Civic", price: 115, provider: "Yelo Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/honda,civic/all?lock=125" },
  // Sixt Rent a Car
  { id: "sixt_sedan", label: "Sedan", model: "Mercedes C-Class", price: 350, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/mercedes,sedan/all?lock=57" },
  { id: "luxury", label: "Luxury", model: "Lexus ES", price: 380, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Hybrid", img: "https://loremflickr.com/400/300/lexus,luxury-car/all?lock=14" },
  { id: "luxury2", label: "Luxury", model: "BMW 5 Series", price: 420, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/bmw,luxury-sedan/all?lock=20" },
  { id: "sixt_suv", label: "SUV", model: "Range Rover Sport", price: 550, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/range-rover,suv/all?lock=58" },
  { id: "sixt_suv2", label: "SUV", model: "Porsche Cayenne", price: 620, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/porsche,cayenne/all?lock=72" },
  { id: "sixt_convertible", label: "Convertible", model: "BMW 4 Series", price: 480, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/bmw,convertible/all?lock=73" },
  { id: "sixt_126", label: "Economy", model: "Toyota Corolla", price: 130, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,corolla-white/all?lock=126" },
  { id: "sixt_127", label: "Sedan", model: "Audi A4", price: 340, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/audi,a4/all?lock=127" },
  { id: "sixt_128", label: "Luxury", model: "Audi A8", price: 550, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/audi,a8/all?lock=128" },
  { id: "sixt_129", label: "Luxury", model: "Mercedes S-Class", price: 650, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/mercedes,sclass/all?lock=129" },
  { id: "sixt_130", label: "SUV", model: "BMW X5", price: 500, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/bmw,x5/all?lock=130" },
  { id: "sixt_131", label: "SUV", model: "Land Cruiser", price: 480, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,landcruiser/all?lock=131" },
  { id: "sixt_132", label: "Sports", model: "Mustang GT", price: 450, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/ford,mustang/all?lock=132" },
  { id: "sixt_133", label: "Convertible", model: "Mercedes C-Class Cabriolet", price: 520, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/mercedes,cabriolet/all?lock=133" },
  { id: "sixt_134", label: "Van", model: "Mercedes V-Class", price: 400, provider: "Sixt Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/mercedes,vclass/all?lock=134" },
  // Hanco Rent a Car
  { id: "hanco_eco", label: "Economy", model: "Chevrolet Aveo", price: 88, provider: "Hanco Rent a Car", transmission: "Manual", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,aveo/all?lock=60" },
  { id: "hanco_eco2", label: "Economy", model: "Hyundai Accent", price: 92, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,accent/all?lock=74" },
  { id: "hanco_sedan", label: "Sedan", model: "Toyota Camry", price: 140, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,camry-white/all?lock=59" },
  { id: "hanco_suv", label: "SUV", model: "Hyundai Tucson", price: 200, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,tucson-black/all?lock=75" },
  { id: "van", label: "Minivan", model: "Hyundai Staria", price: 260, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/minivan,van/all?lock=15" },
  { id: "hanco_pickup", label: "Pickup", model: "Toyota Hilux", price: 190, provider: "Hanco Rent a Car", transmission: "Manual", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/pickup-hilux/all?lock=76" },
  { id: "hanco_135", label: "Compact", model: "Kia Rio", price: 95, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,rio-black/all?lock=135" },
  { id: "hanco_136", label: "Sedan", model: "Nissan Sunny", price: 112, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,sunny-black/all?lock=136" },
  { id: "hanco_137", label: "SUV", model: "Chevrolet Trailblazer", price: 220, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,trailblazer/all?lock=137" },
  { id: "hanco_138", label: "SUV", model: "Jeep Grand Cherokee", price: 260, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/jeep,grandcherokee/all?lock=138" },
  { id: "hanco_139", label: "Luxury", model: "Nissan Maxima", price: 175, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,maxima/all?lock=139" },
  { id: "hanco_140", label: "Pickup", model: "GMC Sierra", price: 250, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/gmc,sierra/all?lock=140" },
  { id: "hanco_141", label: "Minivan", model: "Kia Carnival", price: 250, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,carnival-black/all?lock=141" },
  { id: "hanco_142", label: "Economy", model: "Kia Picanto", price: 80, provider: "Hanco Rent a Car", transmission: "Manual", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,picanto-black/all?lock=142" },
  { id: "hanco_143", label: "Compact", model: "Toyota Yaris", price: 90, provider: "Hanco Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,yaris-black/all?lock=143" },
  // Key Rent a Car
  { id: "key_eco", label: "Economy", model: "Kia Picanto", price: 80, provider: "Key Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,picanto/all?lock=77" },
  { id: "key_sedan", label: "Sedan", model: "Nissan Sunny", price: 112, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,sunny/all?lock=78" },
  { id: "key_suv", label: "SUV", model: "GMC Yukon", price: 340, provider: "Key Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/gmc,yukon/all?lock=61" },
  { id: "pickup", label: "Pickup", model: "Toyota Hilux", price: 190, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/pickup-truck/all?lock=144" },
  { id: "key_pickup2", label: "Pickup", model: "Ford F-150", price: 260, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/ford,f150/all?lock=79" },
  { id: "key_van", label: "Minivan", model: "Toyota Hiace", price: 230, provider: "Key Rent a Car", transmission: "Manual", seats: 12, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hiace-van/all?lock=80" },
  { id: "key_145", label: "Economy", model: "Chevrolet Spark", price: 76, provider: "Key Rent a Car", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,spark-key/all?lock=145" },
  { id: "key_146", label: "Compact", model: "Hyundai Accent", price: 95, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,accent-key/all?lock=146" },
  { id: "key_147", label: "Sedan", model: "Toyota Corolla", price: 118, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,corolla-key/all?lock=147" },
  { id: "key_148", label: "SUV", model: "Hyundai Creta", price: 175, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,creta/all?lock=148" },
  { id: "key_149", label: "SUV", model: "Kia Seltos", price: 185, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,seltos/all?lock=149" },
  { id: "key_150", label: "Luxury", model: "Infiniti Q50", price: 300, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/infiniti,q50/all?lock=150" },
  { id: "key_151", label: "Pickup", model: "Nissan Navara", price: 230, provider: "Key Rent a Car", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/nissan,navara/all?lock=151" },
  { id: "key_152", label: "Minivan", model: "Chevrolet Suburban", price: 320, provider: "Key Rent a Car", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,suburban/all?lock=152" },
  { id: "key_171", label: "Luxury", model: "Cadillac Escalade", price: 450, provider: "Key Rent a Car", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/cadillac,escalade/all?lock=171" },
  // Budget Saudi Arabia
  { id: "budget_eco", label: "Economy", model: "Chevrolet Spark", price: 78, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,spark/all?lock=81" },
  { id: "budget1", label: "Economy", model: "Kia Pegas", price: 85, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,sedan/all?lock=41" },
  { id: "budget_eco2", label: "Economy", model: "Hyundai Accent", price: 90, provider: "Budget Saudi Arabia", transmission: "Manual", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,accent-blue/all?lock=82" },
  { id: "budget_sedan", label: "Sedan", model: "Nissan Altima", price: 125, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,altima/all?lock=63" },
  { id: "budget_sedan2", label: "Sedan", model: "Toyota Corolla", price: 118, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,corolla-silver/all?lock=83" },
  { id: "budget_suv", label: "SUV", model: "Kia Sportage", price: 200, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,sportage/all?lock=64" },
  { id: "budget_153", label: "Economy", model: "Suzuki Celerio", price: 72, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/suzuki,celerio/all?lock=153" },
  { id: "budget_154", label: "Compact", model: "Toyota Yaris", price: 92, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,yaris-budget/all?lock=154" },
  { id: "budget_155", label: "Sedan", model: "Hyundai Elantra", price: 110, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,elantra-budget/all?lock=155" },
  { id: "budget_156", label: "SUV", model: "Nissan Kicks", price: 175, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,kicks/all?lock=156" },
  { id: "budget_157", label: "SUV", model: "Hyundai Tucson", price: 190, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,tucson-budget/all?lock=157" },
  { id: "budget_158", label: "Minivan", model: "Toyota Innova", price: 215, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,innova/all?lock=158" },
  { id: "budget_159", label: "Pickup", model: "Isuzu D-Max", price: 175, provider: "Budget Saudi Arabia", transmission: "Manual", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/isuzu,dmax/all?lock=159" },
  { id: "budget_160", label: "Economy", model: "Kia Picanto", price: 75, provider: "Budget Saudi Arabia", transmission: "Manual", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,picanto-budget/all?lock=160" },
  { id: "budget_161", label: "Sedan", model: "Chevrolet Malibu", price: 132, provider: "Budget Saudi Arabia", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/chevrolet,malibu/all?lock=161" },
  // Ejar
  { id: "ejar_eco", label: "Economy", model: "Suzuki Ciaz", price: 82, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/suzuki,ciaz/all?lock=65" },
  { id: "ejar_eco2", label: "Economy", model: "Kia Picanto", price: 78, provider: "Ejar", transmission: "Manual", seats: 4, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,picanto-white/all?lock=84" },
  { id: "ejar1", label: "Sedan", model: "Hyundai Sonata", price: 130, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,sonata/all?lock=42" },
  { id: "ejar_sedan2", label: "Sedan", model: "Nissan Sunny", price: 110, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,sunny-white/all?lock=85" },
  { id: "ejar_suv", label: "SUV", model: "Hyundai Tucson", price: 205, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,tucson-red/all?lock=86" },
  { id: "ejar_luxury", label: "Luxury", model: "Audi A6", price: 400, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/audi,a6/all?lock=66" },
  { id: "ejar_162", label: "Economy", model: "Toyota Yaris", price: 88, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/toyota,yaris-ejar/all?lock=162" },
  { id: "ejar_163", label: "Compact", model: "Honda City", price: 96, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/honda,city-ejar/all?lock=163" },
  { id: "ejar_164", label: "Sedan", model: "Kia K5", price: 128, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,k5-ejar/all?lock=164" },
  { id: "ejar_165", label: "SUV", model: "Kia Sorento", price: 235, provider: "Ejar", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/kia,sorento-ejar/all?lock=165" },
  { id: "ejar_166", label: "SUV", model: "Nissan X-Trail", price: 210, provider: "Ejar", transmission: "Automatic", seats: 7, fuel: "Petrol", img: "https://loremflickr.com/400/300/nissan,xtrail-ejar/all?lock=166" },
  { id: "ejar_167", label: "Luxury", model: "BMW 3 Series", price: 380, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/bmw,3series/all?lock=167" },
  { id: "ejar_168", label: "Minivan", model: "Hyundai Staria", price: 250, provider: "Ejar", transmission: "Automatic", seats: 8, fuel: "Petrol", img: "https://loremflickr.com/400/300/hyundai,staria-ejar/all?lock=168" },
  { id: "ejar_169", label: "Pickup", model: "Toyota Hilux", price: 195, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Diesel", img: "https://loremflickr.com/400/300/toyota,hilux-ejar/all?lock=169" },
  { id: "ejar_172", label: "Sedan", model: "Mazda 6", price: 132, provider: "Ejar", transmission: "Automatic", seats: 5, fuel: "Petrol", img: "https://loremflickr.com/400/300/mazda,6-ejar/all?lock=172" },
];
const RENTAL_COMPANY_INFO = {
  "Lumi Rent a Car": { branches: "Riyadh, Jeddah, Dammam", rating: 4.5 },
  "Theeb Rent a Car": { branches: "All major cities + airports", rating: 4.6 },
  "Yelo Rent a Car": { branches: "Riyadh, Jeddah, Khobar, Madinah", rating: 4.4 },
  "Sixt Rent a Car": { branches: "Riyadh, Jeddah + King Khalid & King Abdulaziz airports", rating: 4.7 },
  "Hanco Rent a Car": { branches: "Riyadh, Jeddah, Dammam, Makkah", rating: 4.3 },
  "Key Rent a Car": { branches: "Riyadh, Khobar, Dammam", rating: 4.2 },
  "Budget Saudi Arabia": { branches: "Riyadh, Jeddah + major airports", rating: 4.4 },
  "Ejar": { branches: "Riyadh, Jeddah, Madinah", rating: 4.3 },
};
const RENTAL_COMPANIES = Array.from(new Set(CARS.map((c) => c.provider))).map((name) => ({
  name,
  count: CARS.filter((c) => c.provider === name).length,
  ...RENTAL_COMPANY_INFO[name],
}));

function CarRental({ goBack, navigate }) {
  const [view, setView] = useState("search");
  const [companyFilter, setCompanyFilter] = useState(null);
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState(SAUDI_CITIES["Riyadh"][0]);
  const [pickupDate, setPickupDate] = useState(""); const [returnDate, setReturnDate] = useState("");
  const [stage, setStage] = useState("input"); const [carId, setCarId] = useState("sedan");
  const [bookingRef, setBookingRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [renterName, setRenterName] = useState(""); const [renterPhone, setRenterPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const chosen = CARS.find((c) => c.id === carId);
  const can = pickupDate && returnDate && returnDate >= pickupDate;
  const days = can ? Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000) || 1) : 0;
  const canReserve = renterName.trim() && renterPhone.trim();

  async function confirmReservation() {
    const ref = `RENTAL-${Date.now().toString(36).toUpperCase()}`;
    setSaving(true);
    try {
      await supabase.from("rental_bookings").insert({
        booking_ref: ref,
        renter_name: renterName.trim(),
        renter_phone: renterPhone.trim(),
        provider: chosen?.provider || null,
        car_model: chosen?.model || chosen?.label || null,
        city, district,
        pickup_date: pickupDate || null,
        return_date: returnDate || null,
        days: days || 1,
        price_per_day: chosen?.price || null,
        total_price: days > 0 ? chosen.price * days : chosen?.price || null,
        status: "requested",
      });
    } catch (e) { /* best-effort; still show confirmation locally */ }
    setSaving(false);
    setBookingRef(ref);
    setStage("confirmed");
  }
  useEffect(() => { if (stage === "input") setBookingRef(null); }, [stage]);
  return (
    <div style={{ color: TEXT }}>
      <Header title="Car rental" onBack={goBack} />

      {stage === "input" && (
        <div className="px-5 mb-4 flex gap-2">
          <button onClick={() => { setView("search"); setCompanyFilter(null); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "search" ? GOLD : CARD, color: view === "search" ? BG : MUTE, border: view === "search" ? "none" : `1px solid ${BORDER}` }}>
            <Search size={12} /> Search
          </button>
          <button onClick={() => setView("companies")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "companies" ? GOLD : CARD, color: view === "companies" ? BG : MUTE, border: view === "companies" ? "none" : `1px solid ${BORDER}` }}>
            <Briefcase size={12} /> By Company
          </button>
        </div>
      )}

      {stage === "input" && view === "companies" && (
        <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RENTAL_COMPANIES.map((co) => (
            <button
              key={co.name}
              onClick={() => { setCompanyFilter(co.name); setStage("choose"); }}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 text-left"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.14)" }}>
                <Car size={20} color={GOLD} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{co.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{co.count} vehicle{co.count > 1 ? "s" : ""} available{co.rating ? ` · ★ ${co.rating}` : ""}</p>
                {co.branches && <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={9} /> {co.branches}</p>}
              </div>
              <ChevronRight size={14} color={FAINT} />
            </button>
          ))}
        </div>
      )}

      {stage === "input" && view === "search" && (
        <div className="px-5">
          <button onClick={() => navigate("register_rental")} className="w-full mb-2.5 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Key size={15} color={GOLD} /> Own a car? Apply to list it for rent</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <button onClick={() => navigate("register_fleet")} className="w-full mb-2.5 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Users size={15} color={GREEN} /> Own a fleet? Apply to register your company</span>
            <ChevronRight size={14} color={GREEN} />
          </button>
          <button onClick={() => navigate("company_login")} className="w-full mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Briefcase size={15} color={GOLD} /> Already approved? Company log in / Sign up</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <MapPin size={14} color={GREEN} />
              <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(SAUDI_CITIES[e.target.value][0]); }} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                {SAUDI_CITY_LIST.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 py-3">
              <MapPin size={14} color={GOLD} />
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                {SAUDI_CITIES[city].map((d) => <option key={d} style={{ background: CARD }}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-2xl px-4 py-2 mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><Calendar size={14} color={GREEN} /><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
            <div className="flex items-center gap-3 py-3"><Calendar size={14} color={GOLD} /><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          </div>
          <button onClick={() => can && setStage("choose")} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>See available cars</button>
        </div>
      )}
      {stage === "choose" && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs" style={{ color: FAINT }}>
              {companyFilter ? companyFilter : can ? `${district}, ${city} · ${pickupDate} → ${returnDate} · ${days} day${days > 1 ? "s" : ""}` : "All available vehicles"}
            </p>
            {companyFilter && <button onClick={() => { setCompanyFilter(null); setStage("input"); setView("companies"); }} className="text-[11px]" style={{ color: GOLD }}>Change company</button>}
          </div>
          {companyFilter && RENTAL_COMPANY_INFO[companyFilter] && (
            <p className="text-[11px] mb-3 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={11} color={GOLD} /> {RENTAL_COMPANY_INFO[companyFilter].branches} · ★ {RENTAL_COMPANY_INFO[companyFilter].rating}</p>
          )}
          {!companyFilter && <div className="mb-3" />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {(companyFilter ? CARS.filter((c) => c.provider === companyFilter) : CARS).map((c) => {
              const isSel = carId === c.id;
              return (
                <button key={c.id} onClick={() => setCarId(c.id)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <img src={c.img} alt={c.model} loading="lazy" className="w-16 h-14 rounded-lg object-cover shrink-0" style={{ background: BORDER }} />
                  <div className="flex-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.label}</p><p className="text-sm font-semibold">{c.price} SAR/day</p></div><p className="text-[11px]" style={{ color: FAINT }}>{c.model}</p><p className="text-[10px] mt-0.5 flex items-center gap-2" style={{ color: FAINT }}><span>⚙ {c.transmission}</span><span>👤 {c.seats}</span><span>⛽ {c.fuel}</span></p><p className="text-[10px] mt-0.5" style={{ color: GOLD }}>{c.provider}</p></div>
                </button>
              );
            })}
          </div>
          <div className="rounded-2xl px-4 py-2 mt-4 mb-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><User size={14} color={GREEN} /><input value={renterName} onChange={(e) => setRenterName(e.target.value)} placeholder="Your full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
            <div className="flex items-center gap-3 py-3"><Phone size={14} color={GOLD} /><input value={renterPhone} onChange={(e) => setRenterPhone(e.target.value)} placeholder="Your mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          </div>
          <button onClick={() => canReserve && !saving && confirmReservation()} disabled={!canReserve || saving} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: canReserve && !saving ? GOLD : BORDER, color: canReserve && !saving ? BG : "#5C736D" }}>
            {saving ? "Reserving..." : days > 0 ? `Reserve — ${chosen.price * days} SAR total` : `Reserve — ${chosen.price} SAR/day`}
          </button>
        </div>
      )}
      {stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Reservation confirmed</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>{chosen?.provider} will contact you on WhatsApp to confirm pickup details.</p>
          <div className="w-full">
            <RatingPrompt ratingType="company" targetId={chosen?.provider} targetLabel={chosen?.provider} bookingRef={bookingRef} prompt={`Rate ${chosen?.provider}`} />
          </div>
          <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this reservation</button>
          <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel reservation</button>
        </div>
      )}
      {stage === "cancelled" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Reservation cancelled</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your reservation has been cancelled.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}
      {chatOpen && bookingRef && (
        <RideChat bookingRef={bookingRef} contextLabel={`Car rental — ${chosen?.provider || ""}`} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

/* ---------- MARKETPLACE ---------- */
const CATEGORIES = ["All", "Cars", "Electronics", "Furniture", "Fashion", "Spare parts"];
const LISTINGS = [
  { id: 1, title: "Toyota Camry 2021", price: 62000, category: "Cars", location: "Riyadh", tag: "Featured", condition: "Excellent", year: "2021", km: "42,000 KM", seller: "Individual seller", phone: "0550 111 001", img: "https://loremflickr.com/400/300/toyota,camry/all?lock=21" },
  { id: 2, title: "iPhone 15 Pro, 256GB", price: 3400, category: "Electronics", location: "Jeddah", tag: null, seller: "Extra Stores", phone: "0550 111 002", img: "https://loremflickr.com/400/300/iphone,smartphone/all?lock=22" },
  { id: 3, title: "3-seat sofa, grey", price: 950, category: "Furniture", location: "Dammam", tag: null, seller: "IKEA Marketplace", phone: "0550 111 003", img: "https://loremflickr.com/400/300/sofa,couch/all?lock=23" },
  { id: 4, title: "Nike Air Max, size 43", price: 220, category: "Fashion", location: "Riyadh", tag: null, seller: "SHEIN Store", phone: "0550 111 004", img: "https://loremflickr.com/400/300/sneakers,nike/all?lock=24" },
  { id: 5, title: "Car tires set (4)", price: 800, category: "Spare parts", location: "Khobar", tag: "New", seller: "Al Jazira Tires Co.", phone: "0550 111 005", img: "https://loremflickr.com/400/300/car-tires/all?lock=25" },
  { id: 6, title: "Hyundai Elantra 2020", price: 41000, category: "Cars", location: "Makkah", tag: null, condition: "Good", year: "2020", km: "68,000 KM", seller: "Individual seller", phone: "0550 111 006", img: "https://loremflickr.com/400/300/hyundai,elantra/all?lock=26" },
  { id: 7, title: "Samsung 55\" Smart TV", price: 1600, category: "Electronics", location: "Madinah", tag: "New", seller: "Jarir Bookstore", phone: "0550 111 007", img: "https://loremflickr.com/400/300/smart-tv,television/all?lock=27" },
  { id: 8, title: "Dining table + 6 chairs", price: 1200, category: "Furniture", location: "Taif", tag: null, seller: "Home Centre", phone: "0550 111 008", img: "https://loremflickr.com/400/300/dining-table/all?lock=28" },
  { id: 9, title: "Men's Thobe, size L", price: 90, category: "Fashion", location: "Abha", tag: null, seller: "Individual seller", phone: "0550 111 009", img: "https://loremflickr.com/400/300/thobe,mens-fashion/all?lock=29" },
  { id: 10, title: "Car battery, 70Ah", price: 260, category: "Spare parts", location: "Jubail", tag: null, seller: "AutoZone Saudi", phone: "0550 111 010", img: "https://loremflickr.com/400/300/car-battery/all?lock=30" },
  { id: 11, title: "GMC Yukon 2019", price: 118000, category: "Cars", location: "Dammam", tag: "Featured", condition: "Very Good", year: "2019", km: "89,000 KM", seller: "Individual seller", phone: "0550 111 011", img: "https://loremflickr.com/400/300/gmc,suv/all?lock=31" },
  { id: 12, title: "MacBook Air M2", price: 4200, category: "Electronics", location: "Riyadh", tag: null, seller: "Jarir Bookstore", phone: "0550 111 012", img: "https://loremflickr.com/400/300/macbook,laptop/all?lock=32" },
  { id: 13, title: "Leather office chair", price: 480, category: "Furniture", location: "Riyadh", tag: "New", seller: "Home Centre", phone: "0550 111 013", img: "https://loremflickr.com/400/300/office-chair/all?lock=33" },
  { id: 14, title: "PlayStation 5", price: 1950, category: "Electronics", location: "Jeddah", tag: "Featured", seller: "Extra Stores", phone: "0550 111 014", img: "https://loremflickr.com/400/300/playstation,gaming-console/all?lock=34" },
  { id: 15, title: "Women's handbag, leather", price: 320, category: "Fashion", location: "Khobar", tag: null, seller: "Individual seller", phone: "0550 111 015", img: "https://loremflickr.com/400/300/handbag,leather-bag/all?lock=35" },
  { id: 16, title: "Alloy wheels, 18-inch set", price: 1400, category: "Spare parts", location: "Dammam", tag: null, seller: "Al Jazira Tires Co.", phone: "0550 111 016", img: "https://loremflickr.com/400/300/alloy-wheels,car-rim/all?lock=36" },
];
const PARTNER_PLATFORMS = [
  { name: "Haraj Cars", url: "https://haraj.com.sa", icon: Car, tag: "Most Popular", tagColor: "#F0A868", gradient: "linear-gradient(135deg, #8C4A1E, #4A2410)", description: "Saudi Arabia's largest classifieds for used cars and more." },
  { name: "Syarah", url: "https://syarah.com", icon: Key, tag: "Inspected", tagColor: "#3FD1D1", gradient: "linear-gradient(135deg, #0E6E6E, #0A3D3D)", description: "Buy & sell cars online — inspection reports included." },
  { name: "OLX Saudi Arabia", url: "https://saudi.olx.com", icon: Tag, tag: "Free Listings", tagColor: "#E8C34A", gradient: "linear-gradient(135deg, #8C6E14, #4A3908)", description: "Free classifieds for cars, electronics & more." },
  { name: "Opensooq", url: "https://opensooq.com", icon: Globe, tag: "Arab Market", tagColor: "#3FBFA6", gradient: "linear-gradient(135deg, #14453F, #0B2320)", description: "Arab world classifieds — cars, property, general." },
  { name: "Motory", url: "https://motory.com", icon: Car, tag: "Verified", tagColor: "#5B8FD4", gradient: "linear-gradient(135deg, #1E3A72, #12234A)", description: "Trusted verified car marketplace across KSA." },
  { name: "CarSwitch", url: "https://ksa.carswitch.com/en", icon: CheckCircle2, tag: "Certified", tagColor: "#A78BFA", gradient: "linear-gradient(135deg, #4C3D8C, #2A2255)", description: "Certified pre-owned cars with 200-point inspections." },
];

function Marketplace({ goBack, navigate }) {
  const [view, setView] = useState("browse");
  const [category, setCategory] = useState("All"); const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState([]);
  const [contactListing, setContactListing] = useState(null);
  const [reportListing, setReportListing] = useState(null);

  useEffect(() => {
    async function loadListings() {
      const data = await cachedFetch("marketplace_listings", async () => {
        const { data } = await supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
        return data;
      });
      if (data) {
        setDbListings(data.map((r) => ({
          id: `db-${r.id}`,
          title: r.title,
          price: r.price || 0,
          category: r.category || "Cars",
          location: r.location || "Riyadh",
          tag: r.tag || null,
          condition: r.condition || null,
          year: r.year || null,
          km: r.km || null,
          seller: r.seller_name || "Individual seller",
          phone: r.seller_phone || null,
          img: r.image_url || "https://loremflickr.com/400/300/product/all",
        })));
      }
    }
    loadListings();
  }, []);

  const allListings = [...dbListings, ...LISTINGS];
  const filtered = allListings.filter((l) => (category === "All" || l.category === category) && l.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ color: TEXT }}>
      <Header title="Marketplace" onBack={goBack} right={<button onClick={() => navigate("register_seller")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={18} color={BG} /></button>} />

      <div className="px-5 mb-3 flex gap-2">
        <button onClick={() => navigate("register_seller")} className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold" style={{ background: GOLD, color: BG }}>
          <Plus size={13} /> Post New Listing
        </button>
        <button onClick={() => setView("chats")} className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
          <MessageCircle size={13} /> My Chats
        </button>
      </div>

      <div className="px-5 mb-4 flex gap-2">
        <button onClick={() => setView("browse")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "browse" ? GOLD : CARD, color: view === "browse" ? BG : MUTE, border: view === "browse" ? "none" : `1px solid ${BORDER}` }}>
          <Search size={12} /> Browse
        </button>
        <button onClick={() => setView("platforms")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "platforms" ? GOLD : CARD, color: view === "platforms" ? BG : MUTE, border: view === "platforms" ? "none" : `1px solid ${BORDER}` }}>
          <Globe size={12} /> Partner Platforms
        </button>
      </div>

      {view === "chats" && (
        <div className="px-5 flex flex-col items-center text-center py-12">
          <MessageCircle size={32} color={FAINT} />
          <p className="text-sm font-semibold mt-3">No chats yet</p>
          <p className="text-xs mt-1" style={{ color: FAINT }}>Message a seller from a listing and your conversations will show up here.</p>
        </div>
      )}

      {view === "browse" && (
        <>
          <div className="px-5 mb-3">
            <button onClick={() => navigate("register_seller")} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
              <span className="flex items-center gap-2 text-sm font-semibold"><ShoppingBag size={15} color={GOLD} /> Become a seller</span>
              <ChevronRight size={14} color={GOLD} />
            </button>
          </div>
          <div className="px-5 mb-3"><div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Search size={15} color={FAINT} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div></div>
          <div className="px-5 mb-4 flex gap-2 overflow-x-auto">
            {CATEGORIES.map((c) => <button key={c} onClick={() => setCategory(c)} className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0" style={{ background: category === c ? GOLD : CARD, color: category === c ? BG : MUTE, border: category === c ? "none" : `1px solid ${BORDER}` }}>{c}</button>)}
          </div>
          <div className="px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l) => (
              <div key={l.id} className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="h-36 relative" style={{ background: BORDER }}>
                  <img src={l.img} alt={l.title} loading="lazy" className="w-full h-full object-cover" />
                  {l.tag && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1" style={{ background: GOLD, color: BG }}><Star size={9} /> {l.tag}</span>}
                  {l.condition && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(91,143,212,0.85)", color: "#fff" }}>{l.condition}</span>}
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold leading-tight">{l.title}</p>
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={10} /> {l.location} · {l.seller}</p>

                  {(l.year || l.km) && (
                    <div className="flex gap-2 mt-2.5">
                      {l.year && <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: BG }}><p className="text-[9px]" style={{ color: FAINT }}>Year</p><p className="text-xs font-semibold">{l.year}</p></div>}
                      {l.km && <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: BG }}><p className="text-[9px]" style={{ color: FAINT }}>Mileage</p><p className="text-xs font-semibold">{l.km}</p></div>}
                    </div>
                  )}

                  <p className="text-base font-semibold mt-2.5 flex items-center gap-1" style={{ color: GOLD }}><Tag size={13} /> {l.price.toLocaleString()} SAR</p>

                  {l.phone && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: MUTE }}>
                      <Phone size={12} /> {l.phone}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setContactListing(l)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold"
                      style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}
                    >
                      <MessageCircle size={13} /> Contact Seller
                    </button>
                    <button
                      onClick={() => setReportListing(l)}
                      aria-label="Report listing"
                      className="w-10 flex items-center justify-center rounded-full"
                      style={{ background: CARD, border: `1px solid ${BORDER}` }}
                    >
                      <Flag size={13} color={FAINT} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {contactListing && (
        <ContactModal
          context="marketplace"
          referenceTitle={contactListing.title}
          recipientPhone={contactListing.phone}
          whatsappNumber={SUPPORT_WHATSAPP_NUMBER}
          whatsappMessage={`Hi, I'm interested in "${contactListing.title}" listed on SayyaraDrive Marketplace.`}
          onClose={() => setContactListing(null)}
        />
      )}
      {reportListing && (
        <ReportModal
          context="marketplace"
          referenceId={reportListing.id}
          referenceTitle={reportListing.title}
          onClose={() => setReportListing(null)}
        />
      )}

      {view === "platforms" && (
        <div className="px-5">
          <h2 className="text-lg font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Partner Platforms</h2>
          <p className="text-xs text-center mt-1.5 mb-5" style={{ color: MUTE }}>Browse the biggest buy & sell sites in KSA.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PARTNER_PLATFORMS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: s.gradient, border: `1px solid ${BORDER}` }}>
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.35)", color: s.tagColor }}>{s.tag}</span>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <Icon size={24} color="#fff" />
                  </div>
                  <p className="text-base font-bold" style={{ color: "#fff" }}>{s.name}</p>
                  <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{s.description}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold mt-4"
                    style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}
                  >
                    <ArrowRightLeft size={12} style={{ transform: "rotate(45deg)" }} /> Open Platform
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- FOOD DELIVERY ---------- */
const RESTAURANTS = [
  { id: 1, name: "Najd Kitchen", cuisine: "Arabic", rating: 4.7, eta: "25-35 min", city: "Riyadh", hours: "10:00–23:59", foodCategory: "rice" },
  { id: 2, name: "Burger Point", cuisine: "Fast food", rating: 4.4, eta: "15-25 min", city: "Riyadh", hours: "11:00–02:00", foodCategory: "burger" },
  { id: 3, name: "Green Bowl", cuisine: "Healthy", rating: 4.8, eta: "20-30 min", city: "Jeddah", hours: "09:00–22:00", foodCategory: "rice" },
  { id: 4, name: "Sweet Dates", cuisine: "Desserts", rating: 4.6, eta: "20-30 min", city: "Dammam", hours: "12:00–00:00", foodCategory: "dessert" },
  { id: 5, name: "Qahwa House", cuisine: "Cafe", rating: 4.5, eta: "10-20 min", city: "Riyadh", hours: "07:00–23:00", foodCategory: "dessert" },
  { id: 6, name: "Al Baik Express", cuisine: "Fast food", rating: 4.9, eta: "15-20 min", city: "Jeddah", hours: "10:00–01:00", foodCategory: "butter-chicken" },
  { id: 7, name: "Mandi House", cuisine: "Arabic", rating: 4.7, eta: "30-40 min", city: "Makkah", hours: "11:00–23:00", foodCategory: "rice" },
  { id: 8, name: "Pasta Bella", cuisine: "Italian", rating: 4.6, eta: "25-35 min", city: "Riyadh", hours: "12:00–23:59", foodCategory: "pasta" },
  { id: 9, name: "Sushi Zen", cuisine: "Japanese", rating: 4.8, eta: "20-30 min", city: "Dammam", hours: "13:00–23:00", foodCategory: "rice" },
];
const MENU = {
  1: [
    { id: "m1", category: "Grilled Chicken", name: "Half Grilled Chicken", desc: "Marinated overnight and flame-grilled", price: 28 },
    { id: "m2", category: "Grilled Chicken", name: "Full Grilled Chicken", desc: "Whole chicken with garlic sauce", price: 52 },
    { id: "m3", category: "Grilled Chicken", name: "Chicken Tikka", desc: "Skewered chicken with spices", price: 32 },
    { id: "m4", category: "Rice & Mandi", name: "Kabsa Chicken", desc: "Spiced rice with tender chicken", price: 42 },
    { id: "m5", category: "Rice & Mandi", name: "Mandi Lamb", desc: "Slow-cooked lamb over saffron rice", price: 58 },
    { id: "m6", category: "BBQ Platters", name: "Mixed Grill Platter", desc: "Chicken, kebab, and kofta for 2", price: 75 },
    { id: "m1-7", category: "BBQ Platters", name: "Lamb Kofta Skewers", desc: "Grilled minced lamb skewers with herbs", price: 40 },
    { id: "m1-8", category: "Starters", name: "Hummus Plate", desc: "Creamy hummus with olive oil and pita", price: 16 },
    { id: "m1-9", category: "Starters", name: "Fattoush Salad", desc: "Fresh greens with toasted bread and sumac", price: 18 },
    { id: "m1-10", category: "Drinks", name: "Saudi Champagne", desc: "Apple, mint, and soda mocktail", price: 12 },
    { id: "m1-11", category: "Desserts", name: "Basbousa", desc: "Sweet semolina cake with syrup", price: 14 },
  ],
  2: [
    { id: "m7", category: "Burgers", name: "Classic Beef Burger", desc: "Beef patty, cheddar, house sauce", price: 28 },
    { id: "m8", category: "Burgers", name: "Chicken Crispy Burger", desc: "Crispy fried chicken, pickles, mayo", price: 26 },
    { id: "m9", category: "Burgers", name: "Double Smash Burger", desc: "Two smashed patties, double cheese", price: 36 },
    { id: "m10", category: "Sides", name: "Fries", desc: "Crispy golden fries", price: 12 },
    { id: "m11", category: "Sides", name: "Onion Rings", desc: "Crunchy battered onion rings", price: 14 },
    { id: "m2-12", category: "Burgers", name: "Mushroom Swiss Burger", desc: "Sauteed mushrooms, swiss cheese", price: 34 },
    { id: "m2-13", category: "Burgers", name: "BBQ Bacon Burger", desc: "Smoky BBQ sauce, crispy beef bacon", price: 38 },
    { id: "m2-14", category: "Sides", name: "Loaded Fries", desc: "Fries topped with cheese sauce and jalapenos", price: 20 },
    { id: "m2-15", category: "Sides", name: "Coleslaw", desc: "Creamy shredded cabbage salad", price: 10 },
    { id: "m2-16", category: "Drinks", name: "Milkshake", desc: "Vanilla, chocolate, or strawberry", price: 16 },
    { id: "m2-17", category: "Drinks", name: "Soft Drink", desc: "Chilled can, various flavors", price: 6 },
  ],
  3: [
    { id: "m12", category: "Bowls", name: "Grilled Chicken Bowl", desc: "Grilled chicken, greens, tahini dressing", price: 34 },
    { id: "m13", category: "Bowls", name: "Quinoa Salad", desc: "Quinoa, roasted veg, lemon dressing", price: 30 },
    { id: "m14", category: "Bowls", name: "Falafel Bowl", desc: "Crispy falafel, hummus, pickled veg", price: 28 },
    { id: "m15", category: "Juices", name: "Fresh Orange Juice", desc: "Cold-pressed, no sugar added", price: 14 },
    { id: "m3-18", category: "Bowls", name: "Salmon Poke Bowl", desc: "Fresh salmon, avocado, edamame, rice", price: 44 },
    { id: "m3-19", category: "Bowls", name: "Mediterranean Bowl", desc: "Grilled halloumi, olives, tabbouleh", price: 32 },
    { id: "m3-20", category: "Salads", name: "Caesar Salad", desc: "Romaine, parmesan, grilled chicken", price: 30 },
    { id: "m3-21", category: "Salads", name: "Greek Salad", desc: "Feta, cucumber, tomato, olives", price: 26 },
    { id: "m3-22", category: "Juices", name: "Green Detox Juice", desc: "Kale, apple, celery, lemon", price: 16 },
    { id: "m3-23", category: "Snacks", name: "Protein Energy Balls (3pc)", desc: "Dates, oats, and nut butter", price: 12 },
  ],
  4: [
    { id: "m16", category: "Desserts", name: "Kunafa Slice", desc: "Crispy kunafa with sweet cheese", price: 18 },
    { id: "m17", category: "Desserts", name: "Date Cake", desc: "Moist cake with Saudi dates", price: 15 },
    { id: "m18", category: "Desserts", name: "Umm Ali", desc: "Warm bread pudding with nuts", price: 20 },
    { id: "m4-24", category: "Desserts", name: "Baklava Box (6pc)", desc: "Layered pastry with pistachios and honey", price: 25 },
    { id: "m4-25", category: "Desserts", name: "Chocolate Lava Cake", desc: "Warm cake with molten chocolate center", price: 22 },
    { id: "m4-26", category: "Desserts", name: "Cheesecake Slice", desc: "Classic New York style cheesecake", price: 19 },
    { id: "m4-27", category: "Date Treats", name: "Stuffed Dates (8pc)", desc: "Dates filled with almonds and cream cheese", price: 24 },
    { id: "m4-28", category: "Date Treats", name: "Date Maamoul (6pc)", desc: "Traditional date-filled cookies", price: 20 },
    { id: "m4-29", category: "Drinks", name: "Arabic Coffee", desc: "Traditional qahwa with cardamom", price: 10 },
    { id: "m4-30", category: "Drinks", name: "Saffron Milk", desc: "Warm milk infused with saffron and rose", price: 14 },
  ],
  5: [
    { id: "m19", category: "Hot Drinks", name: "Arabic Coffee (pot)", desc: "Traditional qahwa with cardamom", price: 20 },
    { id: "m20", category: "Hot Drinks", name: "Cardamom Latte", desc: "Espresso, steamed milk, cardamom", price: 16 },
    { id: "m21", category: "Cold Drinks", name: "Iced Karak", desc: "Chilled spiced milk tea", price: 15 },
    { id: "m5-31", category: "Hot Drinks", name: "Turkish Coffee", desc: "Rich and strong, served with dates", price: 14 },
    { id: "m5-32", category: "Hot Drinks", name: "Spanish Latte", desc: "Sweetened condensed milk espresso", price: 17 },
    { id: "m5-33", category: "Cold Drinks", name: "Iced Spanish Latte", desc: "Chilled sweet espresso with milk", price: 18 },
    { id: "m5-34", category: "Cold Drinks", name: "Mango Smoothie", desc: "Fresh mango blended with yogurt", price: 20 },
    { id: "m5-35", category: "Pastries", name: "Croissant", desc: "Buttery, flaky, freshly baked", price: 10 },
    { id: "m5-36", category: "Pastries", name: "Cheese Manakish", desc: "Warm flatbread with melted cheese", price: 14 },
    { id: "m5-37", category: "Pastries", name: "Chocolate Muffin", desc: "Rich double chocolate chip muffin", price: 12 },
  ],
  6: [
    { id: "m22", category: "Fried Chicken", name: "Broasted Chicken Meal", desc: "3pc broasted chicken with rice", price: 24 },
    { id: "m23", category: "Fried Chicken", name: "Chicken Strips (5pc)", desc: "Crispy strips with dipping sauce", price: 22 },
    { id: "m24", category: "Extras", name: "Garlic Sauce Extra", desc: "Signature garlic dip", price: 5 },
    { id: "m6-38", category: "Fried Chicken", name: "9pc Family Bucket", desc: "9 pieces of broasted chicken", price: 65 },
    { id: "m6-39", category: "Fried Chicken", name: "Spicy Chicken Sandwich", desc: "Crispy spicy fillet, pickles, mayo", price: 20 },
    { id: "m6-40", category: "Sides", name: "Mashed Potatoes", desc: "Creamy potatoes with gravy", price: 12 },
    { id: "m6-41", category: "Sides", name: "Coleslaw Cup", desc: "Fresh and creamy side salad", price: 8 },
    { id: "m6-42", category: "Sides", name: "Dinner Roll (2pc)", desc: "Soft warm bread rolls", price: 6 },
    { id: "m6-43", category: "Extras", name: "Ketchup Packets", desc: "Pack of 5", price: 2 },
    { id: "m6-44", category: "Drinks", name: "Soft Drink (Large)", desc: "Chilled fountain drink", price: 8 },
  ],
  7: [
    { id: "m25", category: "Mandi", name: "Mandi Chicken", desc: "Slow-smoked chicken over rice", price: 45 },
    { id: "m26", category: "Mandi", name: "Mandi Lamb (large)", desc: "Full lamb shoulder, serves 3", price: 78 },
    { id: "m27", category: "Sides", name: "Saudi Salad", desc: "Fresh tomato, cucumber, onion", price: 10 },
    { id: "m7-45", category: "Mandi", name: "Mandi Camel Meat", desc: "Traditional slow-cooked camel meat over rice", price: 85 },
    { id: "m7-46", category: "Mandi", name: "Mandi Mixed (Chicken & Lamb)", desc: "Combo platter for sharing", price: 68 },
    { id: "m7-47", category: "Sides", name: "Grilled Vegetables", desc: "Seasonal vegetables charred over open flame", price: 16 },
    { id: "m7-48", category: "Sides", name: "White Rice", desc: "Plain steamed basmati rice", price: 8 },
    { id: "m7-49", category: "Soups", name: "Lentil Soup", desc: "Traditional Saudi red lentil soup", price: 12 },
    { id: "m7-50", category: "Drinks", name: "Laban", desc: "Chilled savory yogurt drink", price: 8 },
    { id: "m7-51", category: "Desserts", name: "Luqaimat (8pc)", desc: "Sweet fried dumplings with date syrup", price: 16 },
  ],
  8: [
    { id: "m28", category: "Pasta", name: "Spaghetti Bolognese", desc: "Slow-cooked beef ragu", price: 38 },
    { id: "m29", category: "Pasta", name: "Fettuccine Alfredo", desc: "Creamy parmesan sauce", price: 42 },
    { id: "m30", category: "Pasta", name: "Penne Arrabbiata", desc: "Spicy tomato and garlic", price: 34 },
    { id: "m8-52", category: "Pasta", name: "Lasagna", desc: "Layered pasta with beef and bechamel", price: 45 },
    { id: "m8-53", category: "Pasta", name: "Carbonara", desc: "Creamy egg sauce with beef bacon", price: 40 },
    { id: "m8-54", category: "Pizza", name: "Margherita Pizza", desc: "Tomato, mozzarella, fresh basil", price: 36 },
    { id: "m8-55", category: "Pizza", name: "Pepperoni Pizza", desc: "Classic pepperoni with mozzarella", price: 40 },
    { id: "m8-56", category: "Starters", name: "Garlic Bread", desc: "Toasted bread with garlic butter", price: 14 },
    { id: "m8-57", category: "Starters", name: "Bruschetta", desc: "Toasted bread with tomato and basil", price: 18 },
    { id: "m8-58", category: "Desserts", name: "Tiramisu", desc: "Classic Italian coffee-flavored dessert", price: 22 },
  ],
  9: [
    { id: "m31", category: "Sushi", name: "Salmon Sushi Set", desc: "8pc fresh salmon nigiri & rolls", price: 55 },
    { id: "m32", category: "Sushi", name: "California Roll (8pc)", desc: "Crab, avocado, cucumber", price: 32 },
    { id: "m33", category: "Sushi", name: "Spicy Tuna Roll (8pc)", desc: "Tuna, spicy mayo, sesame", price: 36 },
    { id: "m9-59", category: "Sushi", name: "Dragon Roll (8pc)", desc: "Eel, avocado, cucumber, eel sauce", price: 48 },
    { id: "m9-60", category: "Sushi", name: "Rainbow Roll (8pc)", desc: "Assorted fish over California roll", price: 52 },
    { id: "m9-61", category: "Starters", name: "Edamame", desc: "Steamed soybeans with sea salt", price: 14 },
    { id: "m9-62", category: "Starters", name: "Gyoza (6pc)", desc: "Pan-fried chicken dumplings", price: 22 },
    { id: "m9-63", category: "Soups", name: "Miso Soup", desc: "Traditional Japanese soybean soup", price: 10 },
    { id: "m9-64", category: "Mains", name: "Chicken Teriyaki", desc: "Grilled chicken with teriyaki glaze and rice", price: 38 },
    { id: "m9-65", category: "Drinks", name: "Japanese Green Tea", desc: "Hot or iced sencha tea", price: 10 },
  ],
};

/* Generates a reasonable default menu for restaurants that don't have a hand-built one yet (e.g. newly added in Admin) */
function getMenuForRestaurant(restaurant) {
  if (!restaurant) return [];
  if (MENU[restaurant.id]) return MENU[restaurant.id];
  const cat = restaurant.foodCategory || "rice";
  const base = [
    { id: `${restaurant.id}-1`, category: "Chef's Picks", name: "House Special", desc: "Our most popular dish, chef's recommendation", price: 35 },
    { id: `${restaurant.id}-2`, category: "Chef's Picks", name: "Signature Platter", desc: "A generous sharing platter for 2", price: 60 },
    { id: `${restaurant.id}-3`, category: "Mains", name: `${restaurant.cuisine || "House"} Classic`, desc: "A well-loved classic done right", price: 28 },
    { id: `${restaurant.id}-4`, category: "Mains", name: "Chef's Choice Platter", desc: "Rotating seasonal selection", price: 32 },
    { id: `${restaurant.id}-5`, category: "Mains", name: "Grilled Special", desc: "Charcoal-grilled house favorite", price: 34 },
    { id: `${restaurant.id}-6`, category: "Sides", name: "Side of the Day", desc: "Ask your driver what's fresh today", price: 12 },
    { id: `${restaurant.id}-7`, category: "Sides", name: "Fresh Salad", desc: "Seasonal greens with house dressing", price: 15 },
    { id: `${restaurant.id}-8`, category: "Starters", name: "Soup of the Day", desc: "Warm and comforting, changes daily", price: 14 },
    { id: `${restaurant.id}-9`, category: "Desserts", name: "Dessert of the Day", desc: "A sweet finish to your meal", price: 16 },
    { id: `${restaurant.id}-10`, category: "Drinks", name: "Soft Drink", desc: "Chilled can, various flavors", price: 6 },
  ];
  return base;
}

/* ---------- FOOD PHOTO (real, category-matched images from a live food-photo API) ---------- */
function FoodPhoto({ category, alt, className, style }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    fetch(`https://foodish-api.com/api/images/${category}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled && data?.image) setSrc(data.image); else if (!cancelled) setFailed(true); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [category]);

  if (failed || !src) {
    return (
      <div className={className} style={{ ...style, background: BORDER, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <UtensilsCrossed size={18} color={FAINT} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} />;
}

function FoodDelivery({ goBack, navigate }) {
  const [openRestaurant, setOpenRestaurant] = useState(null);
  const [cart, setCart] = useState({}); const [stage, setStage] = useState("browse");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All Cities");
  const [dbRestaurants, setDbRestaurants] = useState([]);
  const [bookingRef, setBookingRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [customerName, setCustomerName] = useState(""); const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (stage === "browse") setBookingRef(null); }, [stage]);

  useEffect(() => {
    async function loadRestaurants() {
      const data = await cachedFetch("restaurants", async () => {
        const { data } = await supabase.from("restaurants").select("*").eq("status", "active").order("created_at", { ascending: false });
        return data;
      });
      if (data) {
        setDbRestaurants(data.map((r) => ({
          id: `db-${r.id}`,
          name: r.name,
          cuisine: r.cuisine || "Restaurant",
          rating: r.rating || 4.5,
          eta: r.eta || "20-30 min",
          city: r.city || "Riyadh",
          hours: r.hours || "10:00–23:00",
          foodCategory: r.food_category || "rice",
        })));
      }
    }
    loadRestaurants();
  }, []);

  const allRestaurants = [...dbRestaurants, ...RESTAURANTS];
  function addItem(item) { setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 })); }
  function removeItem(item) { setCart((c) => { const n = { ...c }; if (n[item.id] > 1) n[item.id]--; else delete n[item.id]; return n; }); }
  const menu = getMenuForRestaurant(openRestaurant);
  const menuByCategory = menu.reduce((acc, m) => { (acc[m.category] = acc[m.category] || []).push(m); return acc; }, {});
  const cartItems = menu.filter((m) => cart[m.id]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menu.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0);
  const cityOptions = ["All Cities", ...Array.from(new Set(allRestaurants.map((r) => r.city)))];
  const filteredRestaurants = allRestaurants.filter((r) =>
    (city === "All Cities" || r.city === city) &&
    (r.name.toLowerCase().includes(query.toLowerCase()) || r.cuisine.toLowerCase().includes(query.toLowerCase()))
  );

  function openMenu(r) { setOpenRestaurant(r); setCart({}); setStage("menu"); }

  async function confirmOrder() {
    const ref = `ORDER-${Date.now().toString(36).toUpperCase()}`;
    setSaving(true);
    try {
      await supabase.from("food_orders").insert({
        booking_ref: ref,
        restaurant_name: openRestaurant?.name || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        city: openRestaurant?.city || null,
        items: cartItems.map((m) => ({ name: m.name, qty: cart[m.id], price: m.price })),
        total: cartTotal,
        status: "placed",
      });
    } catch (e) { /* best-effort; still show confirmation locally */ }
    setSaving(false);
    setBookingRef(ref);
    setStage("confirmed");
  }

  if (stage === "confirmed") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Order placed</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>{openRestaurant.name} is preparing your order.</p>
      <div className="w-full">
        <RatingPrompt ratingType="restaurant" targetId={openRestaurant.id} targetLabel={openRestaurant.name} bookingRef={bookingRef} prompt={`Rate ${openRestaurant.name}`} />
      </div>
      <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this order</button>
      <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
      <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel order</button>
      {chatOpen && bookingRef && (
        <RideChat bookingRef={bookingRef} contextLabel={`Food order — ${openRestaurant.name}`} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
  if (stage === "cancelled") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Order cancelled</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your order has been cancelled.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
    </div>
  );

  if (stage === "cart" && openRestaurant) return (
    <div style={{ color: TEXT }}>
      <Header title="Your cart" onBack={() => setStage("menu")} />
      <div className="px-5">
        <p className="text-xs mb-3" style={{ color: FAINT }}>{openRestaurant.name}</p>
        <div className="flex flex-col gap-2 mb-5">
          {cartItems.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <FoodPhoto category={openRestaurant.foodCategory} alt={m.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-[11px]" style={{ color: GOLD }}>{m.price} SAR</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => removeItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: BORDER }}><Minus size={12} color={TEXT} /></button>
                <span className="text-sm w-3 text-center">{cart[m.id]}</span>
                <button onClick={() => addItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={12} color={BG} /></button>
              </div>
            </div>
          ))}
          {cartItems.length === 0 && <p className="text-sm text-center py-8" style={{ color: FAINT }}>Your cart is empty.</p>}
        </div>
        {cartItems.length > 0 && (
          <>
            <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><User size={14} color={GREEN} /><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
              <div className="flex items-center gap-3 py-3"><Phone size={14} color={GOLD} /><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Your mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
            </div>
            <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: MUTE }}>Total</p>
              <p className="text-lg font-semibold" style={{ color: GOLD }}>{cartTotal} SAR</p>
            </div>
            <button onClick={() => customerName.trim() && customerPhone.trim() && !saving && confirmOrder()} disabled={!customerName.trim() || !customerPhone.trim() || saving} className="w-full rounded-full py-3.5 text-sm font-semibold" style={{ background: customerName.trim() && customerPhone.trim() && !saving ? GOLD : BORDER, color: customerName.trim() && customerPhone.trim() && !saving ? BG : "#5C736D" }}>{saving ? "Placing order..." : "Checkout"}</button>
          </>
        )}
      </div>
      <div className="h-8" />
    </div>
  );

  if (stage === "menu" && openRestaurant) return (
    <div style={{ color: TEXT }}>
      <Header title={openRestaurant.name} onBack={() => { setOpenRestaurant(null); setStage("browse"); }} />
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 140, background: CARD, border: `1px solid ${BORDER}` }}>
        <FoodPhoto category={openRestaurant.foodCategory} alt={openRestaurant.name} className="w-full h-full object-cover" />
      </div>
      <div className="px-5 mb-2">
        <p className="text-xs" style={{ color: GOLD }}>{openRestaurant.cuisine}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]" style={{ color: FAINT }}>
          <span className="flex items-center gap-1"><MapPin size={11} /> {openRestaurant.city}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {openRestaurant.hours}</span>
          <span className="flex items-center gap-1"><Star size={11} color={GOLD} /> {openRestaurant.rating}</span>
          <span className="flex items-center gap-1"><Truck size={11} color={GREEN} /> Delivery available</span>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I have a question about ${openRestaurant.name} on SayyaraDrive.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1" style={{ color: GREEN }}
          >
            <MessageCircle size={11} /> WhatsApp
          </a>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5 mt-4">
        {Object.entries(menuByCategory).map(([cat, items]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 rounded-full" style={{ background: GOLD }} />
              <p className="text-sm font-semibold">{cat}</p>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <FoodPhoto category={openRestaurant.foodCategory} alt={m.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{m.desc}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: GOLD }}>{m.price.toFixed(2)} SAR</p>
                  </div>
                  {cart[m.id] ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => removeItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: BORDER }}><Minus size={12} color={TEXT} /></button>
                      <span className="text-sm w-3 text-center">{cart[m.id]}</span>
                      <button onClick={() => addItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={12} color={BG} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addItem(m)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: GOLD }}><Plus size={15} color={BG} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="px-5 mt-6 sticky bottom-3">
          <button onClick={() => setStage("cart")} className="w-full rounded-full py-3.5 text-sm font-semibold flex items-center justify-between px-5" style={{ background: GOLD, color: BG, boxShadow: "0 8px 20px rgba(217,166,83,0.35)" }}>
            <span className="flex items-center gap-2"><Bag size={15} /> {cartCount} item{cartCount > 1 ? "s" : ""}</span>
            <span>View cart · {cartTotal} SAR</span>
          </button>
        </div>
      )}
      <div className="h-8" />
    </div>
  );

  return (
    <div style={{ color: TEXT }}>
      <Header title="Food delivery" onBack={goBack} />

      {/* Hero */}
      <div className="px-5 mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(217,166,83,0.14)", border: `1px solid rgba(217,166,83,0.3)` }}>
          <UtensilsCrossed size={11} color={GOLD} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Food delivery</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order food you love</h2>
        <p className="text-xs mt-2" style={{ color: MUTE }}>Discover restaurants near you and get your meal delivered in minutes.</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button onClick={() => navigate("register_food")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: GOLD, color: BG }}>
            <UtensilsCrossed size={13} /> Apply to list your restaurant
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
            <Bag size={13} /> My orders
          </button>
          <button onClick={() => navigate("driver_login")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
            <Car size={13} /> Driver dashboard
          </button>
        </div>
      </div>

      {/* Search + city filter */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 rounded-full px-4 py-2.5 mb-2.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <Search size={15} color={FAINT} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search restaurants or cuisine..." className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full px-3.5 py-2 flex-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <MapPin size={13} color={GOLD} />
            <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent outline-none text-xs w-full" style={{ color: TEXT }}>
              {cityOptions.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}
            </select>
          </div>
          <span className="text-[11px] ml-3 shrink-0" style={{ color: FAINT }}>{filteredRestaurants.length} restaurants</span>
        </div>
      </div>

      {/* Restaurant cards */}
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRestaurants.map((r) => (
          <button key={r.id} onClick={() => openMenu(r)} className="text-left rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="relative" style={{ height: 130 }}>
              <FoodPhoto category={r.foodCategory} alt={r.name} className="w-full h-full object-cover" />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1" style={{ background: "rgba(91,143,212,0.85)", color: "#fff" }}>
                <Truck size={9} /> Delivery
              </span>
              <div className="absolute -bottom-5 left-3 w-11 h-11 rounded-xl overflow-hidden" style={{ border: `2px solid ${CARD}` }}>
                <FoodPhoto category={r.foodCategory} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="pt-7 pb-3 px-3.5">
              <p className="text-sm font-semibold">{r.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{r.cuisine}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: FAINT }}>
                <span className="flex items-center gap-1"><MapPin size={10} /> {r.city}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {r.hours}</span>
                <span className="flex items-center gap-1"><Star size={10} color={GOLD} /> {r.rating}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex-1 text-center rounded-full py-2 text-xs font-semibold" style={{ background: GOLD, color: BG }}>View menu</span>
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(91,143,212,0.15)" }}><Bot size={14} color={GREEN} /></span>
              </div>
            </div>
          </button>
        ))}
        {filteredRestaurants.length === 0 && <p className="text-sm text-center py-8" style={{ color: FAINT }}>No restaurants match your search.</p>}
      </div>

      <div className="h-6" />
    </div>
  );
}

/* ---------- LOGISTICS ---------- */
const PARCEL_SIZES = [{ id: "small", label: "Small", sub: "Up to 5kg", price: 20 }, { id: "medium", label: "Medium", sub: "Up to 20kg", price: 40 }, { id: "large", label: "Large", sub: "Needs a van", price: 90 }];
const COURIER_PARTNERS = [
  { name: "Aramex", coverage: "220+ countries · full KSA coverage", tiers: [{ label: "Standard", eta: "2-3 days", price: 20 }, { label: "Express", eta: "Next day", price: 28 }] },
  { name: "SMSA Express", coverage: "Nationwide, strong last-mile network", tiers: [{ label: "Standard", eta: "1-2 days", price: 25 }, { label: "Express", eta: "Same day (select cities)", price: 38 }] },
  { name: "Naqel Express", coverage: "Nationwide, backed by Saudi Post", tiers: [{ label: "Standard", eta: "2 days", price: 22 }, { label: "Express", eta: "Next day", price: 32 }] },
  { name: "Zajil Express", coverage: "Riyadh–Jeddah–Dammam corridor specialist", tiers: [{ label: "Standard", eta: "1-2 days", price: 18 }, { label: "Super Express", eta: "Next day AM", price: 45 }] },
  { name: "Barq Express", coverage: "Hyperlocal same-day in Riyadh & Jeddah", tiers: [{ label: "2-Hour Delivery", eta: "Within 2 hours", price: 35 }, { label: "Same Day", eta: "By end of day", price: 25 }] },
  { name: "Saudi Post (SPL)", coverage: "Official postal service, all of KSA", tiers: [{ label: "Economy", eta: "3-5 days", price: 15 }, { label: "Express", eta: "1-2 days", price: 30 }] },
];

function Logistics({ goBack, navigate }) {
  const [view, setView] = useState("request");
  const [openCourier, setOpenCourier] = useState(null);
  const [pickupAddress, setPickupAddress] = useState(""); const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupContact, setPickupContact] = useState(""); const [dropoffContact, setDropoffContact] = useState("");
  const [senderName, setSenderName] = useState("");
  const [size, setSize] = useState("small"); const [stage, setStage] = useState("input");
  const [chosenTier, setChosenTier] = useState(null);
  const chosen = PARCEL_SIZES.find((s) => s.id === size);
  const can = senderName.trim() && pickupAddress.trim() && dropoffAddress.trim() && pickupContact.trim() && dropoffContact.trim();
  const [bookingRef, setBookingRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (stage === "input") setBookingRef(null); }, [stage]);

  async function confirmPickup() {
    const ref = `PARCEL-${Date.now().toString(36).toUpperCase()}`;
    setSaving(true);
    try {
      await supabase.from("logistics_parcels").insert({
        booking_ref: ref,
        sender_name: senderName.trim(),
        sender_phone: pickupContact.trim(),
        recipient_phone: dropoffContact.trim(),
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        parcel_size: size,
        courier: openCourier?.name || null,
        price: chosenTier ? chosenTier.price : chosen.price,
        status: "requested",
      });
    } catch (e) { /* best-effort; still show confirmation locally */ }
    setSaving(false);
    setBookingRef(ref);
    setStage("confirmed");
  }
  if (stage === "confirmed") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Pickup requested</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>{openCourier ? `${openCourier.name} will contact you on WhatsApp.` : "Driver will contact you on WhatsApp."}</p>
      <button onClick={() => setChatOpen(true)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}><MessageCircle size={15} /> Chat about this pickup</button>
      <button onClick={goBack} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
      <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel pickup</button>
      {chatOpen && bookingRef && (
        <RideChat bookingRef={bookingRef} contextLabel={openCourier ? `Logistics — ${openCourier.name}` : "Logistics pickup"} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
  if (stage === "cancelled") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Pickup cancelled</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your pickup request has been cancelled.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
    </div>
  );

  return (
    <div style={{ color: TEXT }}>
      <Header title="Send a parcel" onBack={goBack} />
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 150, background: CARD, border: `1px solid ${BORDER}` }}>
        <img src="https://loremflickr.com/500/260/delivery-van,courier/all?lock=51" alt="Logistics" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,14,31,0.1), rgba(7,14,31,0.88))" }} />
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <p className="text-lg font-bold" style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>Fast, Reliable Delivery</p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>Trusted couriers across Saudi Arabia, door to door</p>
        </div>
      </div>

      <div className="px-5 mb-4 flex gap-2">
        <button onClick={() => setView("request")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "request" ? GOLD : CARD, color: view === "request" ? BG : MUTE, border: view === "request" ? "none" : `1px solid ${BORDER}` }}>
          <Package size={12} /> Request Pickup
        </button>
        <button onClick={() => setView("couriers")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold" style={{ background: view === "couriers" ? GOLD : CARD, color: view === "couriers" ? BG : MUTE, border: view === "couriers" ? "none" : `1px solid ${BORDER}` }}>
          <Truck size={12} /> Courier Partners
        </button>
      </div>

      {view === "couriers" && (
        <div className="px-5 flex flex-col gap-2">
          {COURIER_PARTNERS.map((c) => (
            <button key={c.name} onClick={() => { setOpenCourier(c); setChosenTier(c.tiers[0]); setView("request"); }} className="flex items-center justify-between rounded-xl px-4 py-3 text-left" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{c.coverage}</p>
              </div>
              <ChevronRight size={14} color={FAINT} />
            </button>
          ))}
        </div>
      )}

      {view === "request" && (
      <div className="px-5">
        <button onClick={() => navigate("register_logistics")} className="w-full mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
          <span className="flex items-center gap-2 text-sm font-semibold"><Truck size={15} color={GOLD} /> Become a delivery partner</span>
          <ChevronRight size={14} color={GOLD} />
        </button>
        {chosenTier && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: "rgba(217,166,83,0.1)", border: `1px solid rgba(217,166,83,0.3)` }}>
            <p className="text-xs" style={{ color: MUTE }}>Selected: <span style={{ color: GOLD, fontWeight: 600 }}>{openCourier?.name || chosenTier.label}</span></p>
            <button onClick={() => setChosenTier(null)} className="text-[11px]" style={{ color: "#C0755B" }}>Clear</button>
          </div>
        )}
        <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3"><User size={14} color={GOLD} /><input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
        </div>
        <p className="text-xs font-semibold mb-2" style={{ color: GREEN }}>PICKUP</p>
        <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><MapPin size={14} color={GREEN} /><input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Pickup address" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <div className="flex items-center gap-3 py-3"><Phone size={14} color={GREEN} /><input value={pickupContact} onChange={(e) => setPickupContact(e.target.value)} placeholder="Pickup contact" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
        </div>
        <p className="text-xs font-semibold mb-2" style={{ color: GOLD }}>DROP-OFF</p>
        <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><MapPin size={14} color={GOLD} /><input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Drop-off address" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <div className="flex items-center gap-3 py-3"><Phone size={14} color={GOLD} /><input value={dropoffContact} onChange={(e) => setDropoffContact(e.target.value)} placeholder="Recipient contact" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
        </div>
        <div className="flex flex-col gap-2 mb-6">
          {PARCEL_SIZES.map((s) => {
            const isSel = size === s.id;
            return (
              <button key={s.id} onClick={() => setSize(s.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                <div className="text-left"><p className="text-sm font-semibold">{s.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{s.sub}</p></div>
              </button>
            );
          })}
        </div>
        <button onClick={() => can && !saving && confirmPickup()} disabled={!can || saving} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can && !saving ? GOLD : BORDER, color: can && !saving ? BG : "#5C736D" }}>{saving ? "Requesting..." : "Request pickup"}</button>
      </div>
      )}
    </div>
  );
}

/* ---------- JOBS ---------- */
const JOBS = [
  { id: 1, title: "Ride-hailing Driver", company: "Careem", location: "Riyadh", pay: "Up to 8,000 SAR/mo", type: "Full-time", category: "Driving", phone: "0550 000 001", description: "Drive passengers around the city on flexible hours." },
  { id: 2, title: "Food Delivery Rider", company: "Jahez", location: "Jeddah", pay: "Per-order + bonuses", type: "Flexible", category: "Delivery", phone: "0550 000 002", description: "Deliver food orders by bike or car, choose your own hours." },
  { id: 3, title: "Customer Support Agent", company: "STC", location: "Riyadh", pay: "5,500 SAR/mo", type: "Full-time", category: "Support", phone: "0550 000 003", description: "Handle customer calls and chat support for a major telecom." },
  { id: 4, title: "Airport Transfer Driver", company: "Careem", location: "Dammam", pay: "Up to 9,500 SAR/mo", type: "Full-time", category: "Driving", phone: "0550 000 004", description: "Pick up and drop off travellers at King Fahd Airport." },
  { id: 5, title: "Fleet Operations Coordinator", company: "Aramex", location: "Riyadh", pay: "7,000 SAR/mo", type: "Full-time", category: "Operations", phone: "0550 000 005", description: "Coordinate daily dispatch and vehicle maintenance schedules." },
  { id: 6, title: "Outside-City Driver", company: "SAPTCO", location: "Makkah", pay: "Per-trip + fuel bonus", type: "Flexible", category: "Driving", phone: "0550 000 006", description: "Drive scheduled outside-city routes between major Saudi cities." },
  { id: 7, title: "Warehouse Logistics Staff", company: "SMSA Express", location: "Jubail", pay: "6,000 SAR/mo", type: "Full-time", category: "Operations", phone: "0550 000 007", description: "Sort and prepare parcels for daily delivery routes." },
  { id: 8, title: "Delivery Rider", company: "HungerStation", location: "Khobar", pay: "Per-order + bonuses", type: "Flexible", category: "Delivery", phone: "0550 000 008", description: "Flexible food delivery shifts, motorbike provided on request." },
];
const JOB_CATEGORIES = ["All", "Driving", "Delivery", "Support", "Operations"];
const EXTERNAL_JOB_SITES = [
  { name: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=driver%20saudi%20arabia", icon: Link, tag: "Global", tagColor: "#5B8FD4", gradient: "linear-gradient(135deg, #2C4EA8, #1B2F6B)", description: "World's largest professional network. Find driver and logistics roles across KSA." },
  { name: "Bayt", url: "https://www.bayt.com/en/saudi-arabia/jobs/driver-jobs/", icon: Briefcase, tag: "MENA Leader", tagColor: "#E05C7A", gradient: "linear-gradient(135deg, #C0447A, #7A2050)", description: "Middle East's leading job site. Thousands of transport & driving jobs in Saudi Arabia." },
  { name: "GulfTalent", url: "https://www.gulftalent.com/saudi-arabia/jobs", icon: Globe, tag: "Gulf Jobs", tagColor: "#3FBFA6", gradient: "linear-gradient(135deg, #14453F, #0B2320)" , description: "Premier Gulf region job board. Driver, chauffeur, and fleet positions in KSA." },
  { name: "Indeed KSA", url: "https://sa.indeed.com/jobs?q=driver", icon: Search, tag: "#1 Worldwide", tagColor: "#5B8FD4", gradient: "linear-gradient(135deg, #1E3A72, #12234A)", description: "Search millions of jobs. Driving, delivery, and logistics across all Saudi cities." },
  { name: "Tanqeeb", url: "https://sa.tanqeeb.com/", icon: MapPinned, tag: "Saudi Platform", tagColor: "#3FBFA6", gradient: "linear-gradient(135deg, #15505B, #0C2E35)", description: "Saudi Arabia's national employment platform. Local driver & logistics jobs." },
  { name: "NaukriGulf", url: "https://www.naukrigulf.com/", icon: Trophy, tag: "Verified", tagColor: "#A78BFA", gradient: "linear-gradient(135deg, #4C3D8C, #2A2255)", description: "Trusted Gulf job portal. Thousands of verified transport & driving vacancies in KSA." },
];
const JOB_TABS = [
  { id: "openings", label: "Job Openings", icon: Search },
  { id: "post", label: "Post a Job", icon: Plus },
  { id: "applicants", label: "My Applicants", icon: Users },
  { id: "platforms", label: "Job Platforms", icon: Circle },
];

function JobsPortal({ goBack }) {
  const [tab, setTab] = useState("openings");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [dbJobs, setDbJobs] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", cv: null, extraDocs: null, cover: "" });
  const [submitted, setSubmitted] = useState(false);
  const can = form.name.trim() && form.phone.trim() && form.cv;

  const [postForm, setPostForm] = useState({ title: "", company: "", city: "", jobType: "", employment: "", minSalary: "", maxSalary: "", description: "", requirements: "", phone: "", email: "" });
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postDone, setPostDone] = useState(false);
  const postCan = postForm.title.trim() && postForm.company.trim() && postForm.city.trim() && postForm.jobType.trim() && postForm.description.trim() && postForm.phone.trim();

  async function loadJobs() {
    const { data } = await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false });
    if (data) {
      setDbJobs(data.map((r) => ({
        id: `db-${r.id}`,
        title: r.title,
        company: r.company || "Employer",
        location: r.location,
        pay: r.pay,
        type: r.job_type || "Full-time",
        category: r.category || "Driving",
        phone: r.phone,
        description: r.description,
      })));
    }
  }
  useEffect(() => { loadJobs(); }, []);

  const allJobs = [...dbJobs, ...JOBS];
  const filtered = allJobs.filter((j) =>
    (category === "All" || j.category === category) &&
    (j.title.toLowerCase().includes(query.toLowerCase()) || j.company.toLowerCase().includes(query.toLowerCase()) || j.location.toLowerCase().includes(query.toLowerCase()))
  );

  async function submitPost() {
    setPostSubmitting(true);
    const pay = postForm.minSalary && postForm.maxSalary
      ? `${postForm.minSalary}–${postForm.maxSalary} SAR/mo`
      : postForm.minSalary ? `From ${postForm.minSalary} SAR/mo` : "Salary on request";
    try {
      await supabase.from("jobs").insert({
        title: postForm.title,
        company: postForm.company,
        location: postForm.city,
        pay,
        job_type: postForm.jobType,
        category: "Driving",
        phone: postForm.phone,
        email: postForm.email,
        description: postForm.description || "No description provided.",
        status: "active",
      });
      await loadJobs();
    } catch (e) { /* insert failed, job just won't show up until retried */ }
    setPostSubmitting(false);
    setPostDone(true);
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Jobs" onBack={goBack} />

      {/* Hero */}
      <div className="px-5 mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(217,166,83,0.14)", border: `1px solid rgba(217,166,83,0.3)` }}>
          <Briefcase size={11} color={GOLD} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Jobs portal</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Driver Jobs Portal</h2>
        <p className="text-xs mt-2" style={{ color: MUTE }}>Find real driver openings, post a vacancy, or explore trusted global job platforms.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px]" style={{ color: FAINT }}>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} /> {allJobs.length} active openings</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} /> Real-time updates</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} /> Multiple cities</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5 flex gap-2 overflow-x-auto">
        {JOB_TABS.map((tb) => {
          const Icon = tb.icon;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0" style={{ background: tab === tb.id ? GOLD : CARD, color: tab === tb.id ? BG : MUTE, border: tab === tb.id ? "none" : `1px solid ${BORDER}` }}>
              <Icon size={12} /> {tb.label}
            </button>
          );
        })}
      </div>

      {/* Job Openings tab */}
      {tab === "openings" && (
        <>
          <div className="px-5 mb-4">
            <div className="flex items-center gap-2 rounded-full px-4 py-2.5 mb-2.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Search size={15} color={FAINT} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search job title, company, city..." className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {JOB_CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0" style={{ background: category === c ? GOLD : CARD, color: category === c ? BG : MUTE, border: category === c ? "none" : `1px solid ${BORDER}` }}>{c}</button>
                ))}
              </div>
              <span className="text-[11px] ml-3 shrink-0" style={{ color: FAINT }}>{filtered.length} openings</span>
            </div>
          </div>

          <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filtered.map((j) => (
              <div key={j.id} className="rounded-2xl px-4 py-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "rgba(217,166,83,0.14)", color: GOLD }}>
                    {j.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{j.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: GOLD }}>{j.company}</p>
                  </div>
                  <button onClick={() => setApplyJob(j)} className="px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0" style={{ background: GOLD, color: BG }}>Apply now</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(91,143,212,0.15)", color: GREEN }}>{j.type}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: BORDER, color: MUTE }}>{j.category}</span>
                </div>
                {j.description && <p className="text-[11px] mt-2" style={{ color: MUTE }}>{j.description}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px]" style={{ color: FAINT }}>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {j.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={11} /> {j.pay}</span>
                  {j.phone && <span className="flex items-center gap-1"><Phone size={11} /> {j.phone}</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-center py-8" style={{ color: FAINT }}>No openings match your search.</p>}
          </div>
        </>
      )}

      {/* Post a Job tab */}
      {tab === "post" && (
        <div className="px-5">
          {!postDone ? (
            <>
              <div className="rounded-2xl px-4 py-4 mb-5" style={{ background: "rgba(217,166,83,0.1)", border: `1px solid rgba(217,166,83,0.3)` }}>
                <div className="flex items-center gap-2">
                  <Plus size={16} color={GOLD} />
                  <h2 className="text-base font-semibold">Post a Job Opening</h2>
                </div>
                <p className="text-[11px] mt-1" style={{ color: MUTE }}>Complete the details to reach thousands of drivers across KSA.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Job Title</p>
                  <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="e.g. Senior Delivery Driver" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Company Name <span style={{ color: "#C0755B" }}>*</span></p>
                    <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <Briefcase size={13} color={GOLD} />
                      <input value={postForm.company} onChange={(e) => setPostForm({ ...postForm, company: e.target.value })} placeholder="e.g. Golden Transport Fleet" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>City <span style={{ color: "#C0755B" }}>*</span></p>
                    <div className="rounded-xl px-4 py-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <select value={postForm.city} onChange={(e) => setPostForm({ ...postForm, city: e.target.value })} className="bg-transparent outline-none text-sm w-full py-3" style={{ color: postForm.city ? TEXT : FAINT }}>
                        <option value="" style={{ background: CARD }}>Select City</option>
                        {SAUDI_CITY_LIST.map((c) => <option key={c} value={c} style={{ background: CARD }}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Job Type <span style={{ color: "#C0755B" }}>*</span></p>
                    <div className="rounded-xl px-4 py-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <select value={postForm.jobType} onChange={(e) => setPostForm({ ...postForm, jobType: e.target.value })} className="bg-transparent outline-none text-sm w-full py-3" style={{ color: postForm.jobType ? TEXT : FAINT }}>
                        <option value="" style={{ background: CARD }}>Select Type</option>
                        <option value="Full-time" style={{ background: CARD }}>Full-time</option>
                        <option value="Part-time" style={{ background: CARD }}>Part-time</option>
                        <option value="Flexible" style={{ background: CARD }}>Flexible</option>
                        <option value="Freelance" style={{ background: CARD }}>Freelance</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Employment</p>
                    <div className="rounded-xl px-4 py-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <select value={postForm.employment} onChange={(e) => setPostForm({ ...postForm, employment: e.target.value })} className="bg-transparent outline-none text-sm w-full py-3" style={{ color: postForm.employment ? TEXT : FAINT }}>
                        <option value="" style={{ background: CARD }}>Select</option>
                        <option value="On-site" style={{ background: CARD }}>On-site</option>
                        <option value="Remote" style={{ background: CARD }}>Remote</option>
                        <option value="Hybrid" style={{ background: CARD }}>Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Min Salary (SAR)</p>
                    <input value={postForm.minSalary} onChange={(e) => setPostForm({ ...postForm, minSalary: e.target.value })} placeholder="4000" inputMode="numeric" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Max Salary (SAR)</p>
                    <input value={postForm.maxSalary} onChange={(e) => setPostForm({ ...postForm, maxSalary: e.target.value })} placeholder="8000" inputMode="numeric" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Job Description <span style={{ color: "#C0755B" }}>*</span></p>
                  <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Describe role, qualifications, benefits..." rows={4} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Requirements</p>
                  <textarea value={postForm.requirements} onChange={(e) => setPostForm({ ...postForm, requirements: e.target.value })} placeholder="Experience, license, nationality..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Contact Phone <span style={{ color: "#C0755B" }}>*</span></p>
                    <input value={postForm.phone} onChange={(e) => setPostForm({ ...postForm, phone: e.target.value })} placeholder="+966 5X XXX XXXX" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Contact Email</p>
                    <input value={postForm.email} onChange={(e) => setPostForm({ ...postForm, email: e.target.value })} placeholder="hr@company.com" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                </div>

                <button onClick={submitPost} disabled={!postCan || postSubmitting} className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold mt-2" style={{ background: postCan ? GOLD : BORDER, color: postCan ? BG : "#5C736D" }}>
                  <Send size={14} /> {postSubmitting ? "Publishing…" : "Publish Job Opening"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle2 size={44} color={GREEN} />
              <h2 className="mt-4 text-lg font-semibold">Job posted</h2>
              <p className="text-xs mt-1" style={{ color: MUTE }}>Your listing is now live under Job Openings.</p>
              <button onClick={() => { setPostDone(false); setPostForm({ title: "", company: "", city: "", jobType: "", employment: "", minSalary: "", maxSalary: "", description: "", requirements: "", phone: "", email: "" }); setTab("openings"); }} className="w-full max-w-xs mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>View openings</button>
            </div>
          )}
        </div>
      )}

      {/* My Applicants tab */}
      {tab === "applicants" && (
        <div className="px-5 flex flex-col items-center text-center py-12">
          <Users size={32} color={FAINT} />
          <p className="text-sm font-semibold mt-3">No applicants yet</p>
          <p className="text-xs mt-1" style={{ color: FAINT }}>Once candidates apply to your posted jobs, they'll show up here.</p>
        </div>
      )}

      {/* Job Platforms tab */}
      {tab === "platforms" && (
        <div className="px-5">
          <h2 className="text-lg font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Trusted Job Platforms</h2>
          <p className="text-xs text-center mt-1.5 mb-5" style={{ color: MUTE }}>Browse the largest, most trusted job platforms across Saudi Arabia and the Gulf.</p>
          <div className="flex flex-col gap-4">
            {EXTERNAL_JOB_SITES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: s.gradient, border: `1px solid ${BORDER}` }}>
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.35)", color: s.tagColor }}>{s.tag}</span>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <Icon size={24} color="#fff" />
                  </div>
                  <p className="text-base font-bold" style={{ color: "#fff" }}>{s.name}</p>
                  <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{s.description}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold mt-4"
                    style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}
                  >
                    <ArrowRightLeft size={12} style={{ transform: "rotate(45deg)" }} /> Browse Jobs
                  </a>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-center mt-5" style={{ color: FAINT }}>SayyaraDrive does not control external job platform content. Links open official websites.</p>
        </div>
      )}

      {applyJob && (
        <div className="fixed inset-0 flex items-end justify-center z-40" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-3xl p-5 overflow-y-auto" style={{ background: CARD, border: `1px solid ${BORDER}`, maxHeight: "88vh" }}>
            {!submitted ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold">Apply for this Job</h2>
                    <p className="text-xs mt-0.5" style={{ color: FAINT }}>{applyJob.title} · {applyJob.company} · {applyJob.location}</p>
                  </div>
                  <button onClick={() => setApplyJob(null)}><X size={18} color={MUTE} /></button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Full Name <span style={{ color: "#C0755B" }}>*</span></p>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Phone <span style={{ color: "#C0755B" }}>*</span></p>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966 5X XXX XXXX" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Email</p>
                      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>CV / Resume (PDF, DOC, DOCX) <span style={{ color: "#C0755B" }}>*</span></p>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer" style={{ background: BG, border: `1.5px dashed ${BORDER}` }}>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setForm({ ...form, cv: e.target.files?.[0] || null })} />
                      <Send size={18} color={form.cv ? GREEN : FAINT} style={{ transform: "rotate(-45deg)" }} />
                      <p className="text-xs font-medium" style={{ color: form.cv ? GREEN : MUTE }}>{form.cv ? form.cv.name : "Click to upload your CV"}</p>
                      {!form.cv && <p className="text-[10px]" style={{ color: FAINT }}>PDF, DOC, DOCX</p>}
                    </label>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Additional Documents (optional)</p>
                    <label className="flex items-center justify-center gap-2 rounded-xl py-3 cursor-pointer" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                      <input type="file" multiple className="hidden" onChange={(e) => setForm({ ...form, extraDocs: e.target.files })} />
                      <Send size={13} color={MUTE} style={{ transform: "rotate(-45deg)" }} />
                      <p className="text-xs font-medium" style={{ color: MUTE }}>{form.extraDocs && form.extraDocs.length > 0 ? `${form.extraDocs.length} file(s) selected` : "Add documents"}</p>
                    </label>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: MUTE }}>Cover Message</p>
                    <textarea value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} placeholder="Why are you a good fit for this role?" rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>

                  {applyJob.phone && (
                    <a
                      href={`https://wa.me/${applyJob.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the ${applyJob.title} position at ${applyJob.company}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
                      style={{ background: "rgba(91,143,212,0.18)", color: GREEN }}
                    >
                      <Bot size={15} /> Contact employer on WhatsApp
                    </a>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setApplyJob(null)} className="flex-1 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Cancel</button>
                    <button onClick={() => can && setSubmitted(true)} disabled={!can} className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>
                      <Send size={13} /> Submit Application
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <CheckCircle2 size={40} color={GREEN} /><h2 className="mt-3 text-base font-semibold">Application sent</h2>
                <p className="text-xs mt-1" style={{ color: MUTE }}>{applyJob.company} will contact you on WhatsApp.</p>
                <button onClick={() => { setApplyJob(null); setSubmitted(false); setForm({ name: "", phone: "", email: "", cv: null, extraDocs: null, cover: "" }); }} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

/* ---------- FLEET ---------- */
const STATUS_META = { active: { label: "On trip", color: GREEN }, idle: { label: "Idle", color: GOLD }, maintenance: { label: "Maintenance", color: "#C0755B" } };
const INITIAL_FLEET = [
  { id: 1, plate: "RUH 4021", model: "Toyota Camry", driver: "Faisal A.", company: "Al Rasheed Transport Co.", status: "active" },
  { id: 2, plate: "RUH 7788", model: "Hyundai Accent", driver: "Omar K.", company: "Theeb Rent a Car", status: "idle" },
  { id: 3, plate: "JED 3390", model: "Toyota Fortuner", driver: "Sami R.", company: "Al Rasheed Transport Co.", status: "maintenance" },
  { id: 4, plate: "DMM 1156", model: "Lexus ES", driver: "Hussain M.", company: "Sixt Rent a Car", status: "active" },
  { id: 5, plate: "RUH 9021", model: "Toyota Camry", driver: "Unassigned", company: "Lumi Rent a Car", status: "idle" },
  { id: 6, plate: "MKH 2287", model: "GMC Yukon", driver: "Bandar S.", company: "Al Rasheed Transport Co.", status: "active" },
];
function FleetManagement({ goBack, navigate }) {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  function cycleStatus(id) { const order = ["idle", "active", "maintenance"]; setFleet((f) => f.map((c) => c.id === id ? { ...c, status: order[(order.indexOf(c.status) + 1) % order.length] } : c)); }
  return (
    <div style={{ color: TEXT }}>
      <Header title="Fleet" onBack={goBack} />
      <div className="px-5 mb-4">
        <button onClick={() => navigate("register_fleet")} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
          <span className="flex items-center gap-2 text-sm font-semibold"><Users size={15} color={GOLD} /> Apply to register a fleet company</span>
          <ChevronRight size={14} color={GOLD} />
        </button>
      </div>
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {fleet.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.12)" }}><Car size={19} color={GOLD} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.plate}</p><button onClick={() => cycleStatus(c.id)} className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</button></div>
                <p className="text-[11px]" style={{ color: FAINT }}>{c.model} · {c.driver}</p>
                <p className="text-[10px] mt-0.5" style={{ color: GOLD }}>{c.company}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-5 mt-3 text-[10px]" style={{ color: "#5C736D" }}>Tap a status pill to update it.</p>
    </div>
  );
}

/* ---------- PROFILE ---------- */
function Profile({ goBack, navigate, currentDriver, driverLogout }) {
  const identity = resolveIdentity(currentDriver);
  const [rating, setRating] = useState(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("sayyara_lang") || "en"; } catch (e) { return "en"; } });
  function updateLang(code) {
    setLang(code);
    try { localStorage.setItem("sayyara_lang", code); } catch (e) {}
  }

  useEffect(() => {
    async function loadRating() {
      if (!currentDriver?.profile?.id) { setRating(null); return; }
      const { data } = await supabase.from("ratings").select("rating").eq("rating_type", "driver").eq("target_id", String(currentDriver.profile.id)).eq("status", "visible");
      if (data && data.length > 0) setRating((data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1));
    }
    loadRating();
  }, [currentDriver]);

  function handleSignOut() {
    if (currentDriver) {
      driverLogout();
    } else {
      try { localStorage.removeItem("sayyara_chat_name"); localStorage.removeItem("sayyara_chat_phone"); } catch (e) {}
      navigate("home");
    }
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Profile" onBack={goBack} />
      <div className="px-5 flex flex-col items-center text-center mb-5">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: BORDER, color: GOLD }}>{identity.name.charAt(0).toUpperCase()}</div>
        <h2 className="mt-3 text-base font-semibold">{identity.name}</h2>
        <p className="text-xs flex items-center gap-1 mt-1" style={{ color: MUTE }}>
          {rating && <><Star size={11} color={GOLD} /> {rating} · </>}Riyadh, Saudi Arabia
        </p>
        {identity.type && (
          <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: "rgba(217,166,83,0.14)", color: GOLD }}>{identity.type}</span>
        )}
      </div>
      <div className="px-5 mb-5">
        <div className="rounded-2xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3"><Phone size={14} color={FAINT} /><span className="text-sm">{identity.id}</span></div>
        </div>
      </div>
      <div className="px-5 mb-5 flex flex-col gap-2">
        {currentDriver?.type === "driver" && (
          <button onClick={() => navigate("driver_edit_profile")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="flex items-center gap-3 text-sm"><User size={15} color={GOLD} /> Edit profile / My ID</span>
            <ChevronRight size={14} color="#5C736D" />
          </button>
        )}
        <button onClick={() => setShowLangPicker(true)} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Globe size={15} color={GOLD} /> Language</span>
          <span className="flex items-center gap-1 text-xs" style={{ color: FAINT }}>{lang.toUpperCase()} <ChevronRight size={14} color="#5C736D" /></span>
        </button>
        <button onClick={() => navigate("wallet")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><DollarSign size={15} color={GOLD} /> Payments & wallet</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("activity")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Route size={15} color={GOLD} /> Ride history</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("friends")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><MessageCircle size={15} color={GOLD} /> Friends & family chat</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("driver")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Car size={15} color={GOLD} /> Switch to driver mode</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("notifications")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Bell size={15} color={GOLD} /> Notifications</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("home")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Shield size={15} color={GOLD} /> Safety</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("support_chat")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
          <span className="flex items-center gap-3 text-sm"><HelpCircle size={15} color={GOLD} /> Message support</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi SayyaraDrive, I need help with the app.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: "transparent", border: `1px solid ${BORDER}` }}
        >
          <span className="flex items-center gap-3 text-sm" style={{ color: MUTE }}><MessageCircle size={15} color="#25D366" /> Contact support on WhatsApp</span>
          <ChevronRight size={14} color="#5C736D" />
        </a>
      </div>
      <div className="px-5">
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#C0755B" }}>
          <LogOut size={15} /> {currentDriver ? "Sign out" : "Reset guest ID"}
        </button>
      </div>
      {showLangPicker && <LanguagePicker lang={lang} setLang={updateLang} onClose={() => setShowLangPicker(false)} />}
    </div>
  );
}

/* ---------- ACTIVITY ---------- */
const TYPE_META = { ride: { icon: Car, label: "Ride" }, city: { icon: Car, label: "City ride" }, airport: { icon: Plane, label: "Airport transfer" }, intercity: { icon: Route, label: "Outside city trip" } };
const TRIPS = [
  { id: 1, type: "ride", date: "Jul 8, 2026", from: "Al Olaya Street", to: "King Fahd Rd", fare: 24 },
  { id: 2, type: "airport", date: "Jul 5, 2026", from: "Home", to: "RUH Airport", fare: 85 },
  { id: 3, type: "ride", date: "Jul 3, 2026", from: "Al Malaz", to: "Panorama Mall", fare: 19 },
  { id: 4, type: "airport", date: "Jun 29, 2026", from: "JED Airport", to: "Al Hamra", fare: 62 },
];
function TripHistory({ goBack }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let refs = [];
      try { refs = JSON.parse(localStorage.getItem("sayyara_my_rides") || "[]"); } catch (e) {}
      if (refs.length === 0) { setLoading(false); return; }
      const { data } = await supabase.from("rides").select("*").in("booking_ref", refs).order("created_at", { ascending: false });
      setTrips(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ color: TEXT }}>
      <Header title="Activity" onBack={goBack} />
      <div className="px-5 mb-4">
        <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs" style={{ color: FAINT }}>Total trips</p>
          <p className="text-lg font-semibold">{trips.length}</p>
        </div>
      </div>
      {loading && <div className="px-5 flex flex-col gap-2">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}
      {!loading && trips.length === 0 && (
        <EmptyState icon={Route} title="No trips yet" subtitle="Rides you book on this device will show up here." />
      )}
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {!loading && trips.map((t) => {
          const meta = TYPE_META[t.ride_type] || TYPE_META.ride;
          const Icon = meta.icon;
          const statusColor = t.status === "completed" ? GREEN : t.status === "cancelled" ? "#C0755B" : GOLD;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${statusColor}22`, color: statusColor }}>{t.status}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{t.pickup_label} → {t.dropoff_label}</p>
                {t.distance_km && <p className="text-[10px] mt-0.5" style={{ color: FAINT }}>{t.distance_km} km · ~{t.duration_min} min</p>}
                <p className="text-[10px] mt-1" style={{ color: FAINT }}>{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- DRIVER TRIP HISTORY ---------- */
const DRIVER_TRIPS = [
  { id: 1, type: "ride", date: "Jul 8, 2026", rider: "Faisal A.", from: "Al Olaya Street", to: "King Fahd Rd", fare: 24 },
  { id: 2, type: "airport", date: "Jul 6, 2026", rider: "Sara M.", from: "Home", to: "RUH Airport", fare: 85 },
  { id: 3, type: "ride", date: "Jul 4, 2026", rider: "Ahmed T.", from: "Al Malaz", to: "Panorama Mall", fare: 19 },
  { id: 4, type: "ride", date: "Jul 3, 2026", rider: "Nourah S.", from: "Diriyah", to: "King Fahd District", fare: 27 },
  { id: 5, type: "airport", date: "Jun 30, 2026", rider: "Khalid B.", from: "JED Airport", to: "Al Hamra", fare: 62 },
];

function DriverTripHistory({ goBack, currentDriver }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const driverId = currentDriver?.profile?.id;

  useEffect(() => {
    async function load() {
      if (!driverId) { setLoading(false); return; }
      const { data } = await supabase.from("rides").select("*").eq("driver_id", driverId).eq("status", "completed").order("created_at", { ascending: false });
      setTrips(data || []);
      setLoading(false);
    }
    load();
  }, [driverId]);

  const totalDistance = trips.reduce((s, t) => s + (t.distance_km || 0), 0);

  return (
    <div style={{ color: TEXT }}>
      <Header title="Trip history" onBack={goBack} />
      <div className="px-5 mb-4">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div><p className="text-xs" style={{ color: FAINT }}>Total distance</p><p className="text-lg font-semibold" style={{ color: GOLD }}>{totalDistance.toFixed(1)} km</p></div>
          <div className="text-right"><p className="text-xs" style={{ color: FAINT }}>Trips completed</p><p className="text-lg font-semibold">{trips.length}</p></div>
        </div>
      </div>
      {loading && <div className="px-5 flex flex-col gap-2">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}
      {!loading && !driverId && (
        <EmptyState icon={Route} title="Log in to see your trips" subtitle="Your real trip history will appear here once you're logged in." />
      )}
      {!loading && driverId && trips.length === 0 && (
        <EmptyState icon={Route} title="No completed trips yet" subtitle="Trips you complete will show up here." />
      )}
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {!loading && trips.map((t) => {
          const meta = TYPE_META[t.ride_type] || TYPE_META.ride;
          const Icon = meta.icon;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  {t.distance_km && <p className="text-[11px] font-semibold" style={{ color: GREEN }}>{t.distance_km} km</p>}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{t.pickup_label} → {t.dropoff_label}</p>
                <p className="text-[10px] mt-1" style={{ color: FAINT }}>{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ---------- WALLET (placeholder tab) ---------- */
function WalletTab({ goBack }) {
  return (
    <div style={{ color: TEXT }}>
      <Header title="Wallet" onBack={goBack} />
      <div className="px-5">
        <div className="rounded-2xl px-4 py-5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs" style={{ color: FAINT }}>Current balance</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: GOLD }}>0 SAR</p>
          <p className="text-xs mt-2" style={{ color: MUTE }}>Cash payments only for now — no wallet top-up needed.</p>
        </div>
      </div>
    </div>
  );
}
/* ---------- BOTTOM NAV ---------- */
const TABS = [
  { id: "home", key: "home" },
  { id: "activity", key: "activity" },
  { id: "wallet", key: "wallet" },
  { id: "profile", key: "profile" },
];
function BottomNav({ screen, navigate, t }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md lg:max-w-5xl flex justify-around items-center py-3 px-5" style={{ background: "#0F211E", borderTop: `1px solid ${BORDER}` }}>
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => navigate(tab.id)} className="flex flex-col items-center gap-1" style={{ color: screen === tab.id ? GOLD : "#6C847E" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: screen === tab.id ? GOLD : "transparent" }} />
          <span className="text-[10px] font-medium">{t ? t(tab.key) : tab.key}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- WELCOME / ENTRY SCREEN ---------- */
function WelcomeScreen({ navigate }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-end" style={{ background: BG, color: TEXT }}>
      <SkylineBackground opacity={1} />
      <div className="relative z-10 px-6 pb-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5" style={{ background: "rgba(217,166,83,0.14)", border: `1px solid rgba(217,166,83,0.3)` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Proudly Saudi · Est. 2026</span>
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}, #B8863B)`, boxShadow: `0 6px 18px rgba(217,166,83,0.4)` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 20 L4 10 L12 4 L20 10 L20 20" stroke={BG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 20 V13 H15 V20" stroke={BG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>
            سيارة<span style={{ color: GOLD }}>Drive</span>
          </h1>
        </div>

        <h2 className="text-lg font-semibold leading-snug max-w-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Saudi Arabia's everyday mobility platform
        </h2>
        <p className="text-sm mt-2 mb-5 max-w-xs" style={{ color: MUTE }}>
          Rides, rentals, deliveries, jobs, and driver earnings — all in one trusted app, built for the Kingdom.
        </p>

        <div className="grid grid-cols-5 gap-2 mb-6 w-full max-w-sm">
          {[
            { icon: Car, label: "Rides" },
            { icon: Key, label: "Rentals" },
            { icon: Truck, label: "Delivery" },
            { icon: Briefcase, label: "Jobs" },
            { icon: DollarSign, label: "Earnings" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(217,166,83,0.14)" }}>
                <Icon size={15} color={GOLD} />
              </div>
              <span className="text-[9px] font-medium" style={{ color: MUTE }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-7 text-[11px]" style={{ color: FAINT }}>
          <span className="flex items-center gap-1.5"><Shield size={12} color={GREEN} /> Verified drivers</span>
          <span className="flex items-center gap-1.5"><DollarSign size={12} color={GREEN} /> Cash on delivery</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} color={GREEN} /> All major cities</span>
        </div>

        <button onClick={() => navigate("auth_choice")} className="w-full max-w-sm rounded-full py-4 text-sm font-semibold mb-3" style={{ background: GOLD, color: BG, boxShadow: "0 8px 20px rgba(217,166,83,0.3)" }}>
          Log in / Sign up
        </button>
        <button onClick={() => navigate("register_choice")} className="w-full max-w-sm rounded-full py-4 text-sm font-semibold mb-5" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
          Register
        </button>

        <p className="text-[10px]" style={{ color: FAINT }}>By continuing, you agree to use SayyaraDrive responsibly and respectfully.</p>
      </div>
    </div>
  );
}

/* ---------- AUTH CHOICE (passenger vs driver) ---------- */
function AuthChoiceScreen({ goBack, navigate }) {
  return (
    <div style={{ color: TEXT }}>
      <Header title="Log in / Sign up" onBack={goBack} />
      <div className="px-5 flex flex-col gap-3 mt-2">
        <button onClick={() => navigate("passenger_login")} className="w-full rounded-full py-4 text-sm font-semibold" style={{ background: GOLD, color: BG, boxShadow: "0 8px 20px rgba(217,166,83,0.3)" }}>
          Log in / Sign up as passenger
        </button>
        <button onClick={() => navigate("driver_login")} className="w-full rounded-full py-4 text-sm font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
          Driver login / sign up
        </button>
      </div>
    </div>
  );
}

/* ---------- REGISTER CHOICE (business applications) ---------- */
function RegisterChoiceScreen({ goBack, navigate }) {
  return (
    <div style={{ color: TEXT }}>
      <Header title="Register" onBack={goBack} />
      <div className="px-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: FAINT }}>Apply as a business (subject to review)</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate("register_fleet")} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT }}><Users size={15} color={GREEN} /> Apply to register your company</span>
            <ChevronRight size={14} color={GREEN} />
          </button>
          <button onClick={() => navigate("register_rental")} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT }}><Key size={15} color={GOLD} /> Own a car? Apply to list it for rent</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <button onClick={() => navigate("company_login")} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "transparent", border: `1px solid ${BORDER}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: MUTE }}><Briefcase size={15} color={MUTE} /> Already registered? Company login</span>
            <ChevronRight size={14} color={MUTE} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- AUTH (SIGN UP / LOGIN) ---------- */
function AuthScreen({ goBack, type, navigate, onLoggedIn }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(`sayyara_last_email_${type}`) || ""; } catch (e) { return ""; }
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [iqama, setIqama] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [cityType, setCityType] = useState("inside_city");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isDriver = type === "driver";

  function rememberEmail() {
    try {
      if (rememberMe) localStorage.setItem(`sayyara_last_email_${type}`, email.trim());
      else localStorage.removeItem(`sayyara_last_email_${type}`);
    } catch (e) {}
  }

  function validateSignup() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      return "Please enter your full name.";
    }
    const mobileDigits = mobile.replace(/[\s-]/g, "");
    if (!/^(05\d{8}|9665\d{8}|\+9665\d{8})$/.test(mobileDigits)) {
      return "Please enter a valid Saudi mobile number (e.g. 05XXXXXXXX).";
    }
    if (isDriver) {
      if (!/^\d{10}$/.test(iqama.trim())) {
        return "Iqama number must be exactly 10 digits.";
      }
      if (!vehicleNumber.trim()) {
        return "Please enter your vehicle number.";
      }
    }
    return null;
  }

  async function handleForgotPassword() {
    setError(""); setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (e) {
      setError(e.message || "Couldn't send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setError(""); setLoading(true);
    const validationError = validateSignup();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    try {
      if (isDriver) {
        const { data: existingStatus } = await supabase.rpc("check_iqama_status", { p_iqama: iqama });
        if (existingStatus) {
          if (existingStatus === "blocked") {
            setError("This Iqama number belongs to a blocked driver account. Contact support for help.");
          } else {
            setError("An account already exists with this Iqama number. Please log in instead.");
          }
          setLoading(false);
          return;
        }
      }
      // Profile row is created automatically by a database trigger in the same
      // transaction as the auth account — passing the details as signup metadata
      // avoids a race condition where a separate insert can fire before the
      // auth user is fully visible to the database.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: {
          data: isDriver
            ? { role: "driver", full_name: fullName, mobile_number: mobile, iqama_number: iqama, vehicle_number: vehicleNumber, city_type: cityType }
            : { role: "passenger", full_name: fullName, mobile_number: mobile },
        },
      });
      if (signUpError) throw signUpError;
      const authUserId = data.user?.id;
      const table = isDriver ? "drivers" : "passengers";
      // The trigger runs synchronously in the same transaction, so the row should
      // already exist — but retry briefly in case of any read-replica lag.
      let profile = null;
      for (let attempt = 0; attempt < 4 && !profile; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
        const { data: found } = await supabase.from(table).select("*").eq("auth_user_id", authUserId).maybeSingle();
        if (found) profile = found;
      }
      if (!profile) throw new Error("Account created, but your profile is still syncing — please try logging in again in a moment.");
      if (onLoggedIn) onLoggedIn({ email, type: isDriver ? "driver" : "passenger", profile });
      rememberEmail();
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError(""); setLoading(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    try {
      const { data: signInData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      let profile = null;
      if (isDriver) {
        const authUserId = signInData?.user?.id;
        const { data } = await supabase.from("drivers").select("*").eq("auth_user_id", authUserId).maybeSingle();
        profile = data;
        if (profile && profile.status === "blocked") {
          setError("This driver account has been blocked. Contact support.");
          setLoading(false);
          return;
        }
        if (!profile) {
          setError("No driver profile found for this account. Please sign up first.");
          setLoading(false);
          return;
        }
      }
      if (onLoggedIn) onLoggedIn({ email, type, profile });
      rememberEmail();
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="px-5 mt-8 flex flex-col items-center text-center" style={{ color: TEXT }}>
        <CheckCircle2 size={44} color={GREEN} />
        <h2 className="mt-4 text-lg font-semibold">
          {mode === "signup" ? "Account created" : "Logged in"}
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTE }}>
          {mode === "signup"
            ? "Your account is ready. You can now log in anytime."
            : "Welcome back!"}
        </p>
        <button onClick={() => navigate(isDriver ? "driver" : "home")} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>
          Continue
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div style={{ color: TEXT }}>
        <Header title="Reset password" onBack={() => { setMode("login"); setResetSent(false); setError(""); }} />
        <div className="px-5">
          {!resetSent ? (
            <>
              <p className="text-sm mb-4" style={{ color: MUTE }}>Enter your account email and we'll send you a link to reset your password.</p>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <Mail size={14} color={GOLD} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
              {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
              <button onClick={handleForgotPassword} disabled={loading || !email} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: (loading || !email) ? BORDER : GOLD, color: (loading || !email) ? "#5C736D" : BG }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle2 size={44} color={GREEN} />
              <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
              <p className="mt-1 text-sm" style={{ color: MUTE }}>We sent a password reset link to {email}. Follow it to set a new password.</p>
              <button onClick={() => { setMode("login"); setResetSent(false); }} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back to login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title={isDriver ? "Driver account" : "Passenger account"} onBack={goBack} />
      <div className="px-5">
        <div className="flex rounded-full p-1 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <button onClick={() => setMode("login")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: mode === "login" ? GOLD : "transparent", color: mode === "login" ? BG : MUTE }}>Log in</button>
          <button onClick={() => setMode("signup")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: mode === "signup" ? GOLD : "transparent", color: mode === "signup" ? BG : MUTE }}>Sign up</button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Mail size={14} color={GOLD} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Key size={14} color={GOLD} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          {mode === "login" && (
            <div className="flex items-center justify-between -mt-1.5">
              <button onClick={() => setRememberMe((r) => !r)} className="flex items-center gap-2 text-[12px]" style={{ color: MUTE }}>
                <span className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: rememberMe ? GOLD : "transparent", border: `1px solid ${rememberMe ? GOLD : BORDER}` }}>
                  {rememberMe && <Check size={11} color={BG} />}
                </span>
                Remember me
              </button>
              <button onClick={() => { setMode("forgot"); setError(""); }} className="text-[12px]" style={{ color: GOLD }}>Forgot password?</button>
            </div>
          )}
        </div>

        {mode === "signup" && (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <User size={14} color={GOLD} />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Phone size={14} color={GOLD} />
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            {isDriver && (
              <>
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <User size={14} color={GOLD} />
                  <input value={iqama} onChange={(e) => setIqama(e.target.value)} placeholder="Iqama number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
                </div>
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <Car size={14} color={GOLD} />
                  <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
                </div>
                <div className="rounded-xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <select value={cityType} onChange={(e) => setCityType(e.target.value)} className="bg-transparent outline-none text-sm w-full py-2.5" style={{ color: TEXT }}>
                    <option value="inside_city" style={{ background: CARD }}>Inside-city driver</option>
                    <option value="intercity" style={{ background: CARD }}>Outside-city driver</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}

        <button
          onClick={mode === "signup" ? handleSignup : handleLogin}
          disabled={loading || !email || !password}
          className="w-full rounded-full py-3 text-sm font-semibold"
          style={{ background: (loading || !email || !password) ? BORDER : GOLD, color: (loading || !email || !password) ? "#5C736D" : BG }}
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </div>
    </div>
  );
}

/* ---------- DRIVER PROFILE ---------- */
function DriverProfile({ goBack, navigate, currentDriver, onLogout }) {
  const profile = currentDriver?.profile;
  const statusColor = profile?.status === "blocked" ? "#C0755B" : profile?.status === "warned" ? GOLD : GREEN;
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    async function loadRating() {
      if (!profile?.id) return;
      const { data } = await supabase.from("ratings").select("rating").eq("rating_type", "driver").eq("target_id", String(profile.id)).eq("status", "visible");
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        setAvgRating(avg);
        setRatingCount(data.length);
      }
    }
    loadRating();
  }, [profile?.id]);

  if (!profile) {
    return (
      <div style={{ color: TEXT }}>
        <Header title="My profile" onBack={goBack} />
        <div className="px-5 flex flex-col items-center text-center py-12">
          <User size={32} color={FAINT} />
          <p className="text-sm font-semibold mt-3">No profile loaded</p>
          <p className="text-xs mt-1" style={{ color: FAINT }}>Log in with your mobile number to see your driver profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="My profile" onBack={goBack} />
      <div className="px-5 flex flex-col items-center text-center mb-5">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: BORDER, color: GOLD }}>
          {profile.full_name?.charAt(0) || "D"}
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <h2 className="text-base font-semibold">{profile.full_name}</h2>
          {profile.verified && <CheckCircle2 size={15} color={GREEN} />}
        </div>
        {profile.verified ? (
          <p className="text-[11px] mt-1" style={{ color: GREEN }}>Verified driver</p>
        ) : (
          <p className="text-[11px] mt-1" style={{ color: GOLD }}>Verification pending</p>
        )}
        <span className="mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: `${statusColor}22`, color: statusColor }}>
          {profile.status || "active"} · {profile.warning_count || 0}/5 warnings
        </span>
        {avgRating !== null && (
          <span className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(217,166,83,0.14)", color: GOLD }}>
            <Star size={11} fill={GOLD} color={GOLD} /> {avgRating.toFixed(1)} ({ratingCount} rating{ratingCount !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      <div className="px-5 mb-5">
        <div className="rounded-2xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Phone size={14} color={FAINT} /><span className="text-sm">{profile.mobile_number}</span>
          </div>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <User size={14} color={FAINT} /><span className="text-sm">Iqama: {profile.iqama_number}</span>
          </div>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Car size={14} color={FAINT} /><span className="text-sm">{profile.vehicle_number}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <MapPin size={14} color={FAINT} /><span className="text-sm">{profile.city_type === "intercity" ? "Outside-city driver" : "Inside-city driver"}</span>
          </div>
        </div>
      </div>

      {profile.status === "blocked" && (
        <div className="px-5 mb-5">
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(192,117,91,0.12)", border: `1px solid rgba(192,117,91,0.35)` }}>
            <p className="text-xs font-semibold" style={{ color: "#C0755B" }}>Your account is blocked</p>
            <p className="text-[11px] mt-1" style={{ color: MUTE }}>Contact SayyaraDrive support to resolve this.</p>
          </div>
        </div>
      )}

      <div className="px-5 mb-5 flex flex-col gap-2">
        <button onClick={() => navigate("driver_edit_profile")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><User size={15} color={GOLD} /> Edit profile</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("driver_trips")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Route size={15} color={GOLD} /> Trip history & earnings</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("driver_documents")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Package size={15} color={GOLD} /> Documents</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("notifications")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Bell size={15} color={GOLD} /> Notifications</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("driver_messages")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><MessageCircle size={15} color={GOLD} /> Messages</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <button onClick={() => navigate("push_settings")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Zap size={15} color={GOLD} /> Push notification settings</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
      </div>

      <div className="px-5">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#C0755B" }}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );
}

/* ---------- DRIVER EDIT PROFILE ---------- */
function DriverEditProfile({ goBack, currentDriver, setCurrentDriver }) {
  const profile = currentDriver?.profile;
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [mobile, setMobile] = useState(profile?.mobile_number || "");
  const [iqama, setIqama] = useState(profile?.iqama_number || "");
  const [vehicleNumber, setVehicleNumber] = useState(profile?.vehicle_number || "");
  const [cityType, setCityType] = useState(profile?.city_type || "inside_city");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!profile) {
    return (
      <div style={{ color: TEXT }}>
        <Header title="Edit profile" onBack={goBack} />
        <div className="px-5 flex flex-col items-center text-center py-12">
          <User size={32} color={FAINT} />
          <p className="text-sm font-semibold mt-3">No profile loaded</p>
        </div>
      </div>
    );
  }

  async function save() {
    if (!fullName.trim() || !mobile.trim() || !iqama.trim() || !vehicleNumber.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSaving(true);
    setError("");
    const { data, error: updErr } = await supabase
      .from("drivers")
      .update({
        full_name: fullName.trim(),
        mobile_number: mobile.trim(),
        iqama_number: iqama.trim(),
        vehicle_number: vehicleNumber.trim(),
        city_type: cityType,
      })
      .eq("id", profile.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (updErr) {
      setError(updErr.message.includes("duplicate") ? "That mobile number or Iqama is already in use." : "Could not save changes. Please try again.");
      return;
    }
    setCurrentDriver({ ...currentDriver, profile: data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Edit profile" onBack={goBack} />
      <div className="px-5 flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <User size={14} color={GOLD} />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
        </div>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <Phone size={14} color={GOLD} />
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
        </div>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <User size={14} color={GOLD} />
          <input value={iqama} onChange={(e) => setIqama(e.target.value)} placeholder="Iqama number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
        </div>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <Car size={14} color={GOLD} />
          <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
        </div>
        <div className="rounded-xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <select value={cityType} onChange={(e) => setCityType(e.target.value)} className="bg-transparent outline-none text-sm w-full py-2.5" style={{ color: TEXT }}>
            <option value="inside_city" style={{ background: CARD }}>Inside-city driver</option>
            <option value="intercity" style={{ background: CARD }}>Outside-city driver</option>
          </select>
        </div>
      </div>
      {error && <p className="px-5 text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
      {saved && <p className="px-5 text-[12px] mb-3" style={{ color: GREEN }}>Saved!</p>}
      <div className="px-5">
        <button onClick={save} disabled={saving} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: saving ? BORDER : GOLD, color: saving ? "#5C736D" : BG }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------- NOTIFICATIONS ---------- */
function NotificationsScreen({ goBack, currentDriver, currentAdmin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (currentAdmin) {
      query = query.eq("recipient_type", "admin");
    } else if (currentDriver?.profile) {
      query = query.or(`recipient_phone.eq.${currentDriver.profile.mobile_number},recipient_type.eq.all`);
    } else {
      query = query.eq("recipient_type", "all");
    }
    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { loadNotifications(); }, []);

  async function markRead(n) {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      loadNotifications();
    }
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Notifications" onBack={goBack} />
      <div className="px-5">
        {loading && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>Loading…</p>}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <Bell size={32} color={FAINT} />
            <p className="text-sm font-semibold mt-3">No notifications yet</p>
            <p className="text-xs mt-1" style={{ color: FAINT }}>Updates about your account and activity will show up here.</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => markRead(n)} className="w-full text-left rounded-xl px-4 py-3" style={{ background: n.read ? CARD : "rgba(217,166,83,0.08)", border: `1px solid ${n.read ? BORDER : "rgba(217,166,83,0.3)"}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: GOLD }} />}
              </div>
              {n.body && <p className="text-[11px] mt-1" style={{ color: FAINT }}>{n.body}</p>}
              <p className="text-[10px] mt-1.5" style={{ color: FAINT }}>{new Date(n.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- CONTACT / MESSAGE MODAL (reusable) ---------- */
/* ---------- RIDE CHAT (real in-app passenger <-> driver/support messaging) ---------- */
/* ---------- RATING PROMPT (reusable) ---------- */
function RatingPrompt({ ratingType, targetId, targetLabel, bookingRef, prompt, reviewerName }) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!stars) return;
    setSubmitting(true);
    await supabase.from("ratings").insert({
      rating_type: ratingType,
      target_id: targetId ? String(targetId) : null,
      target_label: targetLabel,
      booking_ref: bookingRef || null,
      rating: stars,
      review: review.trim() || null,
      reviewer_name: reviewerName || null,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl px-4 py-4 mt-4 flex items-center gap-3" style={{ background: "rgba(91,143,212,0.1)", border: `1px solid rgba(91,143,212,0.3)` }}>
        <CheckCircle2 size={18} color={GREEN} />
        <p className="text-xs" style={{ color: MUTE }}>Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl px-4 py-4 mt-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <p className="text-sm font-semibold mb-3">{prompt || `Rate ${targetLabel || "this"}`}</p>
      <div className="flex items-center gap-1.5 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)}>
            <Star size={26} color={n <= stars ? GOLD : BORDER} fill={n <= stars ? GOLD : "none"} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Add a comment (optional)" rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
          <button onClick={submit} disabled={submitting} className="w-full rounded-full py-2.5 text-sm font-semibold" style={{ background: GOLD, color: BG }}>
            {submitting ? "Submitting…" : "Submit rating"}
          </button>
        </>
      )}
    </div>
  );
}

function RideChat({ bookingRef, contextLabel, onClose, senderRole, senderName }) {
  const role = senderRole || "passenger";
  const name = senderName || (role === "driver" ? "Driver" : "Passenger");
  const otherRole = role === "passenger" ? "driver" : "passenger";
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

  /* ---- Voice call (WebRTC, signaled over Supabase Realtime broadcast) ---- */
  const [callState, setCallState] = useState("idle"); // idle | calling | ringing | connected
  const [callError, setCallError] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const pcRef = useRef(null);
  const callChannelRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:openrelay.metered.ca:80" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ];

  function getCallChannel() {
    if (!callChannelRef.current) {
      callChannelRef.current = supabase.channel(`call:${bookingRef}`, { config: { broadcast: { self: false } } });
      callChannelRef.current
        .on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload))
        .subscribe();
    }
    return callChannelRef.current;
  }

  useEffect(() => {
    getCallChannel();
    return () => {
      endCall(false);
      if (callChannelRef.current) { supabase.removeChannel(callChannelRef.current); callChannelRef.current = null; }
    };
  }, []);

  function sendSignal(data) {
    getCallChannel().send({ type: "broadcast", event: "signal", payload: { ...data, from: role } });
  }

  function newPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal({ kind: "ice", candidate: e.candidate }); };
    pc.ontrack = (e) => { if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0]; };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        setCallError("");
        callTimerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      }
      if (["failed", "disconnected", "closed"].includes(pc.connectionState) && callState !== "idle") {
        if (pc.connectionState === "failed") setCallError("Call connection failed — this can happen on some mobile networks.");
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function startCall() {
    setCallError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ kind: "offer", sdp: offer, callerName: name });
      setCallState("calling");
      ringTimeoutRef.current = setTimeout(() => { if (callState !== "connected") { setCallError("No answer."); endCall(true); } }, 30000);
    } catch (e) {
      setCallError("Couldn't access your microphone. Check browser permissions.");
    }
  }

  async function acceptCall() {
    const offerPayload = pendingOfferRef.current;
    if (!offerPayload) return;
    setCallError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offerPayload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ kind: "answer", sdp: answer });
      setCallState("connected");
    } catch (e) {
      setCallError("Couldn't access your microphone. Check browser permissions.");
      declineCall();
    }
  }

  function declineCall() {
    sendSignal({ kind: "hangup" });
    pendingOfferRef.current = null;
    setCallState("idle");
  }

  function endCall(notify = true) {
    if (notify && callState !== "idle") sendSignal({ kind: "hangup" });
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    pendingOfferRef.current = null;
    setCallSeconds(0);
    setMuted(false);
    setCallState("idle");
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  }

  function handleSignal(payload) {
    if (payload.from === role) return;
    if (payload.kind === "offer") {
      if (callState !== "idle") { getCallChannel().send({ type: "broadcast", event: "signal", payload: { kind: "hangup", from: role } }); return; }
      pendingOfferRef.current = payload;
      setCallState("ringing");
    } else if (payload.kind === "answer") {
      if (pcRef.current) pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    } else if (payload.kind === "ice") {
      if (pcRef.current) pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
    } else if (payload.kind === "hangup") {
      endCall(false);
    }
  }

  function formatCallTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  async function load() {
    const { data } = await supabase.from("messages").select("*").eq("booking_ref", bookingRef).order("created_at", { ascending: true });
    setItems(data || []);
    // mark incoming messages as read
    const unread = (data || []).filter((m) => m.sender_role !== role && !m.read);
    if (unread.length > 0) {
      await supabase.from("messages").update({ read: true }).in("id", unread.map((m) => m.id));
    }
  }

  async function pollTyping() {
    const { data } = await supabase.from("chat_typing").select("*").eq("booking_ref", bookingRef).eq("role", otherRole).maybeSingle();
    if (data) {
      const secondsAgo = (Date.now() - new Date(data.updated_at).getTime()) / 1000;
      setOtherTyping(secondsAgo < 4);
    } else {
      setOtherTyping(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => { if (!document.hidden) { load(); pollTyping(); } }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items, otherTyping]);

  function notifyTyping() {
    supabase.from("chat_typing").upsert({ booking_ref: bookingRef, role, updated_at: new Date().toISOString() }).then(() => {});
  }

  function onTextChange(v) {
    setText(v);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    notifyTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  }

  async function notifyOtherParty(preview) {
    if (role !== "passenger") return; // only notify the driver for now (drivers are the only ones with push subscriptions)
    const { data: ride } = await supabase.from("rides").select("driver_id").eq("booking_ref", bookingRef).maybeSingle();
    if (!ride?.driver_id) return;
    const { data: driver } = await supabase.from("drivers").select("mobile_number").eq("id", ride.driver_id).maybeSingle();
    if (driver?.mobile_number) {
      await supabase.from("notifications").insert({ recipient_phone: driver.mobile_number, recipient_type: "driver", title: "New message from passenger", body: preview });
      sendPush(driver.mobile_number, "New message from passenger", preview);
    }
  }

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({
      context: "ride",
      reference_title: contextLabel,
      booking_ref: bookingRef,
      sender_role: role,
      sender_name: name,
      sender_phone: "N/A",
      body: text.trim(),
    });
    notifyOtherParty(text.trim().slice(0, 80));
    setText("");
    setSending(false);
    load();
  }

  async function startRecording() {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadVoice(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setRecordError("Couldn't access your microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
  }

  async function uploadVoice(blob) {
    setSending(true);
    try {
      const fileName = `${bookingRef}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("voice-messages").upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("voice-messages").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "ride", reference_title: contextLabel, booking_ref: bookingRef,
        sender_role: role, sender_name: name, sender_phone: "N/A",
        body: "🎤 Voice message", audio_url: publicData.publicUrl,
      });
      notifyOtherParty("🎤 Sent a voice message");
      load();
    } catch (e) {
      setRecordError("Couldn't send voice message. Please try again.");
    }
    setSending(false);
  }

  async function uploadImage(file) {
    if (!file) return;
    setSending(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${bookingRef}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "ride", reference_title: contextLabel, booking_ref: bookingRef,
        sender_role: role, sender_name: name, sender_phone: "N/A",
        body: "📷 Photo", image_url: publicData.publicUrl,
      });
      notifyOtherParty("📷 Sent a photo");
      load();
    } catch (e) {
      setRecordError("Couldn't send image. Please try again.");
    }
    setSending(false);
  }

  function shareLocation() {
    setSending(true);
    detectLocation({
      onSuccess: async ({ lat, lng, label }) => {
        await supabase.from("messages").insert({
          context: "ride", reference_title: contextLabel, booking_ref: bookingRef,
          sender_role: role, sender_name: name, sender_phone: "N/A",
          body: `📍 ${label}`, location_lat: lat, location_lng: lng,
        });
        notifyOtherParty("📍 Shared their location");
        setSending(false);
        load();
      },
      onError: () => { setRecordError("Couldn't get your location."); setSending(false); },
    });
  }

  async function translate(m) {
    if (translations[m.id]) { setTranslations((t) => { const n = { ...t }; delete n[m.id]; return n; }); return; }
    setTranslating(m.id);
    try {
      const targetLang = /[\u0600-\u06FF]/.test(m.body) ? "en" : "ar";
      const res = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: m.body, source: "auto", target: targetLang, format: "text" }),
      });
      const data = await res.json();
      setTranslations((t) => ({ ...t, [m.id]: data.translatedText || "Translation unavailable right now." }));
    } catch (e) {
      setTranslations((t) => ({ ...t, [m.id]: "Translation unavailable right now." }));
    }
    setTranslating(null);
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
      {callState !== "idle" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[60]" style={{ background: BG }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(217,166,83,0.14)" }}>
            <PhoneCall size={36} color={GOLD} className={callState !== "connected" ? "animate-pulse" : ""} />
          </div>
          <p className="text-lg font-semibold" style={{ color: TEXT }}>{otherRole === "driver" ? "Driver" : "Passenger"}</p>
          <p className="text-sm mt-2" style={{ color: MUTE }}>
            {callState === "calling" && "Calling…"}
            {callState === "ringing" && "Incoming call…"}
            {callState === "connected" && formatCallTime(callSeconds)}
          </p>
          {callError && <p className="text-xs mt-3 text-center px-8" style={{ color: "#C0755B" }}>{callError}</p>}
          <div className="flex items-center gap-6 mt-10">
            {callState === "ringing" ? (
              <>
                <button onClick={declineCall} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#C0755B" }}><PhoneOff size={22} color="#fff" /></button>
                <button onClick={acceptCall} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: GREEN }}><PhoneCall size={22} color="#fff" /></button>
              </>
            ) : (
              <>
                {callState === "connected" && (
                  <button onClick={toggleMute} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: muted ? GOLD : BORDER }}>
                    <Mic size={20} color={muted ? BG : TEXT} />
                  </button>
                )}
                <button onClick={() => endCall(true)} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#C0755B" }}><PhoneOff size={22} color="#fff" /></button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="w-full max-w-md rounded-t-3xl flex flex-col" style={{ background: CARD, border: `1px solid ${BORDER}`, height: "75vh" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-sm font-semibold">Chat about your trip</p>
            <p className="text-[11px]" style={{ color: FAINT }}>{otherTyping ? `${otherRole === "driver" ? "Driver" : "Passenger"} is typing…` : contextLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={startCall} aria-label="Start voice call"><PhoneCall size={18} color={GREEN} /></button>
            <button onClick={onClose} aria-label="Close chat"><X size={18} color={MUTE} /></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {items.length === 0 && (
            <p className="text-xs text-center mt-6" style={{ color: FAINT }}>Send a message and the {otherRole} will reply here.</p>
          )}
          {items.map((m) => {
            const mine = m.sender_role === role;
            return (
              <div key={m.id} className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${mine ? "self-end" : "self-start"}`} style={{ background: mine ? GOLD : BG, border: mine ? "none" : `1px solid ${BORDER}` }}>
                {m.audio_url ? (
                  <audio controls src={m.audio_url} style={{ height: 32, width: 180 }} />
                ) : m.image_url ? (
                  <img src={m.image_url} alt="Shared" loading="lazy" className="rounded-lg" style={{ maxWidth: 200, maxHeight: 200 }} />
                ) : m.location_lat ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${m.location_lat},${m.location_lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline" style={{ color: mine ? BG : GREEN }}>
                    <MapPin size={12} /> {m.body}
                  </a>
                ) : (
                  <>
                    <p className="text-xs" style={{ color: mine ? BG : TEXT }}>{m.body}</p>
                    {translations[m.id] && <p className="text-xs mt-1.5 pt-1.5" style={{ color: mine ? "rgba(15,33,30,0.75)" : MUTE, borderTop: `1px solid ${mine ? "rgba(15,33,30,0.2)" : BORDER}` }}>{translations[m.id]}</p>}
                  </>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-[9px]" style={{ color: mine ? "rgba(15,33,30,0.6)" : FAINT }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  {mine && m.read && <span className="text-[9px]" style={{ color: "rgba(15,33,30,0.6)" }}>· Seen</span>}
                  {!m.audio_url && !m.image_url && !m.location_lat && (
                    <button onClick={() => translate(m)} className="text-[9px] underline" style={{ color: mine ? "rgba(15,33,30,0.7)" : FAINT }}>
                      {translating === m.id ? "…" : translations[m.id] ? "Hide" : "Translate"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {recordError && <p className="px-5 text-[11px] mb-1" style={{ color: "#C0755B" }}>{recordError}</p>}
        <div className="flex items-center gap-1.5 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <input value={text} onChange={(e) => onTextChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={recording ? "Recording…" : "Type a message…"} disabled={recording} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none min-w-0" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
          <label className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ background: "rgba(217,166,83,0.14)" }}>
            <ImageIcon size={14} color={GOLD} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files[0])} disabled={sending} />
          </label>
          <button onClick={shareLocation} disabled={sending} aria-label="Share location" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.14)" }}>
            <MapPin size={14} color={GOLD} />
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={sending}
            aria-label={recording ? "Stop recording" : "Record voice message"}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: recording ? "#C0755B" : "rgba(91,143,212,0.16)" }}
          >
            <Mic size={14} color={recording ? "#fff" : GREEN} className={recording ? "animate-pulse" : ""} />
          </button>
          <button onClick={send} disabled={sending || !text.trim() || recording} aria-label="Send message" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={14} color={BG} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- FRIENDS & FAMILY ---------- */
function FriendsListScreen({ goBack, navigate, setActiveFriendChat }) {
  const [myPhone, setMyPhone] = useState("");
  const [myName, setMyName] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [error, setError] = useState("");
  const [showEditMe, setShowEditMe] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem("sayyara_chat_phone") || "";
    const storedName = localStorage.getItem("sayyara_chat_name") || "";
    if (!storedPhone || !storedName) {
      setNeedsSetup(true);
      setLoading(false);
    } else {
      setMyPhone(storedPhone);
      setMyName(storedName);
      loadFriends(storedPhone);
    }
  }, []);

  async function loadFriends(phone) {
    setLoading(true);
    const { data } = await supabase.from("friends").select("*").eq("owner_phone", phone).order("friend_name", { ascending: true });
    setFriends(data || []);
    setLoading(false);
  }

  function saveMyIdentity() {
    if (!myName.trim() || !myPhone.trim()) { setError("Enter your name and mobile number."); return; }
    localStorage.setItem("sayyara_chat_name", myName.trim());
    localStorage.setItem("sayyara_chat_phone", myPhone.trim());
    setNeedsSetup(false);
    setShowEditMe(false);
    setError("");
    loadFriends(myPhone.trim());
  }

  async function addFriend() {
    if (!addName.trim() || !addPhone.trim()) { setError("Enter a name and mobile number."); return; }
    if (addPhone.trim() === myPhone) { setError("That's your own number."); return; }
    setError("");
    const { error: insErr } = await supabase.from("friends").upsert({
      owner_phone: myPhone, owner_name: myName, friend_phone: addPhone.trim(), friend_name: addName.trim(),
    }, { onConflict: "owner_phone,friend_phone" });
    if (insErr) { setError("Couldn't add contact. Try again."); return; }
    setAddName(""); setAddPhone(""); setShowAdd(false);
    loadFriends(myPhone);
  }

  async function removeFriend(id) {
    await supabase.from("friends").delete().eq("id", id);
    loadFriends(myPhone);
  }

  function openChat(friend) {
    setActiveFriendChat({ phone: friend.friend_phone, name: friend.friend_name, myPhone, myName });
    navigate("friend_chat");
  }

  if (needsSetup) {
    return (
      <div style={{ color: TEXT }}>
        <Header title="Friends & Family" onBack={goBack} />
        <div className="px-5">
          <p className="text-sm mb-4" style={{ color: MUTE }}>Set up your name and mobile number once so friends recognize your messages.</p>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <User size={14} color={GOLD} />
              <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Your name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Phone size={14} color={GOLD} />
              <input value={myPhone} onChange={(e) => setMyPhone(e.target.value)} placeholder="Your mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
          </div>
          {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
          <button onClick={saveMyIdentity} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Friends & Family" onBack={goBack} />
      <div className="px-5 mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: FAINT }}>Chatting as <span style={{ color: TEXT, fontWeight: 600 }}>{myName}</span></p>
        <button onClick={() => setShowEditMe(true)} className="text-[11px] underline" style={{ color: GOLD }}>Edit</button>
      </div>
      <div className="px-5 mb-4">
        <button onClick={() => navigate("support_chat")} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-2" style={{ background: "rgba(217,166,83,0.1)", border: `1px solid ${GOLD}` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><HelpCircle size={18} color={BG} /></div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold">SayyaraDrive Support</p>
            <p className="text-[11px]" style={{ color: FAINT }}>We usually reply within a few hours</p>
          </div>
          <ChevronRight size={14} color={GOLD} />
        </button>
        <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>
          <Plus size={15} /> Add friend or family
        </button>
      </div>
      {loading && <div className="px-5 flex flex-col gap-2">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}
      {!loading && friends.length === 0 && (
        <EmptyState icon={Users} title="No contacts yet" subtitle="Add a friend or family member's mobile number to start chatting." />
      )}
      <div className="px-5 flex flex-col gap-2">
        {friends.map((f) => (
          <div key={f.id} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <button onClick={() => openChat(f)} className="flex items-center gap-3 flex-1 text-left min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: BORDER, color: GOLD }}>{f.friend_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{f.friend_name}</p>
                <p className="text-[11px]" style={{ color: FAINT }}>{f.friend_phone}</p>
              </div>
              <ChevronRight size={14} color="#5C736D" />
            </button>
            <button onClick={() => removeFriend(f.id)} aria-label="Remove contact"><X size={14} color={FAINT} /></button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add contact</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} color={MUTE} /></button>
            </div>
            {typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window && (
              <button
                onClick={async () => {
                  try {
                    const picked = await navigator.contacts.select(["name", "tel"], { multiple: false });
                    if (picked && picked[0]) {
                      if (picked[0].name?.[0]) setAddName(picked[0].name[0]);
                      if (picked[0].tel?.[0]) setAddPhone(picked[0].tel[0]);
                    }
                  } catch (e) { /* user cancelled the picker */ }
                }}
                className="w-full mb-3 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
                style={{ background: "rgba(217,166,83,0.14)", border: `1px solid ${GOLD}`, color: GOLD }}
              >
                <Users size={15} /> Choose from phone contacts
              </button>
            )}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <User size={14} color={GOLD} />
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <Phone size={14} color={GOLD} />
                <input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
            </div>
            {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
            <button onClick={addFriend} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Add contact</button>
          </div>
        </div>
      )}

      {showEditMe && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowEditMe(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Your info</h2>
              <button onClick={() => setShowEditMe(false)}><X size={18} color={MUTE} /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <User size={14} color={GOLD} />
                <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Your name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <Phone size={14} color={GOLD} />
                <input value={myPhone} onChange={(e) => setMyPhone(e.target.value)} placeholder="Your mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
            </div>
            {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
            <button onClick={saveMyIdentity} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- SUPPORT CHAT (built-in, replaces WhatsApp as primary contact channel) ---------- */
function SupportChatScreen({ goBack, currentDriver }) {
  const identity = resolveIdentity(currentDriver);
  const me = { phone: identity.id, name: identity.name };
  const threadId = `support:${me.phone}`;
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollRef = useRef(null);

  async function load() {
    const { data } = await supabase.from("messages").select("*").eq("context", "support").eq("booking_ref", threadId).order("created_at", { ascending: true });
    setItems(data || []);
    const unread = (data || []).filter((m) => m.sender_role === "support" && !m.read);
    if (unread.length > 0) await supabase.from("messages").update({ read: true }).in("id", unread.map((m) => m.id));
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => { if (!document.hidden) load(); }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({
      context: "support", reference_title: me.name, booking_ref: threadId,
      sender_role: "user", sender_name: me.name, sender_phone: me.phone, recipient_phone: "support",
      body: text.trim(),
    });
    setText("");
    setSending(false);
    load();
  }

  async function startRecording() {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadVoice(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setRecordError("Couldn't access your microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
  }

  async function uploadVoice(blob) {
    setSending(true);
    try {
      const fileName = `${threadId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("voice-messages").upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("voice-messages").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "support", reference_title: me.name, booking_ref: threadId,
        sender_role: "user", sender_name: me.name, sender_phone: me.phone, recipient_phone: "support",
        body: "🎤 Voice message", audio_url: publicData.publicUrl,
      });
      load();
    } catch (e) {
      setRecordError("Couldn't send voice message. Please try again.");
    }
    setSending(false);
  }

  async function uploadImage(file) {
    if (!file) return;
    setSending(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${threadId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "support", reference_title: me.name, booking_ref: threadId,
        sender_role: "user", sender_name: me.name, sender_phone: me.phone, recipient_phone: "support",
        body: "📷 Photo", image_url: publicData.publicUrl,
      });
      load();
    } catch (e) {
      setRecordError("Couldn't send image. Please try again.");
    }
    setSending(false);
  }

  return (
    <div style={{ color: TEXT }} className="flex flex-col">
      <Header title="SayyaraDrive Support" onBack={goBack} />
      <p className="px-5 -mt-3 mb-2 text-[11px]" style={{ color: FAINT }}>We usually reply within a few hours</p>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2" style={{ minHeight: "55vh", maxHeight: "65vh" }}>
        {items.length === 0 && (
          <p className="text-xs text-center mt-6" style={{ color: FAINT }}>Send a message and our team will get back to you here.</p>
        )}
        {items.map((m) => {
          const mine = m.sender_role === "user";
          return (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${mine ? "self-end" : "self-start"}`} style={{ background: mine ? GOLD : CARD, border: mine ? "none" : `1px solid ${BORDER}` }}>
              {m.audio_url ? (
                <audio controls src={m.audio_url} style={{ height: 32, width: 180 }} />
              ) : m.image_url ? (
                <img src={m.image_url} alt="Shared" loading="lazy" className="rounded-lg" style={{ maxWidth: 200, maxHeight: 200 }} />
              ) : (
                <p className="text-xs" style={{ color: mine ? BG : TEXT }}>{m.body}</p>
              )}
              <p className="text-[9px] mt-1" style={{ color: mine ? "rgba(15,33,30,0.6)" : FAINT }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          );
        })}
      </div>
      {recordError && <p className="px-5 text-[11px] mb-1" style={{ color: "#C0755B" }}>{recordError}</p>}
      <div className="flex items-center gap-1.5 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={recording ? "Recording…" : "Type a message…"} disabled={recording} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none min-w-0" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
        <label className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ background: "rgba(217,166,83,0.14)" }}>
          <ImageIcon size={14} color={GOLD} />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files[0])} disabled={sending} />
        </label>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={sending}
          aria-label={recording ? "Stop recording" : "Record voice message"}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: recording ? "#C0755B" : "rgba(91,143,212,0.16)" }}
        >
          <Mic size={14} color={recording ? "#fff" : GREEN} className={recording ? "animate-pulse" : ""} />
        </button>
        <button onClick={send} disabled={sending || !text.trim() || recording} aria-label="Send message" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={14} color={BG} /></button>
      </div>
    </div>
  );
}

function FriendChatScreen({ goBack, activeFriendChat }) {
  const friend = activeFriendChat;
  const me = { phone: friend?.myPhone, name: friend?.myName };
  const threadId = friend ? `friend:${[me.phone, friend.phone].sort().join("_")}` : null;
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollRef = useRef(null);

  /* ---- Voice call (WebRTC, signaled over Supabase Realtime broadcast) ---- */
  const [callState, setCallState] = useState("idle"); // idle | calling | ringing | connected
  const [callError, setCallError] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const pcRef = useRef(null);
  const callChannelRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:openrelay.metered.ca:80" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ];

  function getCallChannel() {
    if (!callChannelRef.current && threadId) {
      callChannelRef.current = supabase.channel(`call:${threadId}`, { config: { broadcast: { self: false } } });
      callChannelRef.current
        .on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload))
        .subscribe();
    }
    return callChannelRef.current;
  }

  useEffect(() => {
    if (!threadId) return;
    getCallChannel();
    return () => {
      endCall(false);
      if (callChannelRef.current) { supabase.removeChannel(callChannelRef.current); callChannelRef.current = null; }
    };
  }, [threadId]);

  function sendSignal(data) {
    const ch = getCallChannel();
    if (ch) ch.send({ type: "broadcast", event: "signal", payload: { ...data, from: me.phone } });
  }

  function newPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal({ kind: "ice", candidate: e.candidate }); };
    pc.ontrack = (e) => { if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0]; };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        setCallError("");
        callTimerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      }
      if (["failed", "disconnected", "closed"].includes(pc.connectionState) && callState !== "idle") {
        if (pc.connectionState === "failed") setCallError("Call connection failed — this can happen on some mobile networks.");
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function startCall() {
    setCallError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ kind: "offer", sdp: offer, callerName: me.name });
      setCallState("calling");
      ringTimeoutRef.current = setTimeout(() => { if (callState !== "connected") { setCallError("No answer."); endCall(true); } }, 30000);
    } catch (e) {
      setCallError("Couldn't access your microphone. Check browser permissions.");
    }
  }

  async function acceptCall() {
    const offerPayload = pendingOfferRef.current;
    if (!offerPayload) return;
    setCallError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offerPayload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ kind: "answer", sdp: answer });
      setCallState("connected");
    } catch (e) {
      setCallError("Couldn't access your microphone. Check browser permissions.");
      declineCall();
    }
  }

  function declineCall() {
    sendSignal({ kind: "hangup" });
    pendingOfferRef.current = null;
    setCallState("idle");
  }

  function endCall(notify = true) {
    if (notify && callState !== "idle") sendSignal({ kind: "hangup" });
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    pendingOfferRef.current = null;
    setCallSeconds(0);
    setMuted(false);
    setCallState("idle");
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  }

  function handleSignal(payload) {
    if (payload.from === me.phone) return;
    if (payload.kind === "offer") {
      if (callState !== "idle") { const ch = getCallChannel(); if (ch) ch.send({ type: "broadcast", event: "signal", payload: { kind: "hangup", from: me.phone } }); return; }
      pendingOfferRef.current = payload;
      setCallState("ringing");
    } else if (payload.kind === "answer") {
      if (pcRef.current) pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    } else if (payload.kind === "ice") {
      if (pcRef.current) pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
    } else if (payload.kind === "hangup") {
      endCall(false);
    }
  }

  function formatCallTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  async function load() {
    if (!threadId) return;
    const { data } = await supabase.from("messages").select("*").eq("context", "friend").eq("booking_ref", threadId).order("created_at", { ascending: true });
    setItems(data || []);
    const unread = (data || []).filter((m) => m.sender_phone !== me.phone && !m.read);
    if (unread.length > 0) await supabase.from("messages").update({ read: true }).in("id", unread.map((m) => m.id));
  }

  async function pollTyping() {
    if (!threadId) return;
    const { data } = await supabase.from("chat_typing").select("*").eq("booking_ref", threadId).eq("role", friend.phone).maybeSingle();
    if (data) {
      const secondsAgo = (Date.now() - new Date(data.updated_at).getTime()) / 1000;
      setOtherTyping(secondsAgo < 4);
    } else setOtherTyping(false);
  }

  useEffect(() => {
    if (!threadId) return;
    load();
    const interval = setInterval(() => { if (!document.hidden) { load(); pollTyping(); } }, 3000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items, otherTyping]);

  function notifyTyping() {
    if (!threadId) return;
    supabase.from("chat_typing").upsert({ booking_ref: threadId, role: me.phone, updated_at: new Date().toISOString() }).then(() => {});
  }

  async function send() {
    if (!text.trim() || !threadId) return;
    setSending(true);
    await supabase.from("messages").insert({
      context: "friend", reference_title: friend.name, booking_ref: threadId,
      sender_role: me.phone, sender_name: me.name, sender_phone: me.phone, recipient_phone: friend.phone,
      body: text.trim(),
    });
    setText("");
    setSending(false);
    load();
  }

  async function startRecording() {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadVoice(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setRecordError("Couldn't access your microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
  }

  async function uploadVoice(blob) {
    setSending(true);
    try {
      const fileName = `${threadId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("voice-messages").upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("voice-messages").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "friend", reference_title: friend.name, booking_ref: threadId,
        sender_role: me.phone, sender_name: me.name, sender_phone: me.phone, recipient_phone: friend.phone,
        body: "🎤 Voice message", audio_url: publicData.publicUrl,
      });
      load();
    } catch (e) {
      setRecordError("Couldn't send voice message. Please try again.");
    }
    setSending(false);
  }

  async function uploadImage(file) {
    if (!file || !threadId) return;
    setSending(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${threadId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        context: "friend", reference_title: friend.name, booking_ref: threadId,
        sender_role: me.phone, sender_name: me.name, sender_phone: me.phone, recipient_phone: friend.phone,
        body: "📷 Photo", image_url: publicData.publicUrl,
      });
      load();
    } catch (e) {
      setRecordError("Couldn't send image. Please try again.");
    }
    setSending(false);
  }

  function shareLocation() {
    setSending(true);
    detectLocation({
      onSuccess: async ({ lat, lng, label }) => {
        await supabase.from("messages").insert({
          context: "friend", reference_title: friend.name, booking_ref: threadId,
          sender_role: me.phone, sender_name: me.name, sender_phone: me.phone, recipient_phone: friend.phone,
          body: `📍 ${label}`, location_lat: lat, location_lng: lng,
        });
        setSending(false);
        load();
      },
      onError: () => { setRecordError("Couldn't get your location."); setSending(false); },
    });
  }

  if (!friend) {
    return (
      <div style={{ color: TEXT }}>
        <Header title="Chat" onBack={goBack} />
        <div className="px-5 flex flex-col items-center text-center py-12">
          <MessageCircle size={32} color={FAINT} />
          <p className="text-sm font-semibold mt-3">No chat selected</p>
          <p className="text-xs mt-1" style={{ color: FAINT }}>Go back and pick a contact from Friends & Family.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }} className="flex flex-col">
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
      {callState !== "idle" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[60]" style={{ background: BG }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(217,166,83,0.14)" }}>
            <PhoneCall size={36} color={GOLD} className={callState !== "connected" ? "animate-pulse" : ""} />
          </div>
          <p className="text-lg font-semibold" style={{ color: TEXT }}>{friend.name}</p>
          <p className="text-sm mt-2" style={{ color: MUTE }}>
            {callState === "calling" && "Calling…"}
            {callState === "ringing" && "Incoming call…"}
            {callState === "connected" && formatCallTime(callSeconds)}
          </p>
          {callError && <p className="text-xs mt-3 text-center px-8" style={{ color: "#C0755B" }}>{callError}</p>}
          <div className="flex items-center gap-6 mt-10">
            {callState === "ringing" ? (
              <>
                <button onClick={declineCall} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#C0755B" }}><PhoneOff size={22} color="#fff" /></button>
                <button onClick={acceptCall} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: GREEN }}><PhoneCall size={22} color="#fff" /></button>
              </>
            ) : (
              <>
                {callState === "connected" && (
                  <button onClick={toggleMute} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: muted ? GOLD : BORDER }}>
                    <Mic size={20} color={muted ? BG : TEXT} />
                  </button>
                )}
                <button onClick={() => endCall(true)} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#C0755B" }}><PhoneOff size={22} color="#fff" /></button>
              </>
            )}
          </div>
        </div>
      )}
      <Header title={friend.name} onBack={goBack} right={
        <button onClick={startCall} aria-label="Start voice call" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}>
          <PhoneCall size={16} color={GREEN} />
        </button>
      } />
      <p className="px-5 -mt-3 mb-2 text-[11px]" style={{ color: FAINT }}>{otherTyping ? "typing…" : friend.phone}</p>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2" style={{ minHeight: "55vh", maxHeight: "65vh" }}>
        {items.length === 0 && (
          <p className="text-xs text-center mt-6" style={{ color: FAINT }}>Send a message to {friend.name} to start chatting.</p>
        )}
        {items.map((m) => {
          const mine = m.sender_phone === me.phone;
          return (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${mine ? "self-end" : "self-start"}`} style={{ background: mine ? GOLD : CARD, border: mine ? "none" : `1px solid ${BORDER}` }}>
              {m.audio_url ? (
                <audio controls src={m.audio_url} style={{ height: 32, width: 180 }} />
              ) : m.image_url ? (
                <img src={m.image_url} alt="Shared" loading="lazy" className="rounded-lg" style={{ maxWidth: 200, maxHeight: 200 }} />
              ) : m.location_lat ? (
                <a href={`https://www.google.com/maps/search/?api=1&query=${m.location_lat},${m.location_lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline" style={{ color: mine ? BG : GREEN }}>
                  <MapPin size={12} /> {m.body}
                </a>
              ) : (
                <p className="text-xs" style={{ color: mine ? BG : TEXT }}>{m.body}</p>
              )}
              <p className="text-[9px] mt-1" style={{ color: mine ? "rgba(15,33,30,0.6)" : FAINT }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          );
        })}
      </div>
      {recordError && <p className="px-5 text-[11px] mb-1" style={{ color: "#C0755B" }}>{recordError}</p>}
      <div className="flex items-center gap-1.5 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <input value={text} onChange={(e) => { setText(e.target.value); notifyTyping(); }} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={recording ? "Recording…" : "Type a message…"} disabled={recording} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none min-w-0" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
        <label className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ background: "rgba(217,166,83,0.14)" }}>
          <ImageIcon size={14} color={GOLD} />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files[0])} disabled={sending} />
        </label>
        <button onClick={shareLocation} disabled={sending} aria-label="Share location" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.14)" }}>
          <MapPin size={14} color={GOLD} />
        </button>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={sending}
          aria-label={recording ? "Stop recording" : "Record voice message"}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: recording ? "#C0755B" : "rgba(91,143,212,0.16)" }}
        >
          <Mic size={14} color={recording ? "#fff" : GREEN} className={recording ? "animate-pulse" : ""} />
        </button>
        <button onClick={send} disabled={sending || !text.trim() || recording} aria-label="Send message" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={14} color={BG} /></button>
      </div>
    </div>
  );
}

/* ---------- REPORT MODAL (reusable) ---------- */
const REPORT_REASONS = ["Scam or fraud", "Fake or misleading", "Inappropriate content", "Already sold / unavailable", "Other"];
function ReportModal({ context, referenceId, referenceTitle, onClose }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!reason) return;
    setSending(true);
    await supabase.from("reports").insert({
      context, reference_id: referenceId ? String(referenceId) : null, reference_title: referenceTitle, reason,
    });
    setSending(false);
    setSent(true);
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold">Report this listing</h2>
              <button onClick={onClose}><X size={18} color={MUTE} /></button>
            </div>
            <p className="text-xs mb-4" style={{ color: FAINT }}>{referenceTitle}</p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)} className="text-left rounded-xl px-4 py-3 text-sm" style={{ background: reason === r ? BORDER : BG, border: reason === r ? `1px solid ${"#C0755B"}` : `1px solid ${BORDER}`, color: TEXT }}>{r}</button>
              ))}
            </div>
            <button onClick={submit} disabled={!reason || sending} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: reason ? "#C0755B" : BORDER, color: reason ? "#fff" : "#5C736D" }}>
              {sending ? "Submitting…" : "Submit report"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 size={40} color={GREEN} /><h2 className="mt-3 text-base font-semibold">Report submitted</h2>
            <p className="text-xs mt-1" style={{ color: MUTE }}>Our team will review this shortly.</p>
            <button onClick={onClose} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactModal({ context, referenceTitle, recipientPhone, whatsappNumber, whatsappMessage, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [validationError, setValidationError] = useState("");
  const can = name.trim() && phone.trim() && body.trim();

  async function send() {
    const phoneDigits = phone.replace(/[\s-]/g, "");
    if (!/^(05\d{8}|9665\d{8}|\+9665\d{8})$/.test(phoneDigits)) {
      setValidationError("Please enter a valid Saudi mobile number (e.g. 05XXXXXXXX).");
      return;
    }
    setValidationError("");
    setSending(true);
    try {
      await supabase.from("messages").insert({
        context,
        reference_title: referenceTitle,
        sender_name: name,
        sender_phone: phone,
        recipient_phone: recipientPhone || null,
        body,
      });
      await supabase.from("notifications").insert({
        recipient_type: "admin",
        title: "New message received",
        body: `${name} sent a message about "${referenceTitle}"`,
      });
      setSent(true);
    } catch (e) { /* still show sent state so user isn't blocked */ setSent(true); }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold">Send a message</h2>
              <button onClick={onClose}><X size={18} color={MUTE} /></button>
            </div>
            {referenceTitle && <p className="text-xs mb-4" style={{ color: FAINT }}>About: <span style={{ color: GOLD }}>{referenceTitle}</span></p>}
            <div className="flex flex-col gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" rows={3} className="rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
              {validationError && <p className="text-[12px]" style={{ color: "#C0755B" }}>{validationError}</p>}
              <button onClick={send} disabled={!can || sending} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>
                {sending ? "Sending…" : "Send message"}
              </button>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage || "Hi, I have a question.")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold"
                  style={{ background: "rgba(91,143,212,0.16)", color: GREEN }}
                >
                  <MessageCircle size={13} /> Or continue on WhatsApp
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 size={40} color={GREEN} /><h2 className="mt-3 text-base font-semibold">Message sent</h2>
            <p className="text-xs mt-1" style={{ color: MUTE }}>They'll get back to you soon.</p>
            <button onClick={onClose} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- push notifications ---------- */
const VAPID_PUBLIC_KEY = "BIF6pt0TZ39nUQfCCOfyXIqqlj5vQJ6TZ3nziSBlCE5KgL16zjnaluHgcLlGs_sFfHw2TU-hL5dXJGQNqqK623Q";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/* ---------- DRIVER MESSAGES ---------- */
function DriverMessages({ goBack, currentDriver }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const phone = currentDriver?.profile?.mobile_number;

  useEffect(() => {
    async function load() {
      if (!phone) { setLoading(false); return; }
      const { data } = await supabase.from("messages").select("*").eq("recipient_phone", phone).order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    }
    load();
  }, [phone]);

  return (
    <div style={{ color: TEXT }}>
      <Header title="Messages" onBack={goBack} />
      <div className="px-5">
        {!phone && <p className="text-sm text-center mt-6" style={{ color: FAINT }}>Log in to see your messages.</p>}
        {loading && phone && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>Loading…</p>}
        {!loading && phone && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <MessageCircle size={32} color={FAINT} />
            <p className="text-sm font-semibold mt-3">No messages yet</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{m.sender_name}</p>
                <p className="text-[10px]" style={{ color: FAINT }}>{new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              {m.reference_title && <p className="text-[11px] mt-0.5" style={{ color: GOLD }}>About: {m.reference_title}</p>}
              <p className="text-xs mt-1.5" style={{ color: MUTE }}>{m.body}</p>
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: FAINT }}><Phone size={9} /> {m.sender_phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- PUSH NOTIFICATION SETTINGS ---------- */
/* ---------- RESET PASSWORD (reached via email link) ---------- */
/* ---------- COMPANY AUTH (login / signup) ---------- */
function CompanyAuthScreen({ goBack, navigate, onLoggedIn }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (mode === "signup") {
      if (!companyName.trim()) return "Please enter your company name.";
      if (!crNumber.trim()) return "Please enter your Commercial Registration number.";
      if (!contactName.trim()) return "Please enter a contact person's name.";
      const mobileDigits = mobile.replace(/[\s-]/g, "");
      if (!/^(05\d{8}|9665\d{8}|\+9665\d{8})$/.test(mobileDigits)) return "Please enter a valid Saudi mobile number.";
    }
    return null;
  }

  async function handleSignup() {
    setError(""); setLoading(true);
    const v = validate();
    if (v) { setError(v); setLoading(false); return; }
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { role: "company", name: companyName, cr_number: crNumber, contact_name: contactName, mobile_number: mobile } },
      });
      if (signUpError) throw signUpError;
      const authUserId = data.user?.id;
      let profile = null;
      for (let attempt = 0; attempt < 4 && !profile; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
        const { data: found } = await supabase.from("companies").select("*").eq("auth_user_id", authUserId).maybeSingle();
        if (found) profile = found;
      }
      if (!profile) throw new Error("Account created, but your profile is still syncing — please try logging in again in a moment.");
      if (onLoggedIn) onLoggedIn({ email, profile });
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError(""); setLoading(true);
    const v = validate();
    if (v) { setError(v); setLoading(false); return; }
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const { data: profile } = await supabase.from("companies").select("*").eq("email", email).maybeSingle();
      if (onLoggedIn) onLoggedIn({ email, profile });
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="px-5 mt-8 flex flex-col items-center text-center" style={{ color: TEXT }}>
        <CheckCircle2 size={44} color={GREEN} />
        <h2 className="mt-4 text-lg font-semibold">{mode === "signup" ? "Company account created" : "Logged in"}</h2>
        <p className="mt-1 text-sm" style={{ color: MUTE }}>{mode === "signup" ? "Our team will review your Commercial Registration before you're fully verified." : "Welcome back!"}</p>
        <button onClick={() => navigate("company_dashboard")} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Continue</button>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Company account" onBack={goBack} />
      <div className="px-5">
        <div className="flex rounded-full p-1 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <button onClick={() => setMode("login")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: mode === "login" ? GOLD : "transparent", color: mode === "login" ? BG : MUTE }}>Log in</button>
          <button onClick={() => setMode("signup")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: mode === "signup" ? GOLD : "transparent", color: mode === "signup" ? BG : MUTE }}>Register company</button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Mail size={14} color={GOLD} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Company email" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Key size={14} color={GOLD} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
        </div>

        {mode === "signup" && (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Briefcase size={14} color={GOLD} />
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <User size={14} color={GOLD} />
              <input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} placeholder="Commercial Registration number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <User size={14} color={GOLD} />
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person name" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Phone size={14} color={GOLD} />
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
          </div>
        )}

        {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}

        <button
          onClick={mode === "signup" ? handleSignup : handleLogin}
          disabled={loading || !email || !password}
          className="w-full rounded-full py-3 text-sm font-semibold"
          style={{ background: (loading || !email || !password) ? BORDER : GOLD, color: (loading || !email || !password) ? "#5C736D" : BG }}
        >
          {loading ? "Please wait…" : mode === "signup" ? "Register company" : "Log in"}
        </button>
      </div>
    </div>
  );
}

function ResetPassword({ navigate }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const can = password.length >= 6 && password === confirm;

  async function submit() {
    if (!can) return;
    setLoading(true); setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e) {
      setError(e.message || "Couldn't update your password. Try requesting a new reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
        <CheckCircle2 size={44} color={GREEN} />
        <h2 className="mt-4 text-lg font-semibold">Password updated</h2>
        <p className="mt-1 text-sm" style={{ color: MUTE }}>You can now log in with your new password.</p>
        <button onClick={() => navigate("welcome")} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Continue</button>
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Set a new password" />
      <div className="px-5">
        <p className="text-sm mb-4" style={{ color: MUTE }}>Choose a new password for your account.</p>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Key size={14} color={GOLD} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Key size={14} color={GOLD} />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
        </div>
        {password && password.length < 6 && <p className="text-[12px] mb-2" style={{ color: "#C0755B" }}>Password must be at least 6 characters.</p>}
        {confirm && password !== confirm && <p className="text-[12px] mb-2" style={{ color: "#C0755B" }}>Passwords don't match.</p>}
        {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
        <button onClick={submit} disabled={!can || loading} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}

/* ---------- DRIVER DOCUMENTS ---------- */
const DOC_TYPES = [
  { key: "vehicle_photo_path", label: "Vehicle photo", icon: Car },
  { key: "license_path", label: "Driving license", icon: User },
  { key: "insurance_path", label: "Vehicle insurance", icon: Shield },
  { key: "id_photo_path", label: "Iqama / National ID", icon: User },
];

/* ---------- COMPANY DASHBOARD ---------- */
function CompanyDashboard({ goBack, navigate, currentCompany, onLogout }) {
  const profile = currentCompany?.profile;
  const [fleet, setFleet] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    async function loadFleet() {
      if (!profile?.id) return;
      const { data } = await supabase.from("fleet_vehicles").select("*").eq("company_id", profile.id);
      setFleet(data || []);
    }
    loadFleet();
  }, [profile?.id]);

  async function uploadLogo(file) {
    if (!file || !profile?.auth_user_id) return;
    setUploading("logo"); setUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.auth_user_id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(path);
      await supabase.from("companies").update({ logo_url: pub.publicUrl }).eq("id", profile.id);
      setLocalProfile((p) => ({ ...p, logo_url: pub.publicUrl }));
    } catch (e) { setUploadError("Couldn't upload logo. Please try again."); }
    setUploading(null);
  }

  async function uploadCR(file) {
    if (!file || !profile?.auth_user_id) return;
    setUploading("cr"); setUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.auth_user_id}/cr-document.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-documents").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      await supabase.from("companies").update({ cr_document_path: path }).eq("id", profile.id);
      setLocalProfile((p) => ({ ...p, cr_document_path: path }));
    } catch (e) { setUploadError("Couldn't upload document. Please try again."); }
    setUploading(null);
  }

  async function uploadGalleryPhoto(file) {
    if (!file || !profile?.auth_user_id) return;
    setUploading("gallery"); setUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.auth_user_id}/gallery-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-photos").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("company-photos").getPublicUrl(path);
      const nextPhotos = [...(localProfile?.photo_urls || []), pub.publicUrl];
      await supabase.from("companies").update({ photo_urls: nextPhotos }).eq("id", profile.id);
      setLocalProfile((p) => ({ ...p, photo_urls: nextPhotos }));
    } catch (e) { setUploadError("Couldn't upload photo. Please try again."); }
    setUploading(null);
  }

  async function removeGalleryPhoto(url) {
    const nextPhotos = (localProfile?.photo_urls || []).filter((p) => p !== url);
    await supabase.from("companies").update({ photo_urls: nextPhotos }).eq("id", profile.id);
    setLocalProfile((p) => ({ ...p, photo_urls: nextPhotos }));
  }

  if (!profile) {
    return (
      <div style={{ color: TEXT }}>
        <Header title="Company dashboard" onBack={goBack} />
        <EmptyState icon={Briefcase} title="No company account loaded" subtitle="Log in to see your company dashboard." action={
          <button onClick={() => navigate("company_login")} className="mt-4 px-5 py-2 rounded-full text-xs font-semibold" style={{ background: GOLD, color: BG }}>Company login</button>
        } />
      </div>
    );
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Company dashboard" onBack={goBack} right={
        <button onClick={onLogout} aria-label="Log out" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}><LogOut size={15} color="#C0755B" /></button>
      } />
      <div className="px-5 flex flex-col items-center text-center mb-5">
        <label className="relative cursor-pointer">
          <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: BORDER }}>
            {localProfile?.logo_url ? <img src={localProfile.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Briefcase size={26} color={GOLD} />}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
            {uploading === "logo" ? <span className="text-[8px]" style={{ color: BG }}>…</span> : <ImageIcon size={12} color={BG} />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files[0])} disabled={!!uploading} />
        </label>
        <div className="flex items-center gap-1.5 mt-3">
          <h2 className="text-base font-semibold">{localProfile?.name}</h2>
          {localProfile?.verified && <CheckCircle2 size={15} color={GREEN} />}
        </div>
        <p className="text-[11px] mt-1" style={{ color: localProfile?.verified ? GREEN : GOLD }}>{localProfile?.verified ? "Verified company" : "Verification pending"}</p>
        {uploadError && <p className="text-[11px] mt-2" style={{ color: "#C0755B" }}>{uploadError}</p>}
      </div>

      <div className="px-5 mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: MUTE }}>Company photos</p>
        <div className="grid grid-cols-3 gap-2">
          {(localProfile?.photo_urls || []).map((url) => (
            <div key={url} className="relative rounded-xl overflow-hidden" style={{ height: 80, background: CARD, border: `1px solid ${BORDER}` }}>
              <img src={url} alt="Company" className="w-full h-full object-cover" />
              <button onClick={() => removeGalleryPhoto(url)} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center rounded-xl cursor-pointer" style={{ height: 80, background: CARD, border: `1px dashed ${BORDER}` }}>
            {uploading === "gallery" ? <span className="text-[10px]" style={{ color: MUTE }}>…</span> : <><Plus size={16} color={GOLD} /><span className="text-[9px] mt-1" style={{ color: FAINT }}>Add photo</span></>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadGalleryPhoto(e.target.files[0])} disabled={!!uploading} />
          </label>
        </div>
      </div>

      <div className="px-5 mb-5">
        <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between py-1.5"><span className="text-xs" style={{ color: FAINT }}>CR Number</span><span className="text-xs font-semibold">{localProfile?.cr_number || "—"}</span></div>
          <div className="flex items-center justify-between py-1.5"><span className="text-xs" style={{ color: FAINT }}>Contact</span><span className="text-xs font-semibold">{localProfile?.contact_name || "—"}</span></div>
          <div className="flex items-center justify-between py-1.5"><span className="text-xs" style={{ color: FAINT }}>Mobile</span><span className="text-xs font-semibold">{localProfile?.mobile_number || "—"}</span></div>
        </div>
      </div>

      <div className="px-5 mb-5">
        <label className="w-full flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer" style={{ background: CARD, border: `1px solid ${localProfile?.cr_document_path ? "rgba(91,143,212,0.4)" : GOLD}` }}>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Package size={15} color={localProfile?.cr_document_path ? GREEN : GOLD} />
            {uploading === "cr" ? "Uploading…" : localProfile?.cr_document_path ? "CR document uploaded — tap to replace" : "Upload CR document"}
          </span>
          {localProfile?.cr_document_path ? <CheckCircle2 size={15} color={GREEN} /> : <ChevronRight size={14} color={GOLD} />}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => uploadCR(e.target.files[0])} disabled={!!uploading} />
        </label>
      </div>

      <div className="px-5 mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Your fleet</p>
        <p className="text-[11px]" style={{ color: FAINT }}>{fleet.length} vehicle{fleet.length !== 1 ? "s" : ""}</p>
      </div>
      {fleet.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles yet" subtitle="Vehicles registered under your company will appear here." />
      ) : (
        <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
          {fleet.map((v) => (
            <div key={v.id} className="rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold">{v.model || "Vehicle"}</p>
              <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{v.plate_number} · {v.driver_name || "Unassigned"}</p>
            </div>
          ))}
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}

function DriverDocuments({ goBack, currentDriver }) {
  const [docs, setDocs] = useState(currentDriver?.profile || {});
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState("");
  const authUserId = currentDriver?.profile?.auth_user_id;

  async function handleUpload(docKey, file) {
    if (!file || !authUserId) return;
    setUploading(docKey);
    setError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${authUserId}/${docKey}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("driver-documents").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from("drivers").update({ [docKey]: path }).eq("auth_user_id", authUserId);
      setDocs((d) => ({ ...d, [docKey]: path }));
    } catch (e) {
      setError("Couldn't upload that file. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Documents" onBack={goBack} />
      <div className="px-5">
        <p className="text-xs mb-4" style={{ color: MUTE }}>Upload clear photos of these documents so our team can verify your account. Your files are private and only visible to you and SayyaraDrive admin.</p>
        {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
        <div className="flex flex-col gap-2">
          {DOC_TYPES.map((d) => {
            const Icon = d.icon;
            const has = !!docs[d.key];
            return (
              <label key={d.key} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer" style={{ background: CARD, border: `1px solid ${has ? "rgba(91,143,212,0.4)" : BORDER}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: has ? "rgba(91,143,212,0.14)" : "rgba(217,166,83,0.12)" }}>
                  <Icon size={17} color={has ? GREEN : GOLD} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{d.label}</p>
                  <p className="text-[11px]" style={{ color: has ? GREEN : FAINT }}>
                    {uploading === d.key ? "Uploading…" : has ? "Uploaded — tap to replace" : "Tap to upload a photo"}
                  </p>
                </div>
                {has && <CheckCircle2 size={16} color={GREEN} />}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUpload(d.key, e.target.files[0])} disabled={uploading === d.key} />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PushSettings({ goBack, currentDriver }) {
  const [status, setStatus] = useState("checking"); // checking | unsupported | denied | off | on | working
  const [error, setError] = useState("");
  const phone = currentDriver?.profile?.mobile_number;

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setStatus("unsupported"); return; }
      if (Notification.permission === "denied") { setStatus("denied"); return; }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "on" : "off");
      } catch (e) { setStatus("off"); }
    }
    check();
  }, []);

  async function enablePush() {
    if (!phone) { setError("Log in as a driver first."); return; }
    setStatus("working");
    setError("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await supabase.from("push_subscriptions").insert({ driver_phone: phone, subscription: sub.toJSON() });
      setStatus("on");
    } catch (e) {
      setError("Couldn't enable push notifications on this device.");
      setStatus("off");
    }
  }

  async function disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (e) { /* ignore */ }
    setStatus("off");
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Push notifications" onBack={goBack} />
      <div className="px-5">
        <div className="rounded-2xl px-4 py-4 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 mb-2">
            <Zap size={18} color={GOLD} />
            <p className="text-sm font-semibold">Get notified instantly</p>
          </div>
          <p className="text-xs" style={{ color: MUTE }}>Turn on push notifications to get alerted about new ride requests, warnings, and account updates — even when the app is closed.</p>
        </div>

        {status === "unsupported" && <p className="text-xs text-center" style={{ color: FAINT }}>Push notifications aren't supported on this browser/device.</p>}
        {status === "denied" && <p className="text-xs text-center" style={{ color: "#C0755B" }}>Notifications are blocked for this site. Enable them in your browser settings to turn this on.</p>}
        {error && <p className="text-xs text-center mb-2" style={{ color: "#C0755B" }}>{error}</p>}

        {(status === "on") && (
          <button onClick={disablePush} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: "rgba(192,117,91,0.12)", color: "#C0755B" }}>Turn off push notifications</button>
        )}
        {(status === "off" || status === "working") && (
          <button onClick={enablePush} disabled={status === "working"} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>
            {status === "working" ? "Enabling…" : "Turn on push notifications"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- ADMIN LOGIN ---------- */
function AdminLogin({ goBack, navigate, onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdminLogin() {
    setError(""); setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const { data: adminRow, error: adminError } = await supabase.from("admins").select("*").eq("email", email).maybeSingle();
      if (adminError) throw adminError;
      if (!adminRow) {
        setError("This account doesn't have admin access.");
        setLoading(false);
        return;
      }
      if (onLoggedIn) onLoggedIn(adminRow);
      navigate("admin");
    } catch (e) {
      setError(e.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Admin login" onBack={goBack} />
      <div className="px-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Mail size={14} color={GOLD} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Key size={14} color={GOLD} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
        </div>
        {error && <p className="text-[12px] mb-3" style={{ color: "#C0755B" }}>{error}</p>}
        <button
          onClick={handleAdminLogin}
          disabled={loading || !email || !password}
          className="w-full rounded-full py-3 text-sm font-semibold"
          style={{ background: (loading || !email || !password) ? BORDER : GOLD, color: (loading || !email || !password) ? "#5C736D" : BG }}
        >
          {loading ? "Checking…" : "Log in"}
        </button>
      </div>
    </div>
  );
}

/* ---------- GENERIC ADMIN LIST (drivers, passengers, companies, marketplace, jobs, food, logistics, fleet, violations) ---------- */
function AdminListPage({ goBack, title, table, columns, showDriverActions, deletable, addFields, statusToggle, approvalActions, moderationToggle, resolveToggle, companyActions }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [viewingDocs, setViewingDocs] = useState(null);
  const [docUrls, setDocUrls] = useState({});

  async function openDocuments(row) {
    setViewingDocs(row);
    const urls = {};
    for (const d of DOC_TYPES) {
      if (row[d.key]) {
        const { data } = await supabase.storage.from("driver-documents").createSignedUrl(row[d.key], 3600);
        if (data?.signedUrl) urls[d.key] = data.signedUrl;
      }
    }
    setDocUrls(urls);
  }

  async function loadRows() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadRows(); }, []);

  async function addWarning(driver) {
    const newCount = (driver.warning_count || 0) + 1;
    const newStatus = newCount >= 5 ? "blocked" : "warned";
    await supabase.from("violations").insert({ driver_id: driver.id, reason: "Manual warning from admin" });
    await supabase.from("drivers").update({ warning_count: newCount, status: newStatus }).eq("id", driver.id);
    const title = newStatus === "blocked" ? "Your account has been blocked" : "You received a warning";
    const body = newStatus === "blocked" ? "You've reached 5 warnings and your account is now blocked. Contact support." : `Warning ${newCount}/5. Please review SayyaraDrive's driver guidelines.`;
    await supabase.from("notifications").insert({ recipient_phone: driver.mobile_number, recipient_type: "driver", title, body });
    sendPush(driver.mobile_number, title, body);
    loadRows();
  }

  async function unblockDriver(driver) {
    await supabase.from("drivers").update({ status: "active", warning_count: 0 }).eq("id", driver.id);
    const title = "Your account has been unblocked";
    const body = "You can now go online and accept rides again.";
    await supabase.from("notifications").insert({ recipient_phone: driver.mobile_number, recipient_type: "driver", title, body });
    sendPush(driver.mobile_number, title, body);
    loadRows();
  }

  async function toggleVerified(driver) {
    const nowVerified = !driver.verified;
    await supabase.from("drivers").update({ verified: nowVerified }).eq("id", driver.id);
    if (nowVerified) {
      const title = "You're verified!";
      const body = "Your documents have been approved. You now have a verified badge.";
      await supabase.from("notifications").insert({ recipient_phone: driver.mobile_number, recipient_type: "driver", title, body });
      sendPush(driver.mobile_number, title, body);
    }
    loadRows();
  }

  async function toggleCompanyVerified(company) {
    await supabase.from("companies").update({ verified: !company.verified }).eq("id", company.id);
    loadRows();
  }

  async function viewCRDocument(company) {
    if (!company.cr_document_path) return;
    const { data } = await supabase.storage.from("company-documents").createSignedUrl(company.cr_document_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function deleteRow(row) {
    await supabase.from(table).delete().eq("id", row.id);
    loadRows();
  }

  async function toggleSold(row) {
    await supabase.from(table).update({ status: row.status === "sold" ? "active" : "sold" }).eq("id", row.id);
    loadRows();
  }

  async function toggleModeration(row) {
    await supabase.from(table).update({ status: row.status === "hidden" ? "visible" : "hidden" }).eq("id", row.id);
    loadRows();
  }

  async function toggleResolved(row) {
    await supabase.from(table).update({ status: row.status === "resolved" ? "open" : "resolved" }).eq("id", row.id);
    loadRows();
  }

  async function setApplicationStatus(row, newStatus) {
    await supabase.from(table).update({ status: newStatus }).eq("id", row.id);
    if (table === "partner_applications" && (newStatus === "approved" || newStatus === "rejected")) {
      const title = newStatus === "approved" ? "Your application was approved" : "Your application was not approved";
      const body = newStatus === "approved" ? `Your ${row.type} application has been approved. Our team will be in touch.` : `Your ${row.type} application was not approved this time.`;
      await supabase.from("notifications").insert({ recipient_phone: row.phone, recipient_type: "driver", title, body });
      sendPush(row.phone, title, body);
    }
    loadRows();
  }

  async function submitNewRow() {
    setAddSubmitting(true);
    const payload = { ...newRow, status: "active" };
    await supabase.from(table).insert(payload);
    setAddSubmitting(false);
    setShowAddForm(false);
    setNewRow({});
    loadRows();
  }

  const displayRows = showDriverActions
    ? rows.filter((r) => filter === "all" ? true : filter === "pending" ? !r.verified : r.verified)
    : rows;
  const pendingCount = showDriverActions ? rows.filter((r) => !r.verified).length : 0;
  const addCan = addFields ? addFields.every((f) => !f.required || (newRow[f.key] || "").toString().trim()) : false;

  return (
    <div style={{ color: TEXT }}>
      <Header title={title} onBack={goBack} right={
        <div className="flex items-center gap-2">
          <button onClick={loadRows} aria-label="Refresh" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}><RefreshCw size={15} color={TEXT} className={loading ? "animate-spin" : ""} /></button>
          {addFields && (
            <button onClick={() => setShowAddForm(true)} aria-label="Add new" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={18} color={BG} /></button>
          )}
        </div>
      } />
      {showDriverActions && (
        <div className="px-5 mb-4 flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "verified", label: "Verified" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-3.5 py-1.5 rounded-full text-xs font-medium" style={{ background: filter === f.id ? GOLD : CARD, color: filter === f.id ? BG : MUTE, border: filter === f.id ? "none" : `1px solid ${BORDER}` }}>{f.label}</button>
          ))}
        </div>
      )}
      <div className="px-5">
        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        )}
        {!loading && error && (
          <EmptyState
            icon={Zap}
            title="Couldn't load this data"
            subtitle="Check your connection and try again."
            action={<button onClick={loadRows} className="mt-4 px-5 py-2 rounded-full text-xs font-semibold" style={{ background: GOLD, color: BG }}>Retry</button>}
          />
        )}
        {!loading && !error && displayRows.length === 0 && (
          <EmptyState icon={Package} title="No records here" subtitle="Nothing to show yet." />
        )}
        <div className="flex flex-col gap-2">
          {!loading && displayRows.map((r) => {
            const statusColor = r.status === "blocked" || r.status === "rejected" || r.status === "hidden" ? "#C0755B" : r.status === "warned" || r.status === "pending" || r.status === "open" ? GOLD : GREEN;
            return (
              <div key={r.id} className="rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{columns.map((c) => r[c.key]).filter(Boolean)[0] || "—"}</p>
                    {showDriverActions && r.verified && <CheckCircle2 size={13} color={GREEN} />}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${statusColor}22`, color: statusColor }}>
                        {r.status}{showDriverActions ? ` · ${r.warning_count || 0}/5 warnings` : ""}
                      </span>
                    )}
                    {deletable && (
                      <button onClick={() => deleteRow(r)} aria-label="Delete">
                        <X size={14} color="#C0755B" />
                      </button>
                    )}
                  </div>
                </div>
                {columns.slice(1).map((c) => r[c.key] ? (
                  <p key={c.key} className="text-[11px]" style={{ color: FAINT }}>{c.label}: {String(r[c.key])}</p>
                ) : null)}
                {showDriverActions && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleVerified(r)} className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold" style={{ background: r.verified ? "rgba(192,117,91,0.12)" : "rgba(91,143,212,0.15)", color: r.verified ? "#C0755B" : GREEN }}>
                      <CheckCircle2 size={12} /> {r.verified ? "Unverify" : "Verify driver"}
                    </button>
                    {r.status !== "blocked" ? (
                      <button onClick={() => addWarning(r)} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: "rgba(217,166,83,0.15)", color: GOLD }}>
                        Add warning
                      </button>
                    ) : (
                      <button onClick={() => unblockDriver(r)} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: "rgba(91,143,212,0.15)", color: GREEN }}>
                        Unblock driver
                      </button>
                    )}
                  </div>
                )}
                {showDriverActions && (
                  <button onClick={() => openDocuments(r)} className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
                    <Package size={12} /> View documents
                  </button>
                )}
                {statusToggle && (
                  <button onClick={() => toggleSold(r)} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: r.status === "sold" ? "rgba(91,143,212,0.15)" : "rgba(192,117,91,0.12)", color: r.status === "sold" ? GREEN : "#C0755B" }}>
                    {r.status === "sold" ? "Mark as available again" : "Mark as sold"}
                  </button>
                )}
                {moderationToggle && (
                  <button onClick={() => toggleModeration(r)} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: r.status === "hidden" ? "rgba(91,143,212,0.15)" : "rgba(192,117,91,0.12)", color: r.status === "hidden" ? GREEN : "#C0755B" }}>
                    {r.status === "hidden" ? "Show review" : "Hide review"}
                  </button>
                )}
                {resolveToggle && (
                  <button onClick={() => toggleResolved(r)} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: r.status === "resolved" ? "rgba(217,166,83,0.15)" : "rgba(91,143,212,0.15)", color: r.status === "resolved" ? GOLD : GREEN }}>
                    {r.status === "resolved" ? "Reopen" : "Mark resolved"}
                  </button>
                )}
                {companyActions && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleCompanyVerified(r)} className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold" style={{ background: r.verified ? "rgba(192,117,91,0.12)" : "rgba(91,143,212,0.15)", color: r.verified ? "#C0755B" : GREEN }}>
                      <CheckCircle2 size={12} /> {r.verified ? "Unverify" : "Verify company"}
                    </button>
                    {r.cr_document_path && (
                      <button onClick={() => viewCRDocument(r)} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
                        View CR document
                      </button>
                    )}
                  </div>
                )}
                {approvalActions && r.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setApplicationStatus(r, "rejected")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: "rgba(192,117,91,0.12)", color: "#C0755B" }}>
                      Reject
                    </button>
                    <button onClick={() => setApplicationStatus(r, "approved")} className="flex-1 rounded-full py-2 text-xs font-semibold" style={{ background: "rgba(91,143,212,0.15)", color: GREEN }}>
                      Approve
                    </button>
                  </div>
                )}
                {approvalActions && r.status !== "pending" && (
                  <button onClick={() => setApplicationStatus(r, "pending")} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: MUTE }}>
                    Reset to pending
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddForm && addFields && (
        <div className="fixed inset-0 flex items-end justify-center z-40" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add new</h2>
              <button onClick={() => { setShowAddForm(false); setNewRow({}); }}><X size={18} color={MUTE} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {addFields.map((f) => (
                f.type === "select" ? (
                  <div key={f.key} className="rounded-xl px-4 py-1" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                    <select value={newRow[f.key] || ""} onChange={(e) => setNewRow({ ...newRow, [f.key]: e.target.value })} className="bg-transparent outline-none text-sm w-full py-3" style={{ color: newRow[f.key] ? TEXT : FAINT }}>
                      <option value="" style={{ background: CARD }}>{f.label}</option>
                      {f.options.map((o) => <option key={o} value={o} style={{ background: CARD }}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <input key={f.key} value={newRow[f.key] || ""} onChange={(e) => setNewRow({ ...newRow, [f.key]: e.target.value })} placeholder={f.label} className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                )
              ))}
              <button onClick={submitNewRow} disabled={!addCan || addSubmitting} className="w-full rounded-full py-3 text-sm font-semibold mt-1" style={{ background: addCan ? GOLD : BORDER, color: addCan ? BG : "#5C736D" }}>
                {addSubmitting ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingDocs && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}`, maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Documents — {viewingDocs.full_name}</h2>
              <button onClick={() => { setViewingDocs(null); setDocUrls({}); }}><X size={18} color={MUTE} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {DOC_TYPES.map((d) => (
                <div key={d.key}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: MUTE }}>{d.label}</p>
                  {docUrls[d.key] ? (
                    <img src={docUrls[d.key]} alt={d.label} loading="lazy" className="w-full rounded-xl object-cover" style={{ maxHeight: 220, background: BG }} />
                  ) : (
                    <div className="w-full rounded-xl flex items-center justify-center py-6" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                      <p className="text-[11px]" style={{ color: FAINT }}>Not uploaded yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- ADMIN SUPPORT INBOX ---------- */
function AdminSupportInbox({ goBack }) {
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadThreads() {
    setLoading(true);
    const { data } = await supabase.from("messages").select("*").eq("context", "support").order("created_at", { ascending: false });
    const grouped = {};
    (data || []).forEach((m) => {
      if (!grouped[m.booking_ref]) grouped[m.booking_ref] = { booking_ref: m.booking_ref, reference_title: m.reference_title, last: m, count: 0, unread: 0 };
      grouped[m.booking_ref].count++;
      if (m.sender_role === "user" && !m.read) grouped[m.booking_ref].unread++;
      if (new Date(m.created_at) > new Date(grouped[m.booking_ref].last.created_at)) grouped[m.booking_ref].last = m;
    });
    setThreads(Object.values(grouped).sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at)));
    setLoading(false);
  }
  useEffect(() => { loadThreads(); }, []);

  async function openChat(t) {
    setOpenThread(t);
    const { data } = await supabase.from("messages").select("*").eq("booking_ref", t.booking_ref).order("created_at", { ascending: true });
    setMessages(data || []);
    const unread = (data || []).filter((m) => m.sender_role === "user" && !m.read);
    if (unread.length > 0) await supabase.from("messages").update({ read: true }).in("id", unread.map((m) => m.id));
  }

  async function sendReply() {
    if (!reply.trim() || !openThread) return;
    await supabase.from("messages").insert({
      context: "support",
      reference_title: openThread.reference_title,
      booking_ref: openThread.booking_ref,
      sender_role: "support",
      sender_name: "SayyaraDrive Team",
      sender_phone: "support",
      recipient_phone: openThread.booking_ref.replace("support:", ""),
      body: reply.trim(),
    });
    setReply("");
    openChat(openThread);
  }

  if (openThread) return (
    <div style={{ color: TEXT }}>
      <Header title={openThread.reference_title || "Support chat"} onBack={() => { setOpenThread(null); loadThreads(); }} />
      <div className="px-5 flex flex-col gap-2 mb-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${m.sender_role === "user" ? "self-start" : "self-end ml-auto"}`} style={{ background: m.sender_role === "user" ? CARD : GOLD, border: m.sender_role === "user" ? `1px solid ${BORDER}` : "none" }}>
            {m.audio_url ? (
              <audio controls src={m.audio_url} style={{ height: 32, width: 180 }} />
            ) : m.image_url ? (
              <img src={m.image_url} alt="Shared" loading="lazy" className="rounded-lg" style={{ maxWidth: 200, maxHeight: 200 }} />
            ) : (
              <p className="text-xs" style={{ color: m.sender_role === "user" ? TEXT : BG }}>{m.body}</p>
            )}
            <p className="text-[9px] mt-1" style={{ color: m.sender_role === "user" ? FAINT : "rgba(15,33,30,0.6)" }}>{new Date(m.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="px-5 flex items-center gap-2">
        <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Reply as SayyaraDrive Team…" className="flex-1 rounded-full px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
        <button onClick={sendReply} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={16} color={BG} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ color: TEXT }}>
      <Header title="Support inbox" onBack={goBack} />
      <div className="px-5">
        {loading && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>Loading…</p>}
        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <MessageCircle size={32} color={FAINT} />
            <p className="text-sm font-semibold mt-3">No support messages yet</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {threads.map((t) => (
            <button key={t.booking_ref} onClick={() => openChat(t)} className="w-full text-left rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.reference_title || t.booking_ref}</p>
                <div className="flex items-center gap-2">
                  {t.unread > 0 && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                  <span className="text-[10px]" style={{ color: FAINT }}>{t.count} msg{t.count > 1 ? "s" : ""}</span>
                </div>
              </div>
              <p className="text-[11px] mt-1 truncate" style={{ color: FAINT }}>{t.last.sender_role === "user" ? "" : "You: "}{t.last.body}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- ADMIN RIDE CHATS ---------- */
function AdminRideChats({ goBack }) {
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadThreads() {
    setLoading(true);
    const { data } = await supabase.from("messages").select("*").eq("context", "ride").not("booking_ref", "is", null).order("created_at", { ascending: false });
    const grouped = {};
    (data || []).forEach((m) => {
      if (!grouped[m.booking_ref]) grouped[m.booking_ref] = { booking_ref: m.booking_ref, reference_title: m.reference_title, last: m, count: 0 };
      grouped[m.booking_ref].count++;
      if (new Date(m.created_at) > new Date(grouped[m.booking_ref].last.created_at)) grouped[m.booking_ref].last = m;
    });
    setThreads(Object.values(grouped).sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at)));
    setLoading(false);
  }
  useEffect(() => { loadThreads(); }, []);

  async function openChat(t) {
    setOpenThread(t);
    const { data } = await supabase.from("messages").select("*").eq("booking_ref", t.booking_ref).order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function sendReply() {
    if (!reply.trim() || !openThread) return;
    await supabase.from("messages").insert({
      context: "ride",
      reference_title: openThread.reference_title,
      booking_ref: openThread.booking_ref,
      sender_role: "driver",
      sender_name: "SayyaraDrive Team",
      sender_phone: "N/A",
      body: reply.trim(),
    });
    setReply("");
    openChat(openThread);
  }

  if (openThread) return (
    <div style={{ color: TEXT }}>
      <Header title={openThread.reference_title || "Chat"} onBack={() => { setOpenThread(null); loadThreads(); }} />
      <div className="px-5 flex flex-col gap-2 mb-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${m.sender_role === "passenger" ? "self-start" : "self-end ml-auto"}`} style={{ background: m.sender_role === "passenger" ? CARD : GOLD, border: m.sender_role === "passenger" ? `1px solid ${BORDER}` : "none" }}>
            {m.audio_url ? (
              <audio controls src={m.audio_url} style={{ height: 32, width: 180 }} />
            ) : m.image_url ? (
              <img src={m.image_url} alt="Shared" loading="lazy" className="rounded-lg" style={{ maxWidth: 200, maxHeight: 200 }} />
            ) : m.location_lat ? (
              <a href={`https://www.google.com/maps/search/?api=1&query=${m.location_lat},${m.location_lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline" style={{ color: m.sender_role === "passenger" ? GREEN : BG }}>
                <MapPin size={12} /> {m.body}
              </a>
            ) : (
              <p className="text-xs" style={{ color: m.sender_role === "passenger" ? TEXT : BG }}>{m.body}</p>
            )}
            <p className="text-[9px] mt-1" style={{ color: m.sender_role === "passenger" ? FAINT : "rgba(15,33,30,0.6)" }}>{new Date(m.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="px-5 flex items-center gap-2">
        <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Reply as SayyaraDrive Team…" className="flex-1 rounded-full px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
        <button onClick={sendReply} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={16} color={BG} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ color: TEXT }}>
      <Header title="Ride chats" onBack={goBack} />
      <div className="px-5">
        {loading && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>Loading…</p>}
        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <MessageCircle size={32} color={FAINT} />
            <p className="text-sm font-semibold mt-3">No active chats</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {threads.map((t) => (
            <button key={t.booking_ref} onClick={() => openChat(t)} className="w-full text-left rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.reference_title || t.booking_ref}</p>
                <span className="text-[10px]" style={{ color: FAINT }}>{t.count} msg{t.count > 1 ? "s" : ""}</span>
              </div>
              <p className="text-[11px] mt-1 truncate" style={{ color: FAINT }}>{t.last.sender_role === "passenger" ? "Passenger: " : "You: "}{t.last.body}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- ADMIN ANALYTICS ---------- */
function AdminAnalytics({ goBack }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rideTrend, setRideTrend] = useState([]);
  const [driverTrend, setDriverTrend] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

      const [
        { count: totalDrivers },
        { count: verifiedDrivers },
        { count: onlineDrivers },
        { count: totalRides },
        { count: completedRides },
        { count: activeRides },
        { count: ridesToday },
        { count: openReports },
        { data: ratingsData },
        { count: marketplaceCount },
        { count: companiesCount },
        { count: jobsCount },
        { count: applicationsCount },
        { count: restaurantsCount },
        { count: crashCount7d },
        { data: perfData },
        { data: recentRides },
        { data: recentDrivers },
      ] = await Promise.all([
        supabase.from("drivers").select("*", { count: "exact", head: true }),
        supabase.from("drivers").select("*", { count: "exact", head: true }).eq("verified", true),
        supabase.from("drivers").select("*", { count: "exact", head: true }).eq("is_online", true),
        supabase.from("rides").select("*", { count: "exact", head: true }),
        supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("rides").select("*", { count: "exact", head: true }).in("status", ["accepted", "arrived", "in_progress"]),
        supabase.from("rides").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("ratings").select("rating").eq("status", "visible"),
        supabase.from("marketplace_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("partner_applications").select("*", { count: "exact", head: true }),
        supabase.from("restaurants").select("*", { count: "exact", head: true }),
        supabase.from("crash_reports").select("*", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("performance_logs").select("load_time_ms").gte("created_at", since7),
        supabase.from("rides").select("created_at").gte("created_at", since7),
        supabase.from("drivers").select("created_at").gte("created_at", since7),
      ]);

      const avgRating = ratingsData && ratingsData.length > 0 ? (ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length).toFixed(1) : "—";
      const avgLoadMs = perfData && perfData.length > 0 ? Math.round(perfData.reduce((s, p) => s + (p.load_time_ms || 0), 0) / perfData.length) : null;

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return d.toISOString().slice(0, 10);
      });
      const countByDay = (rows) => days.map((day) => (rows || []).filter((r) => r.created_at.slice(0, 10) === day).length);

      setStats({
        totalDrivers, verifiedDrivers, onlineDrivers, totalRides, completedRides, activeRides, ridesToday,
        openReports, avgRating, marketplaceCount, companiesCount, jobsCount, applicationsCount, restaurantsCount,
        crashCount7d, avgLoadMs,
      });
      setRideTrend(countByDay(recentRides));
      setDriverTrend(countByDay(recentDrivers));
      setLoading(false);
    }
    load();
  }, []);

  function BarChart({ data, color, labels }) {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end gap-2" style={{ height: 90 }}>
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md" style={{ height: `${Math.max((v / max) * 70, 3)}px`, background: color }} />
            <p className="text-[9px]" style={{ color: FAINT }}>{labels[i]}</p>
          </div>
        ))}
      </div>
    );
  }

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
  });

  return (
    <div style={{ color: TEXT }}>
      <Header title="Analytics" onBack={goBack} />
      <div className="px-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: FAINT }}>Drivers & Rides</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Total drivers</p>
                <p className="text-xl font-semibold mt-1">{stats.totalDrivers ?? 0}</p>
                <p className="text-[10px] mt-0.5" style={{ color: GREEN }}>{stats.verifiedDrivers ?? 0} verified · {stats.onlineDrivers ?? 0} online now</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Active rides right now</p>
                <p className="text-xl font-semibold mt-1" style={{ color: stats.activeRides > 0 ? GOLD : TEXT }}>{stats.activeRides ?? 0}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Rides booked today</p>
                <p className="text-xl font-semibold mt-1">{stats.ridesToday ?? 0}</p>
                <p className="text-[9px] mt-0.5" style={{ color: FAINT }}>closest available proxy for daily users</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Total rides</p>
                <p className="text-xl font-semibold mt-1">{stats.totalRides ?? 0}</p>
                <p className="text-[10px] mt-0.5" style={{ color: GREEN }}>{stats.completedRides ?? 0} completed</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Avg. rating</p>
                <p className="text-xl font-semibold mt-1 flex items-center gap-1"><Star size={16} fill={GOLD} color={GOLD} /> {stats.avgRating}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${stats.openReports > 0 ? "rgba(192,117,91,0.4)" : BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Open reports</p>
                <p className="text-xl font-semibold mt-1" style={{ color: stats.openReports > 0 ? "#C0755B" : TEXT }}>{stats.openReports ?? 0}</p>
              </div>
            </div>

            <div className="rounded-2xl px-4 py-4 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold mb-3">Rides — last 7 days</p>
              <BarChart data={rideTrend} color={GOLD} labels={dayLabels} />
            </div>
            <div className="rounded-2xl px-4 py-4 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold mb-3">New driver signups — last 7 days</p>
              <BarChart data={driverTrend} color={GREEN} labels={dayLabels} />
            </div>

            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: FAINT }}>Marketplace, Jobs & Companies</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Active marketplace listings</p>
                <p className="text-xl font-semibold mt-1">{stats.marketplaceCount ?? 0}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Registered companies</p>
                <p className="text-xl font-semibold mt-1">{stats.companiesCount ?? 0}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Jobs posted</p>
                <p className="text-xl font-semibold mt-1">{stats.jobsCount ?? 0}</p>
                <p className="text-[10px] mt-0.5" style={{ color: GREEN }}>{stats.applicationsCount ?? 0} applications received</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Restaurants listed</p>
                <p className="text-xl font-semibold mt-1">{stats.restaurantsCount ?? 0}</p>
                <p className="text-[9px] mt-0.5" style={{ color: FAINT }}>order tracking not yet wired to DB</p>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: FAINT }}>System Health</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${stats.crashCount7d > 0 ? "rgba(192,117,91,0.4)" : BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Errors — last 7 days</p>
                <p className="text-xl font-semibold mt-1" style={{ color: stats.crashCount7d > 0 ? "#C0755B" : GREEN }}>{stats.crashCount7d ?? 0}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px]" style={{ color: FAINT }}>Avg. app load time</p>
                <p className="text-xl font-semibold mt-1">{stats.avgLoadMs ? `${(stats.avgLoadMs / 1000).toFixed(1)}s` : "—"}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminBroadcast({ goBack }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const can = title.trim();

  async function send() {
    setSending(true);
    await supabase.from("notifications").insert({
      recipient_type: audience,
      recipient_phone: null,
      title,
      body,
    });
    setSending(false);
    setSent(true);
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Send announcement" onBack={goBack} />
      <div className="px-5">
        {!sent ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs" style={{ color: MUTE }}>This appears in the notification bell for everyone in the audience you pick.</p>
            <div className="rounded-xl px-4 py-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="bg-transparent outline-none text-sm w-full py-3" style={{ color: TEXT }}>
                <option value="all" style={{ background: CARD }}>Everyone (passengers & drivers)</option>
                <option value="driver" style={{ background: CARD }}>All drivers only</option>
              </select>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Eid holiday hours)" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message (optional)" rows={3} className="rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
            <button onClick={send} disabled={!can || sending} className="w-full rounded-full py-3 text-sm font-semibold mt-1" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>
              {sending ? "Sending…" : "Send announcement"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-8">
            <CheckCircle2 size={44} color={GREEN} />
            <h2 className="mt-4 text-lg font-semibold">Announcement sent</h2>
            <button onClick={() => { setSent(false); setTitle(""); setBody(""); }} className="w-full max-w-xs mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Send another</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- ADMIN OVERVIEW (sidebar-style dashboard) ---------- */
const ADMIN_SECTIONS = [
  { id: "drivers", label: "Drivers", table: "drivers", icon: Car },
  { id: "rides", label: "Rides", table: "rides", icon: Route },
  { id: "ratings", label: "Ratings", table: "ratings", icon: Star },
  { id: "reports", label: "Reports", table: "reports", icon: Flag },
  { id: "crash_reports", label: "Errors", table: "crash_reports", icon: Zap },
  { id: "passengers", label: "Passengers", table: "passengers", icon: Users },
  { id: "partner_applications", label: "Applications", table: "partner_applications", icon: Briefcase },
  { id: "messages", label: "Messages", table: "messages", icon: MessageCircle },
  { id: "companies", label: "Companies", table: "companies", icon: Briefcase },
  { id: "marketplace_listings", label: "Marketplace", table: "marketplace_listings", icon: ShoppingBag },
  { id: "restaurants", label: "Restaurants", table: "restaurants", icon: UtensilsCrossed },
  { id: "jobs", label: "Jobs", table: "jobs", icon: Briefcase },
  { id: "rental_bookings", label: "Rentals", table: "rental_bookings", icon: Key },
  { id: "food_orders", label: "Food Orders", table: "food_orders", icon: UtensilsCrossed },
  { id: "logistics_parcels", label: "Logistics", table: "logistics_parcels", icon: Truck },
  { id: "fleet_vehicles", label: "Fleet", table: "fleet_vehicles", icon: Car },
  { id: "violations", label: "Violations", table: "violations", icon: Shield },
];

function AdminOverview({ navigate, goBack, onLogout }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      const results = {};
      for (const s of ADMIN_SECTIONS) {
        const { count } = await supabase.from(s.table).select("*", { count: "exact", head: true });
        results[s.id] = count || 0;
      }
      setCounts(results);
      setLoading(false);
    }
    loadCounts();
  }, []);

  return (
    <div style={{ color: TEXT }}>
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: CARD }}>
            <ArrowLeft size={17} color={TEXT} />
          </button>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: TEXT }}>Admin dashboard</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#C0755B" }}>
          <LogOut size={13} /> Log out
        </button>
      </div>

      <div className="px-5 sm:px-8 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold mb-1">Platform overview</p>
          <p className="text-[11px]" style={{ color: FAINT }}>Live stats across all modules</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("notifications")} aria-label="Notifications" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Bell size={15} color={TEXT} />
          </button>
          <button onClick={() => navigate("admin_analytics")} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
            <Zap size={13} /> Analytics
          </button>
          <button onClick={() => navigate("admin_ride_chats")} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
            <MessageCircle size={13} /> Chats
          </button>
          <button onClick={() => navigate("admin_support_inbox")} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: CARD, border: `1px solid ${GOLD}`, color: GOLD }}>
            <HelpCircle size={13} /> Support
          </button>
          <button onClick={() => navigate("admin_broadcast")} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: GOLD, color: BG }}>
            <Bell size={13} /> Announce
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ADMIN_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => navigate(`admin_${s.id}`)} className="text-left rounded-2xl px-4 py-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: FAINT }}>{s.label}</p>
                <Icon size={16} color={GOLD} />
              </div>
              <p className="text-2xl font-semibold" style={{ color: GOLD }}>{loading ? "…" : counts[s.id] ?? 0}</p>
            </button>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}

/* ---------- APP ROOT ---------- */
const TAB_SCREENS = ["home", "activity", "wallet", "profile", "driver"];

export default function SayyaraDriveApp() {
  const isAdminLink = typeof window !== "undefined" && window.location.search.includes("owner2026");
  const [history, setHistory] = useState([isAdminLink ? "admin_login" : "welcome"]);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [activeFriendChat, setActiveFriendChat] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [lang, setLangRaw] = useState(() => {
    try { return localStorage.getItem("sayyara_lang") || "en"; } catch (e) { return "en"; }
  });
  function setLang(code) {
    setLangRaw(code);
    try { localStorage.setItem("sayyara_lang", code); } catch (e) {}
  }
  const screen = history[history.length - 1];

  // App-wide crash reporting — catches real errors, no third-party service needed
  useEffect(() => {
    function reportCrash(message, stack) {
      supabase.from("crash_reports").insert({
        message: String(message).slice(0, 500),
        stack: stack ? String(stack).slice(0, 2000) : null,
        url: window.location.href,
        user_agent: navigator.userAgent,
      }).then(() => {});
    }
    function onError(event) {
      reportCrash(event.message, event.error?.stack);
    }
    function onRejection(event) {
      reportCrash(`Unhandled promise rejection: ${event.reason?.message || event.reason}`, event.reason?.stack);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  // Lightweight performance monitoring — logs how long the app took to become interactive
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      const loadTimeMs = nav ? Math.round(nav.loadEventEnd - nav.startTime) : Math.round(performance.now());
      if (loadTimeMs > 0 && loadTimeMs < 60000) {
        supabase.from("performance_logs").insert({ load_time_ms: loadTimeMs, screen: "app_start" }).then(() => {});
      }
    } catch (e) { /* performance API not available */ }
  }, []);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email;
          const { data: adminRow } = await supabase.from("admins").select("*").eq("email", email).maybeSingle();
          if (adminRow) {
            setCurrentAdmin(adminRow);
            setHistory(["admin"]);
          } else {
            const { data: driverRow } = await supabase.from("drivers").select("*").eq("auth_user_id", session.user.id).maybeSingle();
            if (driverRow) {
              setCurrentDriver({ email, type: "driver", profile: driverRow });
              setHistory(["driver"]);
            } else {
              const { data: passengerRow } = await supabase.from("passengers").select("*").eq("auth_user_id", session.user.id).maybeSingle();
              if (passengerRow) {
                setCurrentDriver({ email, type: "passenger", profile: passengerRow });
                setHistory(["home"]);
              } else {
                const { data: companyRow } = await supabase.from("companies").select("*").eq("auth_user_id", session.user.id).maybeSingle();
                if (companyRow) {
                  setCurrentCompany({ email, profile: companyRow });
                  setHistory(["company_dashboard"]);
                }
              }
            }
          }
        }
      } catch (e) { /* no active session, stay logged out */ }
      setSessionChecked(true);
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHistory(["reset_password"]);
      }
    });
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  function driverLogout() {
    supabase.auth.signOut();
    setCurrentDriver(null);
    setHistory(["welcome"]);
  }

  function companyLogout() {
    supabase.auth.signOut();
    setCurrentCompany(null);
    setHistory(["welcome"]);
  }

  function navigate(next) {
    if (TAB_SCREENS.includes(next)) setHistory([next]);
    else setHistory((h) => [...h, next]);
  }
  function goBack() {
    setHistory((h) => {
      if (h.length > 1) return h.slice(0, -1);
      return ["home"];
    });
  }

  const isTab = TAB_SCREENS.includes(screen);

  const SCREEN_MAP = {
    welcome: <WelcomeScreen navigate={navigate} />,
    auth_choice: <AuthChoiceScreen goBack={goBack} navigate={navigate} />,
    register_choice: <RegisterChoiceScreen goBack={goBack} navigate={navigate} />,
    home: <Home navigate={navigate} lang={lang} setLang={setLang} t={t} currentDriver={currentDriver} driverLogout={driverLogout} />,
    ride: <BookRide goBack={goBack} />,
    driver: <DriverApp goBack={goBack} navigate={navigate} currentDriver={currentDriver} />,
    driver_profile: <DriverProfile goBack={goBack} navigate={navigate} currentDriver={currentDriver} onLogout={driverLogout} />,
    driver_edit_profile: <DriverEditProfile goBack={goBack} currentDriver={currentDriver} setCurrentDriver={setCurrentDriver} />,
    driver_trips: <DriverTripHistory goBack={goBack} currentDriver={currentDriver} />,
    driver_documents: <DriverDocuments goBack={goBack} currentDriver={currentDriver} />,
    notifications: <NotificationsScreen goBack={goBack} currentDriver={currentDriver} currentAdmin={currentAdmin} />,
    friends: <FriendsListScreen goBack={goBack} navigate={navigate} setActiveFriendChat={setActiveFriendChat} />,
    friend_chat: <FriendChatScreen goBack={goBack} activeFriendChat={activeFriendChat} />,
    driver_messages: <DriverMessages goBack={goBack} currentDriver={currentDriver} />,
    push_settings: <PushSettings goBack={goBack} currentDriver={currentDriver} />,
    airport: <BookRide goBack={goBack} />,
    intercity: <BookRide goBack={goBack} />,
    rentals: <CarRental goBack={goBack} navigate={navigate} />,
    market: <Marketplace goBack={goBack} navigate={navigate} />,
    food: <FoodDelivery goBack={goBack} navigate={navigate} />,
    logistics: <Logistics goBack={goBack} navigate={navigate} />,
    jobs: <JobsPortal goBack={goBack} navigate={navigate} />,
    fleet: <FleetManagement goBack={goBack} navigate={navigate} />,
    profile: <Profile goBack={goBack} navigate={navigate} currentDriver={currentDriver} driverLogout={driverLogout} />,
    activity: <TripHistory goBack={goBack} />,
    wallet: <WalletTab goBack={goBack} />,
    admin: currentAdmin ? <AdminOverview navigate={navigate} goBack={goBack} onLogout={() => { supabase.auth.signOut(); setCurrentAdmin(null); navigate("welcome"); }} /> : <AdminLogin goBack={goBack} navigate={navigate} onLoggedIn={setCurrentAdmin} />,
    register_driver: <PartnerRegister goBack={goBack} type="driver" />,
    register_rental: <PartnerRegister goBack={goBack} type="rental_owner" />,
    register_seller: <PartnerRegister goBack={goBack} type="seller" />,
    register_food: <PartnerRegister goBack={goBack} type="food_partner" />,
    register_logistics: <PartnerRegister goBack={goBack} type="logistics_partner" />,
    register_fleet: <PartnerRegister goBack={goBack} type="fleet_owner" />,
    driver_login: <AuthScreen goBack={goBack} type="driver" navigate={navigate} onLoggedIn={setCurrentDriver} />,
    company_login: <CompanyAuthScreen goBack={goBack} navigate={navigate} onLoggedIn={setCurrentCompany} />,
    company_dashboard: <CompanyDashboard goBack={goBack} navigate={navigate} currentCompany={currentCompany} onLogout={companyLogout} />,
    reset_password: <ResetPassword navigate={navigate} />,
    passenger_login: <AuthScreen goBack={goBack} type="passenger" navigate={navigate} onLoggedIn={setCurrentDriver} />,
    admin_login: <AdminLogin goBack={goBack} navigate={navigate} onLoggedIn={setCurrentAdmin} />,
    admin_drivers: <AdminListPage goBack={goBack} title="Drivers" table="drivers" showDriverActions deletable columns={[{key:"full_name",label:"Name"},{key:"iqama_number",label:"Iqama"},{key:"vehicle_number",label:"Vehicle"},{key:"mobile_number",label:"Mobile"},{key:"city_type",label:"City type"}]} />,
    admin_passengers: <AdminListPage goBack={goBack} title="Passengers" table="passengers" columns={[{key:"full_name",label:"Name"},{key:"mobile_number",label:"Mobile"}]} />,
    admin_rides: <AdminListPage goBack={goBack} title="Rides" table="rides" deletable columns={[{key:"ride_type",label:"Type"},{key:"pickup_label",label:"Pickup"},{key:"dropoff_label",label:"Dropoff"},{key:"city",label:"City"},{key:"status",label:"Status"}]} />,
    admin_ratings: <AdminListPage goBack={goBack} title="Ratings & Reviews" table="ratings" deletable moderationToggle columns={[{key:"target_label",label:"About"},{key:"rating_type",label:"Type"},{key:"rating",label:"Stars"},{key:"review",label:"Review"},{key:"reviewer_name",label:"By"}]} />,
    admin_crash_reports: <AdminListPage goBack={goBack} title="Errors" table="crash_reports" deletable columns={[{key:"message",label:"Error"},{key:"url",label:"Page"},{key:"user_agent",label:"Device"}]} />,
    admin_reports: <AdminListPage goBack={goBack} title="Reports" table="reports" deletable resolveToggle columns={[{key:"reference_title",label:"Listing"},{key:"context",label:"Section"},{key:"reason",label:"Reason"}]} />,
    admin_companies: <AdminListPage goBack={goBack} title="Companies" table="companies" deletable companyActions columns={[{key:"name",label:"Name"},{key:"cr_number",label:"CR Number"},{key:"contact_name",label:"Contact"},{key:"mobile_number",label:"Mobile"},{key:"email",label:"Email"}]} />,
    admin_marketplace_listings: <AdminListPage goBack={goBack} title="Marketplace" table="marketplace_listings" deletable statusToggle columns={[{key:"title",label:"Title"},{key:"seller_name",label:"Seller"},{key:"price",label:"Price"},{key:"category",label:"Category"},{key:"location",label:"Location"}]} addFields={[{key:"title",label:"Title",required:true},{key:"price",label:"Price (SAR)",required:true},{key:"category",label:"Category",type:"select",options:["Cars","Electronics","Furniture","Fashion","Spare parts"],required:true},{key:"location",label:"City",required:true},{key:"seller_name",label:"Seller name"},{key:"seller_phone",label:"Seller phone"},{key:"condition",label:"Condition (e.g. Excellent, Like New)"},{key:"year",label:"Year (cars only)"},{key:"km",label:"Mileage (cars only)"},{key:"image_url",label:"Image URL (optional)"}]} />,
    admin_restaurants: <AdminListPage goBack={goBack} title="Restaurants" table="restaurants" deletable columns={[{key:"name",label:"Name"},{key:"cuisine",label:"Cuisine"},{key:"city",label:"City"},{key:"hours",label:"Hours"}]} addFields={[{key:"name",label:"Restaurant name",required:true},{key:"cuisine",label:"Cuisine (e.g. Arabic, Fast food)",required:true},{key:"city",label:"City",required:true},{key:"hours",label:"Hours (e.g. 10:00–23:00)"},{key:"food_category",label:"Photo type",type:"select",options:["rice","burger","dessert","pasta","butter-chicken"],required:true}]} />,
    admin_jobs: <AdminListPage goBack={goBack} title="Jobs" table="jobs" deletable columns={[{key:"title",label:"Title"},{key:"company",label:"Company"},{key:"location",label:"Location"},{key:"pay",label:"Pay"}]} addFields={[{key:"title",label:"Job title",required:true},{key:"company",label:"Company name",required:true},{key:"location",label:"City",required:true},{key:"pay",label:"Pay",required:true},{key:"job_type",label:"Type",type:"select",options:["Full-time","Part-time","Flexible","Freelance"]},{key:"phone",label:"Contact phone"},{key:"description",label:"Description"}]} />,
    admin_partner_applications: <AdminListPage goBack={goBack} title="Applications" table="partner_applications" deletable approvalActions columns={[{key:"full_name",label:"Name"},{key:"type",label:"Type"},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"city",label:"City"},{key:"district",label:"District"},{key:"details",label:"Details"}]} />,
    admin_messages: <AdminListPage goBack={goBack} title="Messages" table="messages" deletable columns={[{key:"sender_name",label:"From"},{key:"sender_phone",label:"Phone"},{key:"context",label:"About"},{key:"reference_title",label:"Reference"},{key:"body",label:"Message"}]} />,
    admin_broadcast: <AdminBroadcast goBack={goBack} />,
    admin_analytics: <AdminAnalytics goBack={goBack} />,
    admin_ride_chats: <AdminRideChats goBack={goBack} />,
    admin_support_inbox: <AdminSupportInbox goBack={goBack} />,
    support_chat: <SupportChatScreen goBack={goBack} currentDriver={currentDriver} />,
    admin_rental_bookings: <AdminListPage goBack={goBack} title="Car Rentals" table="rental_bookings" columns={[{key:"renter_name",label:"Renter"},{key:"provider",label:"Company"},{key:"car_model",label:"Car"},{key:"pickup_date",label:"Pickup"},{key:"return_date",label:"Return"},{key:"total_price",label:"Total"}]} />,
    admin_food_orders: <AdminListPage goBack={goBack} title="Food Delivery" table="food_orders" columns={[{key:"restaurant_name",label:"Restaurant"},{key:"customer_name",label:"Customer"},{key:"total",label:"Total"}]} />,
    admin_logistics_parcels: <AdminListPage goBack={goBack} title="Logistics" table="logistics_parcels" columns={[{key:"sender_name",label:"Sender"},{key:"pickup_address",label:"Pickup"},{key:"dropoff_address",label:"Dropoff"}]} />,
    admin_fleet_vehicles: <AdminListPage goBack={goBack} title="Fleet" table="fleet_vehicles" columns={[{key:"plate_number",label:"Plate"},{key:"model",label:"Model"},{key:"driver_name",label:"Driver"}]} />,
    admin_violations: <AdminListPage goBack={goBack} title="Violations" table="violations" columns={[{key:"reason",label:"Reason"},{key:"driver_id",label:"Driver ID"}]} />,
  };

  return (
    <div className="min-h-screen w-full flex justify-center relative" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-2 text-[12px] font-semibold" style={{ background: "#C0755B", color: "#fff" }}>
          <Zap size={13} /> You're offline — some features may not work until you're back online.
        </div>
      )}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
        <div className={`w-full relative h-full ${screen === "admin" ? "max-w-6xl" : "max-w-md lg:max-w-5xl"}`}>
          <SkylineBackground opacity={0.25} />
        </div>
      </div>
      <div className={`w-full relative z-10 ${screen === "admin" ? "max-w-6xl" : "max-w-md lg:max-w-5xl"}`} style={{ paddingBottom: isTab ? 70 : 20, paddingTop: isOffline ? 32 : 0 }}>
        {SCREEN_MAP[screen] || <Home navigate={navigate} lang={lang} setLang={setLang} t={t} />}

        {screen !== "welcome" && screen !== "admin" && screen !== "admin_login" && (
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi SayyaraDrive, I need help with the app.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40"
            style={{ background: "#25D366", bottom: isTab ? 86 : 24 }}
            aria-label="Contact support on WhatsApp"
          >
            <MessageCircle size={21} color="#fff" fill="#fff" />
          </a>
        )}

        {isTab && <BottomNav screen={screen} navigate={navigate} t={t} />}
      </div>
    </div>
  );
}
