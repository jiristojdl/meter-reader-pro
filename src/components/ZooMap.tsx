import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Station {
  id: number;
  name: string;
  lat: number;
  lng: number;
  visited: boolean;
}

// 10 stations placed on paths within Podkrušnohorský zoopark Chomutov
const STATIONS: Station[] = [
  { id: 1,  name: "Vstupní brána",   lat: 50.46175, lng: 13.39872, visited: false },
  { id: 2,  name: "Africká savana",  lat: 50.46310, lng: 13.39750, visited: false },
  { id: 3,  name: "Sloní výběh",     lat: 50.46470, lng: 13.39620, visited: false },
  { id: 4,  name: "Tučňáci",         lat: 50.46590, lng: 13.39510, visited: false },
  { id: 5,  name: "Velké kočky",     lat: 50.46720, lng: 13.39430, visited: false },
  { id: 6,  name: "Vlci a medvědi",  lat: 50.46840, lng: 13.39580, visited: false },
  { id: 7,  name: "Opičárna",        lat: 50.46950, lng: 13.39720, visited: false },
  { id: 8,  name: "Plazí dům",       lat: 50.47050, lng: 13.39870, visited: false },
  { id: 9,  name: "Vodní ptáci",     lat: 50.46900, lng: 13.40020, visited: false },
  { id: 10, name: "Výběh jelenů",    lat: 50.46750, lng: 13.40150, visited: false },
];

const TRIGGER_DISTANCE_M = 20;
const ZOO_CENTER: [number, number] = [50.46560, 13.39790];
const ZOO_ZOOM = 15;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createCrosshairIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px;transform:translate(-50%,-50%)">
        <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#e63946;transform:translateY(-50%)"></div>
        <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#e63946;transform:translateX(-50%)"></div>
        <div style="position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:50%;background:#e63946;transform:translate(-50%,-50%)"></div>
        <div style="position:absolute;top:50%;left:50%;width:24px;height:24px;border-radius:50%;border:2px solid rgba(230,57,70,0.5);transform:translate(-50%,-50%)"></div>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createStationIcon(visited: boolean) {
  const color = visited ? "#2dc653" : "#f4a261";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:32px;transform:translate(-50%,-50%)">
        <div style="
          position:absolute;inset:0;
          border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;font-weight:bold;color:white;">
          🎯
        </div>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface Toast {
  id: number;
  stationName: string;
}

export default function ZooMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const playerMarker = useRef<L.Marker | null>(null);
  const accuracyCircle = useRef<L.Circle | null>(null);
  const stationMarkers = useRef<L.Marker[]>([]);
  const [stations, setStations] = useState<Station[]>(STATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gpsStatus, setGpsStatus] = useState<"waiting" | "active" | "error">("waiting");
  const [visitedCount, setVisitedCount] = useState(0);
  const triggeredRef = useRef<Set<number>>(new Set());
  const toastIdRef = useRef(0);

  const showToast = useCallback((stationName: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, stationName }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const updatePlayerPosition = useCallback(
    (lat: number, lng: number, accuracy: number) => {
      if (!leafletMap.current) return;

      if (!playerMarker.current) {
        playerMarker.current = L.marker([lat, lng], { icon: createCrosshairIcon(), zIndexOffset: 1000 }).addTo(
          leafletMap.current
        );
        accuracyCircle.current = L.circle([lat, lng], {
          radius: accuracy,
          color: "#457b9d",
          fillColor: "#457b9d",
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(leafletMap.current);
      } else {
        playerMarker.current.setLatLng([lat, lng]);
        playerMarker.current.setIcon(createCrosshairIcon());
        accuracyCircle.current?.setLatLng([lat, lng]);
        accuracyCircle.current?.setRadius(accuracy);
      }

      setStations((prev) => {
        const updated = prev.map((s) => {
          const dist = haversineMeters(lat, lng, s.lat, s.lng);
          if (dist <= TRIGGER_DISTANCE_M && !triggeredRef.current.has(s.id)) {
            triggeredRef.current.add(s.id);
            showToast(s.name);
            setVisitedCount((c) => c + 1);
            const marker = stationMarkers.current[s.id - 1];
            if (marker) marker.setIcon(createStationIcon(true));
            return { ...s, visited: true };
          }
          return s;
        });
        return updated;
      });
    },
    [showToast]
  );

  // Initialise Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: ZOO_CENTER,
      zoom: ZOO_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    leafletMap.current = map;

    // Add station markers
    STATIONS.forEach((s, i) => {
      const marker = L.marker([s.lat, s.lng], { icon: createStationIcon(false) })
        .addTo(map)
        .bindTooltip(`${i + 1}. ${s.name}`, { permanent: false, direction: "top" });
      stationMarkers.current[i] = marker;
    });

    return () => {
      map.remove();
      leafletMap.current = null;
      playerMarker.current = null;
      accuracyCircle.current = null;
      stationMarkers.current = [];
    };
  }, []);

  // Start GPS watching
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus("active");
        updatePlayerPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updatePlayerPosition]);

  const statusColors: Record<string, string> = {
    waiting: "bg-yellow-400",
    active: "bg-green-400",
    error: "bg-red-400",
  };
  const statusLabels: Record<string, string> = {
    waiting: "Čekám na GPS…",
    active: "GPS aktivní",
    error: "GPS nedostupné",
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur shadow z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${statusColors[gpsStatus]}`} />
          <span className="text-sm font-medium text-gray-700">{statusLabels[gpsStatus]}</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">
          🦒 Zoopark Chomutov — GPS hra
        </div>
        <div className="text-sm text-gray-600">
          {visitedCount} / {STATIONS.length} stanovišť
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Toast notifications */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-green-600 text-white text-center px-6 py-3 rounded-2xl shadow-xl text-lg font-bold animate-bounce"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            🎉 Jsi tu! Pojď hrát! — {t.stationName}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-16 right-3 bg-white/90 rounded-xl shadow p-3 z-[1000] text-xs space-y-1">
        <div className="font-semibold mb-1 text-gray-700">Legenda</div>
        <div className="flex items-center gap-2"><span className="text-base">🎯</span><span className="text-orange-500 font-medium">Nenavštívené</span></div>
        <div className="flex items-center gap-2"><span className="text-base">🎯</span><span className="text-green-600 font-medium">Navštívené</span></div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500 relative"><div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-red-500 -top-1.5 h-4"></div></div>
          <span className="text-gray-600">Tvá poloha</span>
        </div>
        <div className="mt-1 text-gray-400">Dosah: {TRIGGER_DISTANCE_M} m</div>
      </div>
    </div>
  );
}
