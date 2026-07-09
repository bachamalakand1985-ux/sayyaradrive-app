import React, { useState, useEffect, useRef } from "react";
import {
  Car, Plane, MapPinned, Key, ShoppingBag, UtensilsCrossed, Truck,
  Briefcase, Users, Bell, Menu, ChevronRight, ArrowLeft, MapPin, Circle,
  Square, Navigation, Zap, Users2, CheckCircle2, PlaneLanding, PlaneTakeoff,
  Calendar, Clock, ArrowRightLeft, Route, Search,
  Plus, Tag, X, Star, ShoppingBag as Bag, Minus,
  Package, Phone, DollarSign,
  Mail, LogOut, Power, Sparkles, Send, Bot
} from "lucide-react";

/* ---------- shared tokens ---------- */
const BG = "#0B1917", CARD = "#14262A", BORDER = "#1E3630";
const GOLD = "#D4A64A", GREEN = "#6FA98C", TEXT = "#F2EFE9";
const MUTE = "#9BB3AD", FAINT = "#7C948E";
const HERE_API_KEY = "-ZUX_FxV-ok4896M-TXR2aqAShTd04KfYRqS_3_JGAM";

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
  { id: "ride", label: "Ride", sub: "City rides", icon: Car },
  { id: "airport", label: "Airport", sub: "Transfers", icon: Plane },
  { id: "intercity", label: "Intercity", sub: "City to city", icon: MapPinned },
  { id: "rentals", label: "Rentals", sub: "Rent a car", icon: Key },
  { id: "market", label: "Marketplace", sub: "Buy & sell", icon: ShoppingBag },
  { id: "food", label: "Food", sub: "Delivery", icon: UtensilsCrossed },
  { id: "logistics", label: "Logistics", sub: "Send parcels", icon: Truck },
  { id: "jobs", label: "Jobs", sub: "Drive & earn", icon: Briefcase },
  { id: "fleet", label: "Fleet", sub: "Manage cars", icon: Users },
];

