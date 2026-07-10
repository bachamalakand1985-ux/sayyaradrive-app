import React, { useState, useEffect, useRef } from "react";
import {
  Car, Plane, MapPinned, Key, ShoppingBag, UtensilsCrossed, Truck,
  Briefcase, Users, Bell, Menu, ChevronRight, ArrowLeft, MapPin, Circle,
  Square, Navigation, Zap, Users2, CheckCircle2, PlaneLanding, PlaneTakeoff,
  Calendar, Clock, ArrowRightLeft, Route, Search,
  Plus, Tag, X, Star, ShoppingBag as Bag, Minus,
  Package, Phone, DollarSign,
  Mail, LogOut, Power, Sparkles, Send, Bot, Shield, User
} from "lucide-react";

/* ---------- shared tokens ---------- */
const BG = "#0B1917", CARD = "#14262A", BORDER = "#1E3630";
const GOLD = "#D4A64A", GREEN = "#6FA98C", TEXT = "#F2EFE9";
const MUTE = "#9BB3AD", FAINT = "#7C948E";
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
  { id: "ride", label: "Ride", sub: "City rides", subKey: "cityRides", icon: Car },
  { id: "airport", label: "Airport", sub: "Transfers", subKey: "transfers", icon: Plane },
  { id: "intercity", label: "Intercity", sub: "City to city", subKey: "cityToCity", icon: MapPinned },
  { id: "rentals", label: "Rentals", sub: "Rent a car", subKey: "rentACar", icon: Key },
  { id: "market", label: "Marketplace", sub: "Buy & sell", subKey: "buySell", icon: ShoppingBag },
  { id: "food", label: "Food", sub: "Delivery", subKey: "delivery", icon: UtensilsCrossed },
  { id: "logistics", label: "Logistics", sub: "Send parcels", subKey: "sendParcels", icon: Truck },
  { id: "jobs", label: "Jobs", sub: "Drive & earn", subKey: "driveEarn", icon: Briefcase },
  { id: "fleet", label: "Fleet", sub: "Manage cars", subKey: "manageCars", icon: Users },
];

