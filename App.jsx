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
  Link, Globe, Trophy, MessageCircle
} from "lucide-react";

/* ---------- support contact ---------- */
const SUPPORT_WHATSAPP_NUMBER = "966581965361";

/* ---------- shared tokens ---------- */
const BG = "#070E1F", CARD = "#101B36", BORDER = "#1E2E52";
const GOLD = "#D9A653", GREEN = "#5B8FD4", TEXT = "#F1F5FB";
const MUTE = "#9FB0CE", FAINT = "#6C7FA6";
const HERE_API_KEY = "-ZUX_FxV-ok4896M-TXR2aqAShTd04KfYRqS_3_JGAM";

/* ---------- Saudi Arabia cities & districts ---------- */
const SAUDI_CITIES = {
  Riyadh: ["Al Olaya", "Al Malaz", "Al Naseem", "Al Yasmin", "King Fahd District", "Al Sulimaniyah", "Diriyah", "Al Rawdah"],
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
function detectLocation({ onStart, onSuccess, onError }) {
  if (!navigator.geolocation) {
    onError && onError("Geolocation isn't supported on this browser.");
    return;
  }
  onStart && onStart();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&lang=en-US&apiKey=${HERE_API_KEY}`
        );
        if (!res.ok) {
          const errBody = await res.text();
          console.error("HERE reverse geocode failed:", res.status, errBody);
          onSuccess && onSuccess({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (address lookup failed)` });
          return;
        }
        const data = await res.json();
        const label = data?.items?.[0]?.address?.label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        onSuccess && onSuccess({ lat: latitude, lng: longitude, label });
      } catch (e) {
        console.error("Reverse geocode error:", e);
        onSuccess && onSuccess({ lat: latitude, lng: longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      }
    },
    (err) => {
      const messages = {
        1: "Location permission denied — allow location access for this site in your browser settings.",
        2: "Your location is unavailable right now — try again.",
        3: "Location request timed out — try again.",
      };
      onError && onError(messages[err.code] || "Couldn't get your location.");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

/* ---------- language system ---------- */
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
    intercity: "Intercity", cityToCity: "City to city",
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
    intercity: "بين المدن", cityToCity: "من مدينة لمدينة",
    rentals: "تأجير", rentACar: "استأجر سيارة",
    marketplace: "السوق", buySell: "بيع وشراء",
    food: "طعام", delivery: "توصيل",
    logistics: "لوجستيات", sendParcels: "إرسال طرود",
    jobs: "وظائف", driveEarn: "قد واربح",
    fleet: "الأسطول", manageCars: "إدارة السيارات",
    useMyLocation: "استخدم موقعي الحالي",
    detecting: "جارٍ تحديد الموقع…",
  },
};

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
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}>
          <ArrowLeft size={17} color={TEXT} />
        </button>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: TEXT }}>{title}</h1>
      </div>
      {right}
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

