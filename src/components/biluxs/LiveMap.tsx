import { useEffect, useState } from "react";

export type Pin = { id: string; lat: number; lng: number; label: string; waybill: string };

// Client-only Leaflet renderer (Leaflet touches window)
export function LiveMap({ pins }: { pins: Pin[] }) {
  const [mounted, setMounted] = useState(false);
  const [Comp, setComp] = useState<{
    MapContainer: React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;
    TileLayer: React.ComponentType<Record<string, unknown>>;
    Marker: React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;
    Popup: React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;
    icon: unknown;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const rl = await import("react-leaflet");
      const goldIcon = leaflet.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#d4af37;box-shadow:0 0 0 4px rgba(212,175,55,0.35),0 0 12px rgba(212,175,55,0.8);border:2px solid #fff;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      setComp({
        MapContainer: rl.MapContainer as never,
        TileLayer: rl.TileLayer as never,
        Marker: rl.Marker as never,
        Popup: rl.Popup as never,
        icon: goldIcon,
      });
      setMounted(true);
    })();
  }, []);

  if (!mounted || !Comp) {
    return (
      <div className="absolute inset-0 grid place-items-center text-[10px] uppercase tracking-widest text-muted-foreground bg-[url('https://tile.openstreetmap.org/1/1/0.png')] bg-cover opacity-40">
        Initialising map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, icon } = Comp;
  const center = pins.length ? [pins[0].lat, pins[0].lng] : [4.9757, 8.3417]; // Calabar fallback

  return (
    <MapContainer center={center as never} zoom={12} style={{ height: "100%", width: "100%", background: "#05070f" }} scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap · CartoDB"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng] as never} icon={icon as never}>
          <Popup>
            <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
              <strong>{p.waybill}</strong><br />{p.label}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