function Home({ navigate, lang, setLang, t }) {
  return (
    <div className="pb-4" style={{ color: TEXT }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
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
      <div className="px-5 pt-4 pb-6">
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>
          سيارة<span style={{ color: GOLD }}>Drive</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: MUTE }}>{t("tagline")}</p>
      </div>
      <div className="px-5 mb-6">
        <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: MUTE }}>{t("whereTo")}</p>
              <p className="text-lg font-semibold mt-1">{t("bookRideNow")}</p>
            </div>
            <button onClick={() => navigate("ride")} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}>
              <ChevronRight size={20} color={BG} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
            </button>
          </div>
        </div>
      </div>
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t("services")}</h2>
          <span className="text-xs" style={{ color: GREEN }}>{SERVICES.length} {t("available")}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => navigate(s.id)} className="flex flex-col items-start gap-2 rounded-xl p-3 text-left active:scale-95" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,166,74,0.12)" }}><Icon size={18} color={GOLD} /></div>
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
function RideBooking({ goBack }) {
  const [pickup, setPickup] = useState("Current location");
  const [dropoff, setDropoff] = useState("");
  const [stage, setStage] = useState("input");
  const [selectedType, setSelectedType] = useState("economy");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const chosen = RIDE_TYPES.find((r) => r.id === selectedType);

  function useMyLocation() {
    detectLocation({
      onStart: () => { setLocating(true); setLocError(""); },
      onSuccess: ({ label }) => { setPickup(label); setLocating(false); },
      onError: (msg) => { setLocating(false); setLocError(msg); },
    });
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Book a ride" onBack={goBack} />
      <div className="mx-5 rounded-2xl relative overflow-hidden flex items-center justify-center" style={{ height: 180, background: CARD, border: `1px solid ${BORDER}` }}>
        <Navigation size={20} color={GOLD} />
      </div>
      <div className="px-5 mt-4">
        <div className="rounded-2xl px-4 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Circle size={10} color={GREEN} fill={GREEN} />
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
          <div className="flex items-center gap-3 py-3">
            <Square size={9} color={GOLD} fill={GOLD} />
            <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Where to?" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
          </div>
        </div>
        <button onClick={useMyLocation} disabled={locating} className="w-full mt-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold" style={{ background: "rgba(212,166,74,0.12)", color: GOLD }}>
          <Navigation size={13} className={locating ? "animate-pulse" : ""} /> {locating ? "Detecting location…" : "Use my current location"}
        </button>
        {locError && <p className="text-[11px] text-center mt-2" style={{ color: "#C0755B" }}>{locError}</p>}
        {stage === "input" && (
          <button onClick={() => dropoff.trim() && setStage("choose")} disabled={!dropoff.trim()} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: dropoff.trim() ? GOLD : BORDER, color: dropoff.trim() ? BG : "#5C736D" }}>
            Find rides
          </button>
        )}
      </div>
      {stage === "choose" && (
        <div className="px-5 mt-5">
          <div className="flex flex-col gap-2">
            {RIDE_TYPES.map((r) => {
              const Icon = r.icon, isSel = selectedType === r.id;
              return (
                <button key={r.id} onClick={() => setSelectedType(r.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,166,74,0.12)" }}><Icon size={17} color={GOLD} /></div>
                    <div className="text-left"><p className="text-sm font-semibold">{r.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{r.eta} away</p></div>
                  </div>
                  <p className="text-sm font-semibold">{r.price} SAR</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosen.label} — {chosen.price} SAR</button>
        </div>
      )}
      {stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} />
          <h2 className="mt-4 text-lg font-semibold">Ride confirmed</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Looking for a nearby driver. You'll be connected by WhatsApp.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}
    </div>
  );
}

/* ---------- DRIVER APP ---------- */
const INCOMING_REQUEST = { rider: "Faisal A.", rating: 4.8, pickup: "Al Olaya Street, Riyadh", dropoff: "King Khalid International Airport", distance: "1.2 km away", fare: 42 };
function DriverApp({ goBack }) {
  const mapRef = useRef(null);
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
        setMapStatus("ready");
        window.addEventListener("resize", () => map.getViewPort().resize());
      } catch (e) { setMapStatus("error"); }
    }
    init();
  }, []);

  function goOnline() { setOnline(true); setTimeout(() => setRequest(INCOMING_REQUEST), 1500); }
  function goOffline() { setOnline(false); setRequest(null); setTripState("idle"); }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Driver" onBack={goBack} right={
        <button onClick={online ? goOffline : goOnline} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: online ? GREEN : BORDER, color: online ? BG : MUTE }}>
          <Power size={13} /> {online ? "Online" : "Go online"}
        </button>
      } />
      <div className="mx-5 rounded-2xl overflow-hidden relative" style={{ height: 220, background: CARD, border: `1px solid ${BORDER}` }}>
        <div ref={mapRef} className="w-full h-full" />
        {mapStatus === "loading" && <div className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}><Navigation size={20} color={GOLD} /></div>}
        {mapStatus === "error" && <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: CARD }}><p className="text-[11px]" style={{ color: FAINT }}>Map blocked in this preview — will work on sayyaradrive.com</p></div>}
      </div>
      <p className="px-5 mt-2 text-[11px] flex items-center gap-1" style={{ color: FAINT }}><Navigation size={11} color={GREEN} /> {locLabel}</p>
      {locError && <p className="px-5 mt-1 text-[11px]" style={{ color: "#C0755B" }}>{locError}</p>}
      {online && !request && tripState === "idle" && <p className="text-sm text-center mt-6" style={{ color: MUTE }}>You're online — waiting for requests…</p>}
      {!online && <p className="text-sm text-center mt-6" style={{ color: FAINT }}>Go online to start receiving ride requests.</p>}
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

/* ---------- AIRPORT ---------- */
const AIRPORTS = ["King Khalid International (RUH)", "King Abdulaziz International (JED)", "King Fahd International (DMM)"];
const AIRPORT_VEHICLES = [{ id: "sedan", label: "Sedan", seats: "1-3", bags: 2, price: 85 }, { id: "suv", label: "SUV", seats: "1-5", bags: 4, price: 130 }, { id: "van", label: "Van", seats: "1-8", bags: 8, price: 190 }];
const AIRPORT_CITY = { [AIRPORTS[0]]: "Riyadh", [AIRPORTS[1]]: "Jeddah", [AIRPORTS[2]]: "Dammam" };
function AirportTransfer({ goBack }) {
  const [direction, setDirection] = useState("to");
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const [district, setDistrict] = useState(SAUDI_CITIES[AIRPORT_CITY[AIRPORTS[0]]][0]);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [stage, setStage] = useState("input");
  const [vehicle, setVehicle] = useState("sedan");
  const chosen = AIRPORT_VEHICLES.find((v) => v.id === vehicle);
  const can = date && time;
  const cityForAirport = AIRPORT_CITY[airport];

  function useMyLocation() {
    detectLocation({
      onStart: () => { setLocating(true); setLocError(""); },
      onSuccess: ({ label }) => { setAddress(label); setLocating(false); },
      onError: (msg) => { setLocating(false); setLocError(msg); },
    });
  }

  return (
    <div style={{ color: TEXT }}>
      <Header title="Airport transfer" onBack={goBack} />
      {stage === "input" && (
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
          <button onClick={useMyLocation} disabled={locating} className="w-full mb-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold" style={{ background: "rgba(212,166,74,0.12)", color: GOLD }}>
            <Navigation size={13} className={locating ? "animate-pulse" : ""} /> {locating ? "Detecting location…" : "Use my current location"}
          </button>
          {locError && <p className="text-[11px] text-center mb-3" style={{ color: "#C0755B" }}>{locError}</p>}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Calendar size={14} color={GOLD} /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none text-xs w-full" style={{ color: TEXT }} /></div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Clock size={14} color={GOLD} /><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent outline-none text-xs w-full" style={{ color: TEXT }} /></div>
          </div>
          <button onClick={() => can && setStage("choose")} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>See vehicles</button>
        </div>
      )}
      {stage === "choose" && (
        <div className="px-5">
          <div className="flex flex-col gap-2">
            {AIRPORT_VEHICLES.map((v) => {
              const isSel = vehicle === v.id;
              return (
                <button key={v.id} onClick={() => setVehicle(v.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="text-left"><p className="text-sm font-semibold">{v.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{v.seats} seats · {v.bags} bags</p></div>
                  <p className="text-sm font-semibold">{v.price} SAR</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosen.label} — {chosen.price} SAR</button>
        </div>
      )}
      {stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Transfer booked</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Driver details shared via WhatsApp.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}
    </div>
  );
}

/* ---------- INTERCITY ---------- */
const CITIES = SAUDI_CITY_LIST;
const INTERCITY_OPTIONS = [{ id: "shared", label: "Shared seat", sub: "Share with others", price: 120 }, { id: "private", label: "Private car", sub: "Full car", price: 480 }, { id: "private_suv", label: "Private SUV", sub: "Full SUV", price: 650 }];
function IntercityRide({ goBack }) {
  const [from, setFrom] = useState("Riyadh"); const [to, setTo] = useState("Jeddah");
  const [date, setDate] = useState(""); const [stage, setStage] = useState("input");
  const [option, setOption] = useState("shared");
  const chosen = INTERCITY_OPTIONS.find((o) => o.id === option);
  const can = from !== to && date;
  return (
    <div style={{ color: TEXT }}>
      <Header title="Intercity ride" onBack={goBack} />
      {stage === "input" && (
        <div className="px-5">
          <div className="rounded-2xl px-4 py-2 mb-4 relative" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><MapPin size={14} color={GREEN} /><select value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <div className="flex items-center gap-3 py-3"><MapPin size={14} color={GOLD} /><select value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>{CITIES.map((c) => <option key={c} style={{ background: CARD }}>{c}</option>)}</select></div>
            <button onClick={() => { setFrom(to); setTo(from); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BORDER }}><ArrowRightLeft size={14} color={GOLD} /></button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Calendar size={15} color={GOLD} /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          <button onClick={() => can && setStage("choose")} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>See options</button>
        </div>
      )}
      {stage === "choose" && (
        <div className="px-5">
          <div className="rounded-xl px-4 py-3 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}><p className="text-sm font-semibold">{from} → {to}</p><p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: FAINT }}><Route size={11} /> {date}</p></div>
          <div className="flex flex-col gap-2">
            {INTERCITY_OPTIONS.map((o) => {
              const isSel = option === o.id;
              return (
                <button key={o.id} onClick={() => setOption(o.id)} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="text-left"><p className="text-sm font-semibold">{o.label}</p><p className="text-[11px]" style={{ color: FAINT }}>{o.sub}</p></div>
                  <p className="text-sm font-semibold">{o.price} SAR</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStage("confirmed")} className="w-full mt-5 rounded-full py-3 text-sm font-semibold" style={{ background: GOLD, color: BG }}>Book {chosen.label} — {chosen.price} SAR</button>
        </div>
      )}
      {stage === "confirmed" && (
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Trip booked</h2>
          <p className="mt-1 text-sm" style={{ color: MUTE }}>Driver details on WhatsApp before departure.</p>
          <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
        </div>
      )}
    </div>
  );
}

/* ---------- CAR RENTAL ---------- */
const CARS = [{ id: "eco", label: "Economy", model: "Hyundai Accent", price: 95 }, { id: "sedan", label: "Sedan", model: "Toyota Camry", price: 145 }, { id: "suv", label: "SUV", model: "Toyota Fortuner", price: 220 }, { id: "luxury", label: "Luxury", model: "Lexus ES", price: 380 }];
function CarRental({ goBack }) {
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
          <div className="flex flex-col gap-2">
            {CARS.map((c) => {
              const isSel = carId === c.id;
              return (
                <button key={c.id} onClick={() => setCarId(c.id)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: isSel ? BORDER : CARD, border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,166,74,0.12)" }}><Car size={20} color={GOLD} /></div>
                  <div className="flex-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.label}</p><p className="text-sm font-semibold">{c.price} SAR/day</p></div><p className="text-[11px]" style={{ color: FAINT }}>{c.model}</p></div>
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
        </div>
      )}
    </div>
  );
}

/* ---------- MARKETPLACE ---------- */
const CATEGORIES = ["All", "Cars", "Electronics", "Furniture", "Fashion", "Spare parts"];
const LISTINGS = [
  { id: 1, title: "Toyota Camry 2021", price: 62000, category: "Cars", location: "Riyadh", tag: "Featured" },
  { id: 2, title: "iPhone 15 Pro, 256GB", price: 3400, category: "Electronics", location: "Jeddah", tag: null },
  { id: 3, title: "3-seat sofa, grey", price: 950, category: "Furniture", location: "Dammam", tag: null },
  { id: 4, title: "Nike Air Max, size 43", price: 220, category: "Fashion", location: "Riyadh", tag: null },
  { id: 5, title: "Car tires set (4)", price: 800, category: "Spare parts", location: "Khobar", tag: "New" },
  { id: 6, title: "Hyundai Elantra 2020", price: 41000, category: "Cars", location: "Makkah", tag: null },
  { id: 7, title: "Samsung 55\" Smart TV", price: 1600, category: "Electronics", location: "Madinah", tag: "New" },
  { id: 8, title: "Dining table + 6 chairs", price: 1200, category: "Furniture", location: "Taif", tag: null },
  { id: 9, title: "Men's Thobe, size L", price: 90, category: "Fashion", location: "Abha", tag: null },
  { id: 10, title: "Car battery, 70Ah", price: 260, category: "Spare parts", location: "Jubail", tag: null },
  { id: 11, title: "GMC Yukon 2019", price: 118000, category: "Cars", location: "Dammam", tag: "Featured" },
  { id: 12, title: "MacBook Air M2", price: 4200, category: "Electronics", location: "Riyadh", tag: null },
];
function Marketplace({ goBack }) {
  const [category, setCategory] = useState("All"); const [query, setQuery] = useState("");
  const filtered = LISTINGS.filter((l) => (category === "All" || l.category === category) && l.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ color: TEXT }}>
      <Header title="Marketplace" onBack={goBack} right={<button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: GOLD }}><Plus size={18} color={BG} /></button>} />
      <div className="px-5 mb-3"><div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}><Search size={15} color={FAINT} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div></div>
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((c) => <button key={c} onClick={() => setCategory(c)} className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0" style={{ background: category === c ? GOLD : CARD, color: category === c ? BG : MUTE, border: category === c ? "none" : `1px solid ${BORDER}` }}>{c}</button>)}
      </div>
      <div className="px-5 grid grid-cols-2 gap-3">
        {filtered.map((l) => (
          <div key={l.id} className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="h-24 flex items-center justify-center relative" style={{ background: BORDER }}><Tag size={20} color="#3F5750" />{l.tag && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: GOLD, color: BG }}>{l.tag}</span>}</div>
            <div className="p-2.5"><p className="text-xs font-semibold leading-tight">{l.title}</p><p className="text-sm font-semibold mt-1" style={{ color: GOLD }}>{l.price.toLocaleString()} SAR</p><p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: FAINT }}><MapPin size={9} /> {l.location}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- FOOD DELIVERY ---------- */
const RESTAURANTS = [
  { id: 1, name: "Najd Kitchen", cuisine: "Arabic", rating: 4.7, eta: "25-35 min" },
  { id: 2, name: "Burger Point", cuisine: "Fast food", rating: 4.4, eta: "15-25 min" },
  { id: 3, name: "Green Bowl", cuisine: "Healthy", rating: 4.8, eta: "20-30 min" },
  { id: 4, name: "Sweet Dates", cuisine: "Desserts", rating: 4.6, eta: "20-30 min" },
  { id: 5, name: "Qahwa House", cuisine: "Cafe", rating: 4.5, eta: "10-20 min" },
  { id: 6, name: "Al Baik Express", cuisine: "Fast food", rating: 4.9, eta: "15-20 min" },
  { id: 7, name: "Mandi House", cuisine: "Arabic", rating: 4.7, eta: "30-40 min" },
];
const MENU = {
  1: [{ id: "m1", name: "Kabsa Chicken", price: 42 }, { id: "m2", name: "Mandi Lamb", price: 58 }, { id: "m3", name: "Grilled Mixed Platter", price: 65 }],
  2: [{ id: "m4", name: "Classic Beef Burger", price: 28 }, { id: "m5", name: "Fries", price: 12 }, { id: "m6", name: "Chicken Crispy Burger", price: 26 }],
  3: [{ id: "m7", name: "Grilled Chicken Bowl", price: 34 }, { id: "m8", name: "Quinoa Salad", price: 30 }],
  4: [{ id: "m9", name: "Kunafa Slice", price: 18 }, { id: "m10", name: "Date Cake", price: 15 }],
  5: [{ id: "m11", name: "Arabic Coffee (pot)", price: 20 }, { id: "m12", name: "Cardamom Latte", price: 16 }],
  6: [{ id: "m13", name: "Broasted Chicken Meal", price: 24 }, { id: "m14", name: "Garlic Sauce Extra", price: 5 }],
  7: [{ id: "m15", name: "Mandi Chicken", price: 45 }, { id: "m16", name: "Mandi Lamb (large)", price: 78 }],
};
function FoodDelivery({ goBack }) {
  const [openRestaurant, setOpenRestaurant] = useState(null);
  const [cart, setCart] = useState({}); const [stage, setStage] = useState("browse");
  function addItem(item) { setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 })); }
  function removeItem(item) { setCart((c) => { const n = { ...c }; if (n[item.id] > 1) n[item.id]--; else delete n[item.id]; return n; }); }
  const menu = openRestaurant ? MENU[openRestaurant.id] : [];
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menu.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0);

  if (stage === "confirmed") return (
    <div className="px-5 pt-20 flex flex-col items-center text-center" style={{ color: TEXT }}>
      <CheckCircle2 size={44} color={GREEN} /><h2 className="mt-4 text-lg font-semibold">Order placed</h2>
      <p className="mt-1 text-sm" style={{ color: MUTE }}>{openRestaurant.name} is preparing your order.</p>
      <button onClick={goBack} className="w-full mt-6 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Back home</button>
    </div>
  );
  if (openRestaurant) return (
    <div style={{ color: TEXT }}>
      <Header title={openRestaurant.name} onBack={() => setOpenRestaurant(null)} />
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
      {cartCount > 0 && <div className="px-5 mt-4"><button onClick={() => setStage("confirmed")} className="w-full rounded-full py-3.5 text-sm font-semibold flex items-center justify-between px-5" style={{ background: GOLD, color: BG }}><span className="flex items-center gap-2"><Bag size={15} /> {cartCount} items</span><span>{cartTotal} SAR</span></button></div>}
    </div>
  );
  return (
    <div style={{ color: TEXT }}>
      <Header title="Food delivery" onBack={goBack} />
      <div className="px-5 flex flex-col gap-2">
        {RESTAURANTS.map((r) => (
          <button key={r.id} onClick={() => setOpenRestaurant(r)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(212,166,74,0.12)" }}><Bag size={18} color={GOLD} /></div>
            <div className="flex-1"><p className="text-sm font-semibold">{r.name}</p><p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{r.cuisine}</p><div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: FAINT }}><span className="flex items-center gap-1"><Star size={10} color={GOLD} /> {r.rating}</span><span className="flex items-center gap-1"><Clock size={10} /> {r.eta}</span></div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- LOGISTICS ---------- */
const PARCEL_SIZES = [{ id: "small", label: "Small", sub: "Up to 5kg", price: 20 }, { id: "medium", label: "Medium", sub: "Up to 20kg", price: 40 }, { id: "large", label: "Large", sub: "Needs a van", price: 90 }];
function Logistics({ goBack }) {
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
    </div>
  );
  return (
    <div style={{ color: TEXT }}>
      <Header title="Send a parcel" onBack={goBack} />
      <div className="px-5">
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
  { id: 1, title: "Ride-hailing Driver", location: "Riyadh", pay: "Up to 8,000 SAR/mo" },
  { id: 2, title: "Food Delivery Rider", location: "Jeddah", pay: "Per-order + bonuses" },
  { id: 3, title: "Customer Support Agent", location: "Riyadh", pay: "5,500 SAR/mo" },
  { id: 4, title: "Airport Transfer Driver", location: "Dammam", pay: "Up to 9,500 SAR/mo" },
  { id: 5, title: "Fleet Operations Coordinator", location: "Riyadh", pay: "7,000 SAR/mo" },
  { id: 6, title: "Intercity Driver", location: "Makkah", pay: "Per-trip + fuel bonus" },
  { id: 7, title: "Warehouse Logistics Staff", location: "Jubail", pay: "6,000 SAR/mo" },
];
function JobsPortal({ goBack }) {
  const [applyJob, setApplyJob] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [submitted, setSubmitted] = useState(false);
  const can = form.name.trim() && form.phone.trim() && form.city.trim();
  return (
    <div style={{ color: TEXT }}>
      <Header title="Jobs — Drive & earn" onBack={goBack} />
      <div className="px-5 flex flex-col gap-2">
        {JOBS.map((j) => (
          <div key={j.id} className="rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold">{j.title}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px]" style={{ color: FAINT }}><span className="flex items-center gap-1"><MapPin size={10} /> {j.location}</span><span>{j.pay}</span></div>
            <button onClick={() => setApplyJob(j)} className="w-full mt-3 rounded-full py-2 text-xs font-semibold" style={{ background: GOLD, color: BG }}>Apply now</button>
          </div>
        ))}
      </div>
      {applyJob && (
        <div className="fixed inset-0 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            {!submitted ? (
              <>
                <div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold">Apply — {applyJob.title}</h2><button onClick={() => setApplyJob(null)}><X size={18} color={MUTE} /></button></div>
                <div className="flex flex-col gap-3">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (WhatsApp)" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }} />
                  <button onClick={() => can && setSubmitted(true)} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>Submit application</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <CheckCircle2 size={40} color={GREEN} /><h2 className="mt-3 text-base font-semibold">Application sent</h2>
                <button onClick={() => { setApplyJob(null); setSubmitted(false); setForm({ name: "", phone: "", city: "" }); }} className="w-full mt-4 rounded-full py-3 text-sm font-semibold" style={{ background: BORDER, color: TEXT }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- FLEET ---------- */
const STATUS_META = { active: { label: "On trip", color: GREEN }, idle: { label: "Idle", color: GOLD }, maintenance: { label: "Maintenance", color: "#C0755B" } };
const INITIAL_FLEET = [
  { id: 1, plate: "RUH 4021", model: "Toyota Camry", driver: "Faisal A.", status: "active" },
  { id: 2, plate: "RUH 7788", model: "Hyundai Accent", driver: "Omar K.", status: "idle" },
  { id: 3, plate: "JED 3390", model: "Toyota Fortuner", driver: "Sami R.", status: "maintenance" },
  { id: 4, plate: "DMM 1156", model: "Lexus ES", driver: "Hussain M.", status: "active" },
  { id: 5, plate: "RUH 9021", model: "Toyota Camry", driver: "Unassigned", status: "idle" },
  { id: 6, plate: "MKH 2287", model: "GMC Yukon", driver: "Bandar S.", status: "active" },
];
function FleetManagement({ goBack }) {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  function cycleStatus(id) { const order = ["idle", "active", "maintenance"]; setFleet((f) => f.map((c) => c.id === id ? { ...c, status: order[(order.indexOf(c.status) + 1) % order.length] } : c)); }
  return (
    <div style={{ color: TEXT }}>
      <Header title="Fleet" onBack={goBack} />
      <div className="px-5 flex flex-col gap-2">
        {fleet.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(212,166,74,0.12)" }}><Car size={19} color={GOLD} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.plate}</p><button onClick={() => cycleStatus(c.id)} className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</button></div>
                <p className="text-[11px]" style={{ color: FAINT }}>{c.model} · {c.driver}</p>
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
        <button onClick={() => navigate("admin")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Shield size={15} color={GOLD} /> Admin dashboard</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
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
      <div className="px-5 flex flex-col gap-2">
        {TRIPS.map((t) => {
          const meta = TYPE_META[t.type]; const Icon = meta.icon;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(212,166,74,0.12)" }}><Icon size={17} color={GOLD} /></div>
              <div className="flex-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{meta.label}</p><p className="text-sm font-semibold">{t.fare} SAR</p></div><p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{t.from} → {t.to}</p><p className="text-[10px] mt-1" style={{ color: FAINT }}>{t.date}</p></div>
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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: apiMessages,
        }),
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(212,166,74,0.15)" }}>
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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center py-3 px-5" style={{ background: "#0F211E", borderTop: `1px solid ${BORDER}` }}>
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => navigate(tab.id)} className="flex flex-col items-center gap-1" style={{ color: screen === tab.id ? GOLD : "#6C847E" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: screen === tab.id ? GOLD : "transparent" }} />
          <span className="text-[10px] font-medium">{t ? t(tab.key) : tab.key}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- ADMIN DASHBOARD ---------- */
const ADMIN_STATS = [
  { label: "Total rides today", value: "312", change: "+8%" },
  { label: "Active drivers", value: "48", change: "+3" },
  { label: "Revenue today", value: "24,680 SAR", change: "+12%" },
  { label: "Pending applications", value: "9", change: "" },
];

const ADMIN_RECENT_RIDES = [
  { id: "R-4821", rider: "Faisal A.", driver: "Omar K.", type: "Ride", fare: 24, status: "Completed" },
  { id: "R-4820", rider: "Sara M.", driver: "Hussain M.", type: "Airport", fare: 85, status: "In progress" },
  { id: "R-4819", rider: "Ahmed T.", driver: "Sami R.", type: "Intercity", fare: 480, status: "Completed" },
  { id: "R-4818", rider: "Nourah S.", driver: "Unassigned", type: "Ride", fare: 19, status: "Cancelled" },
  { id: "R-4817", rider: "Khalid B.", driver: "Faisal A.", type: "Food", fare: 58, status: "Completed" },
];

const ADMIN_DRIVERS = [
  { name: "Faisal A.", status: "active", rides: 142, rating: 4.9 },
  { name: "Omar K.", status: "idle", rides: 98, rating: 4.7 },
  { name: "Sami R.", status: "maintenance", rides: 210, rating: 4.8 },
  { name: "Hussain M.", status: "active", rides: 65, rating: 4.6 },
];

const ADMIN_APPLICATIONS = [
  { name: "Yousef A.", role: "Driver", city: "Riyadh", date: "Jul 9" },
  { name: "Lama K.", role: "Support Agent", city: "Jeddah", date: "Jul 8" },
  { name: "Bandar S.", role: "Driver", city: "Dammam", date: "Jul 8" },
];

function AdminDashboard({ goBack }) {
  const [tab, setTab] = useState("overview");
  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "rides", label: "Rides" },
    { id: "drivers", label: "Drivers" },
    { id: "applications", label: "Applications" },
  ];

  return (
    <div style={{ color: TEXT }}>
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: CARD }}>
            <ArrowLeft size={17} color={TEXT} />
          </button>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: TEXT }}>
            Admin dashboard
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: FAINT }}>
          <Shield size={14} color={GOLD} /> Owner access
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 sm:px-8 mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
            style={{
              background: tab === t.id ? GOLD : CARD,
              color: tab === t.id ? BG : MUTE,
              border: tab === t.id ? "none" : `1px solid ${BORDER}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 sm:px-8">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {ADMIN_STATS.map((s) => (
                <div key={s.label} className="rounded-2xl px-4 py-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <p className="text-xl sm:text-2xl font-semibold" style={{ color: GOLD }}>{s.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: FAINT }}>{s.label}</p>
                  {s.change && <p className="text-[10px] mt-1" style={{ color: GREEN }}>{s.change} vs yesterday</p>}
                </div>
              ))}
            </div>

            <p className="text-sm font-semibold mb-3">Recent activity</p>
            <div className="flex flex-col gap-2">
              {ADMIN_RECENT_RIDES.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div>
                    <p className="text-sm font-semibold">{r.rider} <span style={{ color: FAINT, fontWeight: 400 }}>→ {r.driver}</span></p>
                    <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{r.type} · {r.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{r.fare} SAR</p>
                    <p className="text-[10px]" style={{ color: r.status === "Cancelled" ? "#C0755B" : r.status === "In progress" ? GOLD : GREEN }}>{r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "rides" && (
          <div className="flex flex-col gap-2">
            {ADMIN_RECENT_RIDES.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold">{r.id} — {r.type}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{r.rider} → {r.driver}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{r.fare} SAR</p>
                  <p className="text-[10px]" style={{ color: r.status === "Cancelled" ? "#C0755B" : r.status === "In progress" ? GOLD : GREEN }}>{r.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "drivers" && (
          <div className="grid sm:grid-cols-2 gap-2">
            {ADMIN_DRIVERS.map((d) => {
              const meta = STATUS_META[d.status];
              return (
                <div key={d.name} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(212,166,74,0.12)" }}>
                    <User size={17} color={GOLD} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.label}</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{d.rides} rides · {d.rating} rating</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "applications" && (
          <div className="flex flex-col gap-2">
            {ADMIN_APPLICATIONS.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{a.role} · {a.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: FAINT }}>{a.date}</p>
                  <button className="mt-1 px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: GOLD, color: BG }}>Review</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}

/* ---------- APP ROOT ---------- */
const TAB_SCREENS = ["home", "activity", "wallet", "profile"];

export default function SayyaraDriveApp() {
  const [history, setHistory] = useState(["home"]);
  const [showAI, setShowAI] = useState(false);
  const [lang, setLang] = useState("en");
  const screen = history[history.length - 1];
  const t = (key) => TRANSLATIONS[lang][key] || key;

  function navigate(next) {
    if (TAB_SCREENS.includes(next)) setHistory([next]);
    else setHistory((h) => [...h, next]);
  }
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : ["home"]));
  }

  const isTab = TAB_SCREENS.includes(screen);

  const SCREEN_MAP = {
    home: <Home navigate={navigate} lang={lang} setLang={setLang} t={t} />,
    ride: <RideBooking goBack={goBack} />,
    driver: <DriverApp goBack={goBack} />,
    airport: <AirportTransfer goBack={goBack} />,
    intercity: <IntercityRide goBack={goBack} />,
    rentals: <CarRental goBack={goBack} />,
    market: <Marketplace goBack={goBack} />,
    food: <FoodDelivery goBack={goBack} />,
    logistics: <Logistics goBack={goBack} />,
    jobs: <JobsPortal goBack={goBack} />,
    fleet: <FleetManagement goBack={goBack} />,
    profile: <Profile goBack={goBack} navigate={navigate} />,
    activity: <TripHistory goBack={goBack} />,
    wallet: <WalletTab goBack={goBack} />,
    admin: <AdminDashboard goBack={goBack} />,
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className={`w-full relative ${screen === "admin" ? "max-w-5xl" : "max-w-md"}`} style={{ paddingBottom: isTab ? 70 : 20 }}>
        {SCREEN_MAP[screen] || <Home navigate={navigate} />}

        <button
          onClick={() => setShowAI(true)}
          className="fixed right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40"
          style={{ background: GOLD, bottom: isTab ? 86 : 24 }}
          aria-label="Open AI assistant"
        >
          <Sparkles size={20} color={BG} />
        </button>

        {showAI && <AIAssistant onClose={() => setShowAI(false)} />}

        {isTab && <BottomNav screen={screen} navigate={navigate} t={t} />}
      </div>
    </div>
  );
}