function Home({ navigate, lang, setLang, t }) {
  return (
    <div className="pb-4 relative overflow-hidden" style={{ color: TEXT }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <SkylineBackground opacity={0.9} />
      <div className="relative flex items-center justify-between px-5 pt-6 pb-2">
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}><Menu size={18} color={TEXT} /></button>
        <div className="text-[10px] uppercase" style={{ color: GREEN, letterSpacing: "0.25em" }}>Riyadh, Saudi Arabia</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-2.5 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{ background: CARD, color: GOLD }}
          >
            {lang === "en" ? "AR" : "EN"}
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: CARD }}>
            <Bell size={17} color={TEXT} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          </button>
        </div>
      </div>
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
              <ChevronRight size={22} color={BG} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
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
  { id: "economy", label: "Economy", eta: "4 min", price: 18, icon: Car },
  { id: "comfort", label: "Comfort", eta: "6 min", price: 27, icon: Zap },
  { id: "family", label: "Family", eta: "8 min", price: 38, icon: Users2 },
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

  // --- city ride state ---
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [pickup, setPickup] = useState("Current location");
  const [pickupCoords, setPickupCoords] = useState({ lat: 24.7136, lng: 46.6753 });
  const [dropoff, setDropoff] = useState("");
  const [activeField, setActiveField] = useState(null); // "pickup" | "dropoff" | null
  const pickupSuggestions = activeField === "pickup" && pickup.trim()
    ? SAUDI_PLACES.filter((p) => p.label.toLowerCase().includes(pickup.toLowerCase())).slice(0, 6)
    : [];
  const dropoffSuggestions = activeField === "dropoff" && dropoff.trim()
    ? SAUDI_PLACES.filter((p) => p.label.toLowerCase().includes(dropoff.toLowerCase())).slice(0, 6)
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
      onSuccess: ({ lat, lng, label }) => {
        setPickup(label);
        setPickupCoords({ lat, lng });
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
  const [aptLocating, setAptLocating] = useState(false);
  const [aptLocError, setAptLocError] = useState("");
  const [aptDate, setAptDate] = useState(""); const [aptTime, setAptTime] = useState("");
  const [vehicle, setVehicle] = useState("sedan");
  const chosenVehicle = AIRPORT_VEHICLES.find((v) => v.id === vehicle);
  const cityForAirport = AIRPORT_CITY[airport];

  function useMyLocationAirport() {
    detectLocation({
      onStart: () => { setAptLocating(true); setAptLocError(""); },
      onSuccess: ({ label }) => { setAddress(label); setAptLocating(false); },
      onError: (msg) => { setAptLocating(false); setAptLocError(msg); },
    });
  }

  // --- intercity state ---
  const [icFrom, setIcFrom] = useState("Riyadh"); const [icTo, setIcTo] = useState("Jeddah");
  const [icDate, setIcDate] = useState("");
  const [icOption, setIcOption] = useState("shared");
  const chosenIntercity = INTERCITY_OPTIONS.find((o) => o.id === icOption);

  function switchMode(m) {
    setMode(m);
    setStage("input");
  }

  const canContinue =
    mode === "city" ? dropoff.trim() :
    mode === "airport" ? (aptDate && aptTime) :
    (icFrom !== icTo && icDate);

  function goChoose() {
    if (canContinue) setStage("choose");
  }

  const MODE_TABS = [
    { id: "city", label: "City" },
    { id: "airport", label: "Airport" },
    { id: "intercity", label: "Intercity" },
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
                  <button key={p.label} onMouseDown={() => { setDropoff(p.label); setActiveField(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <MapPin size={12} color={GOLD} /> {p.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={useMyLocationCity} disabled={locating} className="w-full mt-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold" style={{ background: "rgba(217,166,83,0.12)", color: GOLD }}>
              <Navigation size={13} className={locating ? "animate-pulse" : ""} /> {locating ? "Detecting location…" : "Use my current location"}
            </button>
            {locError && <p className="text-[11px] text-center mt-2" style={{ color: "#C0755B" }}>{locError}</p>}
            <button onClick={goChoose} disabled={!canContinue} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: canContinue ? GOLD : BORDER, color: canContinue ? BG : "#5C736D" }}>
              Find rides
            </button>
          </div>
        </>
      )}

      {mode === "city" && stage === "choose" && (
        <div className="px-5 mt-1">
          <div className="flex flex-col gap-2">
            {RIDE_TYPES.map((r) => {
              const Icon = r.icon, isSel = rideType === r.id;
              return (
                <button key={r.id} onClick={() => setRideType(r.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
                    <div className="text-left"><p className="text-sm font-semibold">{r.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{r.eta} away</p></div>
                  </div>
                  <p className="text-sm font-semibold">{r.price} SAR</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosenRide.label} — {chosenRide.price} SAR</button>
        </div>
      )}

      {mode === "city" && stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} />
          <h2 className="mt-4 text-lg font-semibold">Ride confirmed</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Looking for a nearby driver. You'll be connected by WhatsApp.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>
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
              <select value={airport} onChange={(e) => { setAirport(e.target.value); setDistrict(SAUDI_CITIES[AIRPORT_CITY[e.target.value]][0]); }} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
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
                  <img src={v.img} alt={v.label} className="w-16 h-14 rounded-lg object-cover shrink-0" style={{ background: BORDER }} />
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
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Transfer booked</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Driver details shared via WhatsApp.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>
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
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><MapPin size={14} color={GREEN} /><select value={icFrom} onChange={(e) => setIcFrom(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <div className="flex items-center gap-3 py-3"><MapPin size={14} color={GOLD} /><select value={icTo} onChange={(e) => setIcTo(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <button onClick={() => { setIcFrom(icTo); setIcTo(icFrom); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BORDER }}><ArrowRightLeft size={14} color={GOLD} /></button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Calendar size={15} color={GOLD} /><input type="date" value={icDate} onChange={(e) => setIcDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <button onClick={goChoose} disabled={!canContinue} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: canContinue ? GOLD : BORDER, color: canContinue ? BG : "#5C736D" }}>See options</button>
        </div>
      )}

      {mode === "intercity" && stage === "choose" && (
        <div className="px-5">
          <div className="rounded-xl px-4 py-3 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}><p className="text-sm font-semibold">{icFrom} → {icTo}</p><p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: FAINT }}><Route size={11} /> {icDate}</p></div>
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
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Trip booked</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Driver details on WhatsApp before departure.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
          <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel booking</button>
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
    </div>
  );
}

/* ---------- DRIVER APP ---------- */
const INCOMING_REQUEST = { rider: "Faisal A.", rating: 4.8, pickup: "Al Olaya Street, Riyadh", dropoff: "King Khalid International Airport", distance: "1.2 km away", fare: 42, pickupCoords: { lat: 24.7, lng: 46.685 } };
function DriverApp({ goBack, navigate, currentDriver }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [online, setOnline] = useState(false);
  const [request, setRequest] = useState(null);
  const [tripState, setTripState] = useState("idle");
  const [driverLoc, setDriverLoc] = useState({ lat: 24.7136, lng: 46.6753 });
  const [locLabel, setLocLabel] = useState("Riyadh (default)");
  const [locError, setLocError] = useState("");

  useEffect(() => {
    detectLocation({
      onSuccess: ({ lat, lng, label }) => { setDriverLoc({ lat, lng }); setLocLabel(label); },
      onError: (msg) => setLocError(msg),
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
        const map = new window.H.Map(mapRef.current, defaultLayers.vector.normal.map, { zoom: 13, center: driverLoc, pixelRatio: window.devicePixelRatio || 1 });
        new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        new window.H.ui.UI.createDefault(map, defaultLayers);
        const driverIcon = new window.H.map.Icon(
          "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="9" fill="#D9A653" stroke="#070E1F" stroke-width="3"/></svg>`)
        );
        const driverMarker = new window.H.map.Marker(driverLoc, { icon: driverIcon });
        map.addObject(driverMarker);
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
    if (request && request.pickupCoords) {
      const icon = new window.H.map.Icon(
        "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#5B8FD4" stroke="#070E1F" stroke-width="3"/></svg>`)
      );
      const marker = new window.H.map.Marker(request.pickupCoords, { icon });
      mapObjRef.current.addObject(marker);
      pickupMarkerRef.current = marker;
      mapObjRef.current.getViewModel().setLookAtData({ bounds: new window.H.geo.Rect(
        Math.max(driverLoc.lat, request.pickupCoords.lat) + 0.01,
        Math.min(driverLoc.lng, request.pickupCoords.lng) - 0.01,
        Math.min(driverLoc.lat, request.pickupCoords.lat) - 0.01,
        Math.max(driverLoc.lng, request.pickupCoords.lng) + 0.01,
      ) });
    }
  }, [request]);

  function goOnline() { setOnline(true); setTimeout(() => setRequest(INCOMING_REQUEST), 1500); }
  function goOffline() { setOnline(false); setRequest(null); setTripState("idle"); }

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
              <span className="text-[10px]" style={{ color: FAINT }}>{currentDriver.profile.city_type === "intercity" ? "Intercity" : "Inside-city"}</span>
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
      {locError && <p className="px-5 mt-1 text-[11px]" style={{ color: "#C0755B" }}>{locError}</p>}
      {online && !request && tripState === "idle" && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>You're online — waiting for requests…</p>}
      {!online && (
        <div className="px-5 mt-6">
          <p className="text-sm text-center" style={{ color: FAINT }}>Go online to start receiving ride requests.</p>
          <button onClick={() => navigate("driver_login")} className="w-full mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><User size={15} color={GOLD} /> Driver login</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <button onClick={() => navigate("register_driver")} className="w-full mt-2 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Car size={15} color={GOLD} /> New driver? Register here</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
        </div>
      )}
      {request && tripState === "idle" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{request.rider}</p>
              <p className="text-lg font-semibold" style={{ color: GOLD }}>{request.fare} SAR</p>
            </div>
            <p className="text-xs" style={{ color: MUTE }}>{request.pickup} → {request.dropoff}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRequest(null)} className="flex-1 rounded-full py-2.5 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Decline</button>
              <button onClick={() => setTripState("accepted")} className="flex-1 rounded-full py-2.5 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Accept</button>
            </div>
          </div>
        </div>
      )}
      {tripState === "accepted" && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <p className="text-sm font-semibold mb-3">Trip accepted — contact rider on WhatsApp</p>
            <button onClick={() => { setTripState("idle"); setRequest(null); }} className="w-full rounded-full py-2.5 text-sm font-semibold" style={{ background: GREEN, color: BG }}>Complete trip</button>
          </div>
        </div>
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

  function toggleDoc(d) {
    setCheckedDocs((c) => ({ ...c, [d]: !c[d] }));
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
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back</button>
            <button onClick={() => step3Valid && setStep(4)} disabled={!step3Valid} className="flex-1 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: step3Valid ? GOLD : BORDER, color: step3Valid ? BG : "#5C736D" }}>
              Submit application
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
  { id: "eco", label: "Economy", model: "Hyundai Accent", price: 95, provider: "Lumi Rent a Car", img: "https://loremflickr.com/400/300/hyundai,sedan/all?lock=11" },
  { id: "sedan", label: "Sedan", model: "Toyota Camry", price: 145, provider: "Theeb Rent a Car", img: "https://loremflickr.com/400/300/toyota,camry/all?lock=12" },
  { id: "suv", label: "SUV", model: "Toyota Fortuner", price: 220, provider: "Yelo Rent a Car", img: "https://loremflickr.com/400/300/suv,car/all?lock=13" },
  { id: "luxury", label: "Luxury", model: "Lexus ES", price: 380, provider: "Sixt Rent a Car", img: "https://loremflickr.com/400/300/lexus,luxury-car/all?lock=14" },
  { id: "van", label: "Minivan", model: "Hyundai Staria", price: 260, provider: "Hanco Rent a Car", img: "https://loremflickr.com/400/300/minivan,van/all?lock=15" },
  { id: "pickup", label: "Pickup", model: "Toyota Hilux", price: 190, provider: "Key Rent a Car", img: "https://loremflickr.com/400/300/pickup-truck/all?lock=16" },
];
function CarRental({ goBack, navigate }) {
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState(SAUDI_CITIES["Riyadh"][0]);
  const [pickupDate, setPickupDate] = useState(""); const [returnDate, setReturnDate] = useState("");
  const [stage, setStage] = useState("input"); const [carId, setCarId] = useState("sedan");
  const chosen = CARS.find((c) => c.id === carId);
  const can = pickupDate && returnDate && returnDate >= pickupDate;
  const days = can ? Math.max(1, Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000) || 1) : 0;
  return (
    <div style={{ color: TEXT }}>
      <Header title="Car rental" onBack={goBack} />
      {stage === "input" && (
        <div className="px-5">
          <button onClick={() => navigate("register_rental")} className="w-full mb-2.5 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Key size={15} color={GOLD} /> Own a car? List it for rent</span>
            <ChevronRight size={14} color={GOLD} />
          </button>
          <button onClick={() => navigate("register_fleet")} className="w-full mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GREEN}` }}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Users size={15} color={GREEN} /> Own a fleet? Register your transport company</span>
            <ChevronRight size={14} color={GREEN} />
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
          <p className="text-xs mb-3" style={{ color: FAINT }}>{district}, {city} · {pickupDate} → {returnDate} · {days} day{days > 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {CARS.map((c) => {
              const isSel = carId === c.id;
              return (
                <button key={c.id} onClick={() => setCarId(c.id)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <img src={c.img} alt={c.model} className="w-16 h-14 rounded-lg object-cover shrink-0" style={{ background: BORDER }} />
                  <div className="flex-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.label}</p><p className="text-sm font-semibold">{c.price} SAR/day</p></div><p className="text-[11px]" style={{ color: FAINT }}>{c.model}</p><p className="text-[10px] mt-0.5" style={{ color: GOLD }}>{c.provider}</p></div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Reserve — {chosen.price * days} SAR total</button>
        </div>
      )}
      {stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Reservation confirmed</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Bring your ID and license at pickup.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
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
    </div>
  );
}

/* ---------- MARKETPLACE ---------- */
const CATEGORIES = ["All", "Cars", "Electronics", "Furniture", "Fashion", "Spare parts"];
const LISTINGS = [
  { id: 1, title: "Toyota Camry 2021", price: 62000, category: "Cars", location: "Riyadh", tag: "Featured", seller: "Individual seller", img: "https://loremflickr.com/400/300/toyota,camry/all?lock=21" },
  { id: 2, title: "iPhone 15 Pro, 256GB", price: 3400, category: "Electronics", location: "Jeddah", tag: null, seller: "Extra Stores", img: "https://loremflickr.com/400/300/iphone,smartphone/all?lock=22" },
  { id: 3, title: "3-seat sofa, grey", price: 950, category: "Furniture", location: "Dammam", tag: null, seller: "IKEA Marketplace", img: "https://loremflickr.com/400/300/sofa,couch/all?lock=23" },
  { id: 4, title: "Nike Air Max, size 43", price: 220, category: "Fashion", location: "Riyadh", tag: null, seller: "SHEIN Store", img: "https://loremflickr.com/400/300/sneakers,nike/all?lock=24" },
  { id: 5, title: "Car tires set (4)", price: 800, category: "Spare parts", location: "Khobar", tag: "New", seller: "Al Jazira Tires Co.", img: "https://loremflickr.com/400/300/car-tires/all?lock=25" },
  { id: 6, title: "Hyundai Elantra 2020", price: 41000, category: "Cars", location: "Makkah", tag: null, seller: "Individual seller", img: "https://loremflickr.com/400/300/hyundai,elantra/all?lock=26" },
  { id: 7, title: "Samsung 55\" Smart TV", price: 1600, category: "Electronics", location: "Madinah", tag: "New", seller: "Jarir Bookstore", img: "https://loremflickr.com/400/300/smart-tv,television/all?lock=27" },
  { id: 8, title: "Dining table + 6 chairs", price: 1200, category: "Furniture", location: "Taif", tag: null, seller: "Home Centre", img: "https://loremflickr.com/400/300/dining-table/all?lock=28" },
  { id: 9, title: "Men's Thobe, size L", price: 90, category: "Fashion", location: "Abha", tag: null, seller: "Individual seller", img: "https://loremflickr.com/400/300/thobe,mens-fashion/all?lock=29" },
  { id: 10, title: "Car battery, 70Ah", price: 260, category: "Spare parts", location: "Jubail", tag: null, seller: "AutoZone Saudi", img: "https://loremflickr.com/400/300/car-battery/all?lock=30" },
  { id: 11, title: "GMC Yukon 2019", price: 118000, category: "Cars", location: "Dammam", tag: "Featured", seller: "Individual seller", img: "https://loremflickr.com/400/300/gmc,suv/all?lock=31" },
  { id: 12, title: "MacBook Air M2", price: 4200, category: "Electronics", location: "Riyadh", tag: null, seller: "Jarir Bookstore", img: "https://loremflickr.com/400/300/macbook,laptop/all?lock=32" },
  { id: 13, title: "Leather office chair", price: 480, category: "Furniture", location: "Riyadh", tag: "New", seller: "Home Centre", img: "https://loremflickr.com/400/300/office-chair/all?lock=33" },
  { id: 14, title: "PlayStation 5", price: 1950, category: "Electronics", location: "Jeddah", tag: "Featured", seller: "Extra Stores", img: "https://loremflickr.com/400/300/playstation,gaming-console/all?lock=34" },
  { id: 15, title: "Women's handbag, leather", price: 320, category: "Fashion", location: "Khobar", tag: null, seller: "Individual seller", img: "https://loremflickr.com/400/300/handbag,leather-bag/all?lock=35" },
  { id: 16, title: "Alloy wheels, 18-inch set", price: 1400, category: "Spare parts", location: "Dammam", tag: null, seller: "Al Jazira Tires Co.", img: "https://loremflickr.com/400/300/alloy-wheels,car-rim/all?lock=36" },
];
function Marketplace({ goBack, navigate }) {
  const [category, setCategory] = useState("All"); const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState([]);

  useEffect(() => {
    async function loadListings() {
      const { data } = await supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
      if (data) {
        setDbListings(data.map((r) => ({
          id: `db-${r.id}`,
          title: r.title,
          price: r.price || 0,
          category: r.category || "Cars",
          location: r.location || "Riyadh",
          tag: r.tag || null,
          seller: r.seller_name || "Individual seller",
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
      <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((l) => (
          <div key={l.id} className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="h-24 relative" style={{ background: BORDER }}>
              <img src={l.img} alt={l.title} className="w-full h-full object-cover" />
              {l.tag && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: GOLD, color: BG }}>{l.tag}</span>}
            </div>
            <div className="p-2.5"><p className="text-xs font-semibold leading-tight">{l.title}</p><p className="text-sm font-semibold mt-1" style={{ color: GOLD }}>{l.price.toLocaleString()} SAR</p><p className="text-[10px] mt-1" style={{ color: GREEN }}>{l.seller}</p><p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={9} /> {l.location}</p></div>
          </div>
        ))}
      </div>
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
  1: [{ id: "m1", name: "Kabsa Chicken", price: 42 }, { id: "m2", name: "Mandi Lamb", price: 58 }, { id: "m3", name: "Grilled Mixed Platter", price: 65 }],
  2: [{ id: "m4", name: "Classic Beef Burger", price: 28 }, { id: "m5", name: "Fries", price: 12 }, { id: "m6", name: "Chicken Crispy Burger", price: 26 }],
  3: [{ id: "m7", name: "Grilled Chicken Bowl", price: 34 }, { id: "m8", name: "Quinoa Salad", price: 30 }],
  4: [{ id: "m9", name: "Kunafa Slice", price: 18 }, { id: "m10", name: "Date Cake", price: 15 }],
  5: [{ id: "m11", name: "Arabic Coffee (pot)", price: 20 }, { id: "m12", name: "Cardamom Latte", price: 16 }],
  6: [{ id: "m13", name: "Broasted Chicken Meal", price: 24 }, { id: "m14", name: "Garlic Sauce Extra", price: 5 }],
  7: [{ id: "m15", name: "Mandi Chicken", price: 45 }, { id: "m16", name: "Mandi Lamb (large)", price: 78 }],
  8: [{ id: "m17", name: "Spaghetti Bolognese", price: 38 }, { id: "m18", name: "Fettuccine Alfredo", price: 42 }],
  9: [{ id: "m19", name: "Salmon Sushi Set", price: 55 }, { id: "m20", name: "California Roll (8pc)", price: 32 }],
};

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

  useEffect(() => {
    async function loadRestaurants() {
      const { data } = await supabase.from("restaurants").select("*").eq("status", "active").order("created_at", { ascending: false });
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
  const menu = openRestaurant ? (MENU[openRestaurant.id] || []) : [];
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menu.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0);
  const cityOptions = ["All Cities", ...Array.from(new Set(allRestaurants.map((r) => r.city)))];
  const filteredRestaurants = allRestaurants.filter((r) =>
    (city === "All Cities" || r.city === city) &&
    (r.name.toLowerCase().includes(query.toLowerCase()) || r.cuisine.toLowerCase().includes(query.toLowerCase()))
  );

  if (stage === "confirmed") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Order placed</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>{openRestaurant.name} is preparing your order.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
      <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel order</button>
    </div>
  );
  if (stage === "cancelled") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <X size={44} color="#C0755B" /><h2 className="mt-4 text-lg font-semibold">Order cancelled</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>No charge — your order has been cancelled.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
    </div>
  );
  if (openRestaurant) return (
    <div style={{ color: TEXT }}>
      <Header title={openRestaurant.name} onBack={() => setOpenRestaurant(null)} />
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 140, background: CARD, border: `1px solid ${BORDER}` }}>
        <FoodPhoto category={openRestaurant.foodCategory} alt={openRestaurant.name} className="w-full h-full object-cover" />
      </div>
      {menu.length === 0 ? (
        <div className="px-5 flex flex-col items-center text-center py-10">
          <UtensilsCrossed size={28} color={FAINT} />
          <p className="text-sm font-semibold mt-3">Menu coming soon</p>
          <p className="text-xs mt-1" style={{ color: FAINT }}>This restaurant hasn't added their menu yet — check back soon.</p>
        </div>
      ) : (
      <div className="px-5 flex flex-col gap-2">
        {menu.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs mt-0.5" style={{ color: FAINT }}>{m.price} SAR</p></div>
            {cart[m.id] ? (
              <div className="flex items-center gap-3">
                <button onClick={() => removeItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: BORDER }}><Minus size={12} color={TEXT} /></button>
                <span className="text-sm w-3 text-center">{cart[m.id]}</span>
                <button onClick={() => addItem(m)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={12} color={BG} /></button>
              </div>
            ) : <button onClick={() => addItem(m)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: GOLD, color: BG }}>Add</button>}
          </div>
        ))}
      </div>
      )}
      {cartCount > 0 && <div className="px-5 mt-4"><button onClick={() => setStage("confirmed")} className="w-full rounded-full py-3.5 text-sm font-semibold flex items-center justify-between px-5" style={{ background: GOLD, color: BG }}><span className="flex items-center gap-2"><Bag size={15} /> {cartCount} items</span><span>{cartTotal} SAR</span></button></div>}
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
            <UtensilsCrossed size={13} /> Register restaurant
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
          <button key={r.id} onClick={() => setOpenRestaurant(r)} className="text-left rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
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
function Logistics({ goBack, navigate }) {
  const [pickupAddress, setPickupAddress] = useState(""); const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupContact, setPickupContact] = useState(""); const [dropoffContact, setDropoffContact] = useState("");
  const [size, setSize] = useState("small"); const [stage, setStage] = useState("input");
  const chosen = PARCEL_SIZES.find((s) => s.id === size);
  const can = pickupAddress.trim() && dropoffAddress.trim() && pickupContact.trim() && dropoffContact.trim();
  if (stage === "confirmed") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Pickup requested</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>Driver will contact you on WhatsApp.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
      <button onClick={() => setStage("cancelled")} className="w-full mt-2 rounded-full py-3 text-sm font-semibold" style={{ background: "transparent", color: "#C0755B" }}>Cancel pickup</button>
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
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 130, background: CARD, border: `1px solid ${BORDER}` }}>
        <img src="https://loremflickr.com/500/260/delivery-van,courier/all?lock=51" alt="Logistics" className="w-full h-full object-cover" />
      </div>
      <div className="px-5 mb-4">
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: FAINT }}>Delivery partners</p>
        <div className="flex gap-2 flex-wrap">
          {["Aramex", "SMSA Express", "Zajil", "Barq"].map((p) => (
            <span key={p} className="px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: CARD, border: `1px solid ${BORDER}`, color: MUTE }}>{p}</span>
          ))}
        </div>
      </div>
      <div className="px-5">
        <button onClick={() => navigate("register_logistics")} className="w-full mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
          <span className="flex items-center gap-2 text-sm font-semibold"><Truck size={15} color={GOLD} /> Become a delivery partner</span>
          <ChevronRight size={14} color={GOLD} />
        </button>
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
                <p className="text-sm font-semibold">{s.price} SAR</p>
              </button>
            );
          })}
        </div>
        <button onClick={() => can && setStage("confirmed")} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>Request pickup — {chosen.price} SAR</button>
      </div>
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
  { id: 6, title: "Intercity Driver", company: "SAPTCO", location: "Makkah", pay: "Per-trip + fuel bonus", type: "Flexible", category: "Driving", phone: "0550 000 006", description: "Drive scheduled intercity routes between major Saudi cities." },
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
          <span className="flex items-center gap-2 text-sm font-semibold"><Users size={15} color={GOLD} /> Register a new fleet company</span>
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
function Profile({ goBack, navigate }) {
  const profile = { name: "Muhammad Ilyas", phone: "+966 5X XXX XXXX", email: "muhammad@sayyaradrive.com", city: "Riyadh" };
  return (
    <div style={{ color: TEXT }}>
      <Header title="Profile" onBack={goBack} />
      <div className="px-5 flex flex-col items-center text-center mb-5">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: BORDER, color: GOLD }}>MI</div>
        <h2 className="mt-3 text-base font-semibold">{profile.name}</h2>
        <p className="text-xs flex items-center gap-1 mt-1" style={{ color: MUTE }}><Star size={11} color={GOLD} /> 4.9 · {profile.city}</p>
      </div>
      <div className="px-5 mb-5">
        <div className="rounded-2xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><Phone size={14} color={FAINT} /><span className="text-sm">{profile.phone}</span></div>
          <div className="flex items-center gap-3 py-3"><Mail size={14} color={FAINT} /><span className="text-sm">{profile.email}</span></div>
        </div>
      </div>
      <div className="px-5 mb-5 flex flex-col gap-2">
        <button onClick={() => navigate("driver")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Car size={15} color={GOLD} /> Switch to driver mode</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi SayyaraDrive, I need help with the app.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <span className="flex items-center gap-3 text-sm"><MessageCircle size={15} color="#25D366" /> Contact support</span>
          <ChevronRight size={14} color="#5C736D" />
        </a>
      </div>
      <div className="px-5"><button className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#C0755B" }}><LogOut size={15} /> Log out</button></div>
    </div>
  );
}

/* ---------- ACTIVITY ---------- */
const TYPE_META = { ride: { icon: Car, label: "Ride" }, airport: { icon: Plane, label: "Airport transfer" } };
const TRIPS = [
  { id: 1, type: "ride", date: "Jul 8, 2026", from: "Al Olaya Street", to: "King Fahd Rd", fare: 24 },
  { id: 2, type: "airport", date: "Jul 5, 2026", from: "Home", to: "RUH Airport", fare: 85 },
  { id: 3, type: "ride", date: "Jul 3, 2026", from: "Al Malaz", to: "Panorama Mall", fare: 19 },
  { id: 4, type: "airport", date: "Jun 29, 2026", from: "JED Airport", to: "Al Hamra", fare: 62 },
];
function TripHistory({ goBack }) {
  const totalSpent = TRIPS.reduce((s, t) => s + t.fare, 0);
  return (
    <div style={{ color: TEXT }}>
      <Header title="Activity" onBack={goBack} />
      <div className="px-5 mb-4"><div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}><div><p className="text-xs" style={{ color: FAINT }}>Total spent</p><p className="text-lg font-semibold" style={{ color: GOLD }}>{totalSpent} SAR</p></div><div className="text-right"><p className="text-xs" style={{ color: FAINT }}>Total trips</p><p className="text-lg font-semibold">{TRIPS.length}</p></div></div></div>
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {TRIPS.map((t) => {
          const meta = TYPE_META[t.type]; const Icon = meta.icon;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
              <div className="flex-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{meta.label}</p><p className="text-sm font-semibold">{t.fare} SAR</p></div><p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{t.from} → {t.to}</p><p className="text-[10px] mt-1" style={{ color: FAINT }}>{t.date}</p></div>
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
  const totalEarned = DRIVER_TRIPS.reduce((s, t) => s + t.fare, 0);
  return (
    <div style={{ color: TEXT }}>
      <Header title="Trip history" onBack={goBack} />
      <div className="px-5 mb-4">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div><p className="text-xs" style={{ color: FAINT }}>Total earned</p><p className="text-lg font-semibold" style={{ color: GOLD }}>{totalEarned} SAR</p></div>
          <div className="text-right"><p className="text-xs" style={{ color: FAINT }}>Trips completed</p><p className="text-lg font-semibold">{DRIVER_TRIPS.length}</p></div>
        </div>
      </div>
      <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {DRIVER_TRIPS.map((t) => {
          const meta = TYPE_META[t.type]; const Icon = meta.icon;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,166,83,0.12)" }}><Icon size={17} color={GOLD} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{t.rider}</p><p className="text-sm font-semibold" style={{ color: GREEN }}>+{t.fare} SAR</p></div>
                <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{meta.label} · {t.from} → {t.to}</p>
                <p className="text-[10px] mt-1" style={{ color: FAINT }}>{t.date}</p>
              </div>
            </div>
          );
        })}
      </div>
      {!currentDriver?.profile && (
        <p className="px-5 mt-4 text-[11px] text-center" style={{ color: FAINT }}>Log in to see your real earnings once trips start syncing.</p>
      )}
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

/* ---------- AI ASSISTANT ---------- */
const SYSTEM_PROMPT = `You are the in-app assistant for SayyaraDrive, a Saudi Arabia ride-hailing and mobility super app (like Uber/Careem) offering: city rides, airport transfers, intercity rides, car rentals, a marketplace, food delivery, parcel logistics, a driver jobs portal, and fleet management. Payment is cash-only for now. Driver-rider contact happens over WhatsApp. Be concise, friendly, and helpful — answer support questions, suggest which service fits the user's need, or make simple recommendations (e.g. what to order, which ride type to pick). Keep replies short, 2-4 sentences, suited for a small mobile chat window.`;

function AIAssistant({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your SayyaraDrive assistant. Ask me anything about booking a ride, ordering food, sending a parcel, or anything else in the app." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = [
        { role: "user", content: SYSTEM_PROMPT },
        { role: "assistant", content: "Understood — I'll act as the SayyaraDrive in-app assistant." },
        ...nextMessages,
      ];
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await response.json();
      const reply = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n") || "Sorry, I couldn't process that — try again.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the assistant. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-t-3xl flex flex-col" style={{ background: CARD, border: `1px solid ${BORDER}`, height: "75vh" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(217,166,83,0.15)" }}>
              <Sparkles size={15} color={GOLD} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: TEXT }}>SayyaraDrive Assistant</h2>
          </div>
          <button onClick={onClose}><X size={18} color={MUTE} /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm"
                style={{
                  background: m.role === "user" ? GOLD : BG,
                  color: m.role === "user" ? BG : TEXT,
                  border: m.role === "user" ? "none" : `1px solid ${BORDER}`,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-2.5 text-sm flex items-center gap-1" style={{ background: BG, border: `1px solid ${BORDER}`, color: FAINT }}>
                <Bot size={13} /> Typing…
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-5 pt-2 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about rides, food, jobs…"
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: input.trim() ? GOLD : BORDER }}
          >
            <Send size={16} color={input.trim() ? BG : "#5C736D"} />
          </button>
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
        <p className="text-sm mt-2 mb-6 max-w-xs" style={{ color: MUTE }}>
          Rides, rentals, deliveries, and driver earnings — all in one trusted app, built for the Kingdom.
        </p>

        <div className="flex items-center gap-4 mb-7 text-[11px]" style={{ color: FAINT }}>
          <span className="flex items-center gap-1.5"><Shield size={12} color={GREEN} /> Verified drivers</span>
          <span className="flex items-center gap-1.5"><DollarSign size={12} color={GREEN} /> Cash on delivery</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} color={GREEN} /> All major cities</span>
        </div>

        <button onClick={() => navigate("home")} className="w-full max-w-sm rounded-full py-4 text-sm font-semibold mb-3" style={{ background: GOLD, color: BG, boxShadow: "0 8px 20px rgba(217,166,83,0.3)" }}>
          Continue as passenger
        </button>
        <button onClick={() => navigate("driver_login")} className="w-full max-w-sm rounded-full py-4 text-sm font-semibold mb-4" style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}>
          Driver login / sign up
        </button>
        <p className="text-[10px]" style={{ color: FAINT }}>By continuing, you agree to use SayyaraDrive responsibly and respectfully.</p>
      </div>
    </div>
  );
}

/* ---------- AUTH (SIGN UP / LOGIN) ---------- */
function AuthScreen({ goBack, type, navigate, onLoggedIn }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [iqama, setIqama] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [cityType, setCityType] = useState("inside_city");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isDriver = type === "driver";

  async function handleSignup() {
    setError(""); setLoading(true);
    try {
      if (isDriver) {
        const { data: existingDriver } = await supabase.from("drivers").select("status").eq("iqama_number", iqama).maybeSingle();
        if (existingDriver) {
          if (existingDriver.status === "blocked") {
            setError("This Iqama number belongs to a blocked driver account. Contact support for help.");
          } else {
            setError("An account already exists with this Iqama number. Please log in instead.");
          }
          setLoading(false);
          return;
        }
      }
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      const authUserId = data.user?.id;
      if (isDriver) {
        const { error: insertError } = await supabase.from("drivers").insert({
          auth_user_id: authUserId,
          full_name: fullName,
          mobile_number: mobile,
          iqama_number: iqama,
          vehicle_number: vehicleNumber,
          city_type: cityType,
        });
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from("passengers").insert({
          auth_user_id: authUserId,
          full_name: fullName,
          mobile_number: mobile,
        });
        if (insertError) throw insertError;
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      let profile = null;
      if (isDriver) {
        const { data } = await supabase.from("drivers").select("*").eq("mobile_number", mobile).maybeSingle();
        profile = data;
        if (profile && profile.status === "blocked") {
          setError("This driver account has been blocked. Contact support.");
          setLoading(false);
          return;
        }
      }
      if (onLoggedIn) onLoggedIn({ email, type, profile });
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
          {mode === "login" && isDriver && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Phone size={14} color={GOLD} />
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number (to load your profile)" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
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
                    <option value="intercity" style={{ background: CARD }}>Intercity driver</option>
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
            <MapPin size={14} color={FAINT} /><span className="text-sm">{profile.city_type === "intercity" ? "Intercity driver" : "Inside-city driver"}</span>
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

      <div className="px-5 mb-5">
        <button onClick={() => navigate("driver_trips")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Route size={15} color={GOLD} /> Trip history & earnings</span>
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
function AdminListPage({ goBack, title, table, columns, showDriverActions, deletable, addFields, statusToggle }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [addSubmitting, setAddSubmitting] = useState(false);

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
    loadRows();
  }

  async function unblockDriver(driver) {
    await supabase.from("drivers").update({ status: "active", warning_count: 0 }).eq("id", driver.id);
    loadRows();
  }

  async function toggleVerified(driver) {
    await supabase.from("drivers").update({ verified: !driver.verified }).eq("id", driver.id);
    loadRows();
  }

  async function deleteRow(row) {
    await supabase.from(table).delete().eq("id", row.id);
    loadRows();
  }

  async function toggleSold(row) {
    await supabase.from(table).update({ status: row.status === "sold" ? "active" : "sold" }).eq("id", row.id);
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
      <Header title={title} onBack={goBack} right={addFields ? (
        <button onClick={() => setShowAddForm(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={18} color={BG} /></button>
      ) : null} />
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
        {loading && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>Loading…</p>}
        {error && <p className="text-sm text-center mt-6" style={{ color: "#C0755B" }}>{error}</p>}
        {!loading && displayRows.length === 0 && <p className="text-sm text-center mt-6" style={{ color: FAINT }}>No records here.</p>}
        <div className="flex flex-col gap-2">
          {displayRows.map((r) => {
            const statusColor = r.status === "blocked" ? "#C0755B" : r.status === "warned" ? GOLD : GREEN;
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
                {statusToggle && (
                  <button onClick={() => toggleSold(r)} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: r.status === "sold" ? "rgba(91,143,212,0.15)" : "rgba(192,117,91,0.12)", color: r.status === "sold" ? GREEN : "#C0755B" }}>
                    {r.status === "sold" ? "Mark as available again" : "Mark as sold"}
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
    </div>
  );
}

/* ---------- ADMIN OVERVIEW (sidebar-style dashboard) ---------- */
const ADMIN_SECTIONS = [
  { id: "drivers", label: "Drivers", table: "drivers", icon: Car },
  { id: "passengers", label: "Passengers", table: "passengers", icon: Users },
  { id: "companies", label: "Companies", table: "companies", icon: Briefcase },
  { id: "marketplace_listings", label: "Marketplace", table: "marketplace_listings", icon: ShoppingBag },
  { id: "restaurants", label: "Restaurants", table: "restaurants", icon: UtensilsCrossed },
  { id: "jobs", label: "Jobs", table: "jobs", icon: Briefcase },
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

      <div className="px-5 sm:px-8 mb-6">
        <p className="text-sm font-semibold mb-1">Platform overview</p>
        <p className="text-[11px]" style={{ color: FAINT }}>Live stats across all modules</p>
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
const TAB_SCREENS = ["home", "activity", "wallet", "profile"];

export default function SayyaraDriveApp() {
  const isAdminLink = typeof window !== "undefined" && window.location.search.includes("owner2026");
  const [history, setHistory] = useState([isAdminLink ? "admin_login" : "welcome"]);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [lang, setLang] = useState("en");
  const screen = history[history.length - 1];
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
            }
          }
        }
      } catch (e) { /* no active session, stay logged out */ }
      setSessionChecked(true);
    }
    restoreSession();
  }, []);

  function driverLogout() {
    supabase.auth.signOut();
    setCurrentDriver(null);
    setHistory(["welcome"]);
  }

  function navigate(next) {
    if (TAB_SCREENS.includes(next)) setHistory([next]);
    else setHistory((h) => [...h, next]);
  }
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : ["home"]));
  }

  const isTab = TAB_SCREENS.includes(screen);

  const SCREEN_MAP = {
    welcome: <WelcomeScreen navigate={navigate} />,
    home: <Home navigate={navigate} lang={lang} setLang={setLang} t={t} />,
    ride: <BookRide goBack={goBack} />,
    driver: <DriverApp goBack={goBack} navigate={navigate} currentDriver={currentDriver} />,
    driver_profile: <DriverProfile goBack={goBack} navigate={navigate} currentDriver={currentDriver} onLogout={driverLogout} />,
    driver_trips: <DriverTripHistory goBack={goBack} currentDriver={currentDriver} />,
    airport: <BookRide goBack={goBack} />,
    intercity: <BookRide goBack={goBack} />,
    rentals: <CarRental goBack={goBack} navigate={navigate} />,
    market: <Marketplace goBack={goBack} navigate={navigate} />,
    food: <FoodDelivery goBack={goBack} navigate={navigate} />,
    logistics: <Logistics goBack={goBack} navigate={navigate} />,
    jobs: <JobsPortal goBack={goBack} navigate={navigate} />,
    fleet: <FleetManagement goBack={goBack} navigate={navigate} />,
    profile: <Profile goBack={goBack} navigate={navigate} />,
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
    passenger_login: <AuthScreen goBack={goBack} type="passenger" navigate={navigate} onLoggedIn={setCurrentDriver} />,
    admin_login: <AdminLogin goBack={goBack} navigate={navigate} onLoggedIn={setCurrentAdmin} />,
    admin_drivers: <AdminListPage goBack={goBack} title="Drivers" table="drivers" showDriverActions columns={[{key:"full_name",label:"Name"},{key:"iqama_number",label:"Iqama"},{key:"vehicle_number",label:"Vehicle"},{key:"mobile_number",label:"Mobile"},{key:"city_type",label:"City type"}]} />,
    admin_passengers: <AdminListPage goBack={goBack} title="Passengers" table="passengers" columns={[{key:"full_name",label:"Name"},{key:"mobile_number",label:"Mobile"}]} />,
    admin_companies: <AdminListPage goBack={goBack} title="Companies" table="companies" columns={[{key:"name",label:"Name"},{key:"contact_name",label:"Contact"},{key:"mobile_number",label:"Mobile"},{key:"fleet_size",label:"Fleet size"}]} />,
    admin_marketplace_listings: <AdminListPage goBack={goBack} title="Marketplace" table="marketplace_listings" deletable statusToggle columns={[{key:"title",label:"Title"},{key:"seller_name",label:"Seller"},{key:"price",label:"Price"},{key:"category",label:"Category"},{key:"location",label:"Location"}]} addFields={[{key:"title",label:"Title",required:true},{key:"price",label:"Price (SAR)",required:true},{key:"category",label:"Category",type:"select",options:["Cars","Electronics","Furniture","Fashion","Spare parts"],required:true},{key:"location",label:"City",required:true},{key:"seller_name",label:"Seller name"},{key:"image_url",label:"Image URL (optional)"}]} />,
    admin_restaurants: <AdminListPage goBack={goBack} title="Restaurants" table="restaurants" deletable columns={[{key:"name",label:"Name"},{key:"cuisine",label:"Cuisine"},{key:"city",label:"City"},{key:"hours",label:"Hours"}]} addFields={[{key:"name",label:"Restaurant name",required:true},{key:"cuisine",label:"Cuisine (e.g. Arabic, Fast food)",required:true},{key:"city",label:"City",required:true},{key:"hours",label:"Hours (e.g. 10:00–23:00)"},{key:"food_category",label:"Photo type",type:"select",options:["rice","burger","dessert","pasta","butter-chicken"],required:true}]} />,
    admin_jobs: <AdminListPage goBack={goBack} title="Jobs" table="jobs" deletable columns={[{key:"title",label:"Title"},{key:"company",label:"Company"},{key:"location",label:"Location"},{key:"pay",label:"Pay"}]} addFields={[{key:"title",label:"Job title",required:true},{key:"company",label:"Company name",required:true},{key:"location",label:"City",required:true},{key:"pay",label:"Pay",required:true},{key:"job_type",label:"Type",type:"select",options:["Full-time","Part-time","Flexible","Freelance"]},{key:"phone",label:"Contact phone"},{key:"description",label:"Description"}]} />,
    admin_food_orders: <AdminListPage goBack={goBack} title="Food Delivery" table="food_orders" columns={[{key:"restaurant_name",label:"Restaurant"},{key:"customer_name",label:"Customer"},{key:"total",label:"Total"}]} />,
    admin_logistics_parcels: <AdminListPage goBack={goBack} title="Logistics" table="logistics_parcels" columns={[{key:"sender_name",label:"Sender"},{key:"pickup_address",label:"Pickup"},{key:"dropoff_address",label:"Dropoff"}]} />,
    admin_fleet_vehicles: <AdminListPage goBack={goBack} title="Fleet" table="fleet_vehicles" columns={[{key:"plate_number",label:"Plate"},{key:"model",label:"Model"},{key:"driver_name",label:"Driver"}]} />,
    admin_violations: <AdminListPage goBack={goBack} title="Violations" table="violations" columns={[{key:"reason",label:"Reason"},{key:"driver_id",label:"Driver ID"}]} />,
  };

  return (
    <div className="min-h-screen w-full flex justify-center relative" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
        <div className={`w-full relative h-full ${screen === "admin" ? "max-w-6xl" : "max-w-md lg:max-w-5xl"}`}>
          <SkylineBackground opacity={0.25} />
        </div>
      </div>
      <div className={`w-full relative z-10 ${screen === "admin" ? "max-w-6xl" : "max-w-md lg:max-w-5xl"}`} style={{ paddingBottom: isTab ? 70 : 20 }}>
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