function Home({ navigate }) {
  return (
    <div className="pb-4" style={{ color: TEXT }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD }}><Menu size={18} color={TEXT} /></button>
        <div className="text-[10px] uppercase" style={{ color: GREEN, letterSpacing: "0.25em" }}>Riyadh, Saudi Arabia</div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: CARD }}>
          <Bell size={17} color={TEXT} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
        </button>
      </div>
      <div className="px-5 pt-4 pb-6">
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>
          سيارة<span style={{ color: GOLD }}>Drive</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: MUTE }}>One app. Every way to move, earn, and deliver.</p>
      </div>
      <div className="px-5 mb-6">
        <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: MUTE }}>Where to?</p>
              <p className="text-lg font-semibold mt-1">Book a ride now</p>
            </div>
            <button onClick={() => navigate("ride")} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD }}>
              <ChevronRight size={20} color={BG} />
            </button>
          </div>
        </div>
      </div>
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Services</h2>
          <span className="text-xs" style={{ color: GREEN }}>{SERVICES.length} available</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => navigate(s.id)} className="flex flex-col items-start gap-2 rounded-xl p-3 text-left active:scale-95" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,166,74,0.12)" }}><Icon size={18} color={GOLD} /></div>
                <div><p className="text-xs font-semibold leading-tight">{s.label}</p><p className="text-[10px] mt-0.5" style={{ color: FAINT }}>{s.sub}</p></div>
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
  const chosen = RIDE_TYPES.find((r) => r.id === selectedType);
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
  const driverLoc = { lat: 24.7136, lng: 46.6753 };

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
function AirportTransfer({ goBack }) {
  const [direction, setDirection] = useState("to");
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [stage, setStage] = useState("input");
  const [vehicle, setVehicle] = useState("sedan");
  const chosen = AIRPORT_VEHICLES.find((v) => v.id === vehicle);
  const can = address.trim() && date && time;
  return (
    <div style={{ color: TEXT }}>
      <Header title="Airport transfer" onBack={goBack} />
      {stage === "input" && (
        <div className="px-5">
          <div className="flex rounded-full p-1 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <button onClick={() => setDirection("to")} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold" style={{ background: direction === "to" ? GOLD : "transparent", color: direction === "to" ? BG : MUTE }}><PlaneTakeoff size={13} /> To airport</button>
            <button onClick={() => setDirection("from")} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold" style={{ background: direction === "from" ? GOLD : "transparent", color: direction === "from" ? BG : MUTE }}><PlaneLanding size={13} /> From airport</button>
          </div>
          <div className="rounded-2xl px-4 py-2 mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Plane size={15} color={GOLD} />
              <select value={airport} onChange={(e) => setAirport(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }}>
                {AIRPORTS.map((a) => <option key={a} style={{ background: CARD }}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 py-3">
              <ChevronRight size={15} color={GREEN} />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
            </div>
          </div>
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
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah", "Khobar", "Taif", "Abha", "Tabuk", "Qassim"];
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
          <div className="rounded-2xl px-4 py-2 mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><Calendar size={14} color={GREEN} /><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
            <div className="flex items-center gap-3 py-3"><Calendar size={14} color={GOLD} /><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} /></div>
          </div>
          <button onClick={() => can && setStage("choose")} disabled={!can} className="w-full rounded-full py-3 text-sm font-semibold" style={{ background: can ? GOLD : BORDER, color: can ? BG : "#5C736D" }}>See available cars</button>
        </div>
      )}
      {stage === "choose" && (
        <div className="px-5">
          <p className="text-xs mb-3" style={{ color: FAINT }}>{pickupDate} → {returnDate} · {days} day{days > 1 ? "s" : ""}</p>
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
const LISTINGS = [{ id: 1, title: "Toyota Camry 2021", price: 62000, category: "Cars", location: "Riyadh", tag: "Featured" }, { id: 2, title: "iPhone 15 Pro, 256GB", price: 3400, category: "Electronics", location: "Jeddah", tag: null }, { id: 3, title: "3-seat sofa, grey", price: 950, category: "Furniture", location: "Dammam", tag: null }, { id: 4, title: "Nike Air Max, size 43", price: 220, category: "Fashion", location: "Riyadh", tag: null }, { id: 5, title: "Car tires set (4)", price: 800, category: "Spare parts", location: "Khobar", tag: "New" }];
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
const RESTAURANTS = [{ id: 1, name: "Najd Kitchen", cuisine: "Arabic", rating: 4.7, eta: "25-35 min" }, { id: 2, name: "Burger Point", cuisine: "Fast food", rating: 4.4, eta: "15-25 min" }, { id: 3, name: "Green Bowl", cuisine: "Healthy", rating: 4.8, eta: "20-30 min" }];
const MENU = { 1: [{ id: "m1", name: "Kabsa Chicken", price: 42 }, { id: "m2", name: "Mandi Lamb", price: 58 }], 2: [{ id: "m4", name: "Classic Beef Burger", price: 28 }, { id: "m5", name: "Fries", price: 12 }], 3: [{ id: "m7", name: "Grilled Chicken Bowl", price: 34 }] };
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
const JOBS = [{ id: 1, title: "Ride-hailing Driver", location: "Riyadh", pay: "Up to 8,000 SAR/mo" }, { id: 2, title: "Food Delivery Rider", location: "Jeddah", pay: "Per-order + bonuses" }, { id: 3, title: "Customer Support Agent", location: "Riyadh", pay: "5,500 SAR/mo" }];
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
const INITIAL_FLEET = [{ id: 1, plate: "RUH 4021", model: "Toyota Camry", driver: "Faisal A.", status: "active" }, { id: 2, plate: "RUH 7788", model: "Hyundai Accent", driver: "Omar K.", status: "idle" }, { id: 3, plate: "JED 3390", model: "Toyota Fortuner", driver: "Sami R.", status: "maintenance" }];
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
      <div className="px-5 mb-5">
        <button onClick={() => navigate("driver")} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="flex items-center gap-3 text-sm"><Car size={15} color={GOLD} /> Switch to driver mode</span>
          <ChevronRight size={14} color="#5C736D" />
        </button>
      </div>
      <div className="px-5"><button className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "#C0755B" }}><LogOut size={15} /> Log out</button></div>
    </div>
  );
}

/* ---------- ACTIVITY ---------- */
const TYPE_META = { ride: { icon: Car, label: "Ride" }, airport: { icon: Plane, label: "Airport transfer" } };
const TRIPS = [{ id: 1, type: "ride", date: "Jul 8, 2026", from: "Al Olaya Street", to: "King Fahd Rd", fare: 24 }, { id: 2, type: "airport", date: "Jul 5, 2026", from: "Home", to: "RUH Airport", fare: 85 }];
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
  { id: "home", label: "Home" },
  { id: "activity", label: "Activity" },
  { id: "wallet", label: "Wallet" },
  { id: "profile", label: "Profile" },
];
function BottomNav({ screen, navigate }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center py-3 px-5" style={{ background: "#0F211E", borderTop: `1px solid ${BORDER}` }}>
      {TABS.map((t) => (
        <button key={t.id} onClick={() => navigate(t.id)} className="flex flex-col items-center gap-1" style={{ color: screen === t.id ? GOLD : "#6C847E" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: screen === t.id ? GOLD : "transparent" }} />
          <span className="text-[10px] font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- APP ROOT ---------- */
const TAB_SCREENS = ["home", "activity", "wallet", "profile"];

export default function SayyaraDriveApp() {
  const [history, setHistory] = useState(["home"]);
  const [showAI, setShowAI] = useState(false);
  const screen = history[history.length - 1];

  function navigate(next) {
    if (TAB_SCREENS.includes(next)) setHistory([next]);
    else setHistory((h) => [...h, next]);
  }
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : ["home"]));
  }

  const isTab = TAB_SCREENS.includes(screen);

  const SCREEN_MAP = {
    home: <Home navigate={navigate} />,
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
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md relative" style={{ paddingBottom: isTab ? 70 : 20 }}>
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

        {isTab && <BottomNav screen={screen} navigate={navigate} />}
      </div>
    </div>
  );
}
