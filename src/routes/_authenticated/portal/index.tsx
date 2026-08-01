import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Car, Plane, Hotel, Package, Palmtree, ShoppingBag, LifeBuoy, MapPin, Clock,
  Bell, Crown, ArrowRight, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Stat, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt, useWallet, useNotifications, useProfile, tierOf } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "Member Portal Overview — BiLUXS" },
      { name: "description", content: "Your BiLUXS member portal: next pickup, chauffeur, wallet, rewards and quick actions." },
      { property: "og:title", content: "BiLUXS Member Portal" },
      { property: "og:description", content: "Next pickup, assigned chauffeur, wallet balance and reward tier at a glance." },
    ],
  }),
  component: Page,
});

const QUICK = [
  { to: "/fleet", label: "Book Chauffeur", icon: Car },
  { to: "/portal/flights", label: "Book Flight", icon: Plane },
  { to: "/portal/hotels", label: "Reserve Hotel", icon: Hotel },
  { to: "/portal/cargo", label: "Ship Cargo", icon: Package },
  { to: "/portal/tours", label: "Book Tour", icon: Palmtree },
  { to: "/portal/shopping", label: "Luxury Shopping", icon: ShoppingBag },
  { to: "/track", label: "Track Cargo", icon: MapPin },
  { to: "/portal/support", label: "Emergency Support", icon: LifeBuoy },
];

const DESTINATIONS = [
  { name: "Obudu Mountain Resort", note: "Cross River highlands", img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60" },
  { name: "Tinapa Resort", note: "Calabar waterfront", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=60" },
  { name: "Marina Resort", note: "Riverside leisure", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60" },
];

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance } = useWallet();
  const { items: notifs, unread } = useNotifications();
  const [bookings, setBookings] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("bookings").select("*").eq("user_id", user.id)
        .order("pickup_time", { ascending: true });
      setBookings(data ?? []);
    };
    void load();
    const ch = supabase.channel("portal-bookings-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  const now = Date.now();
  const upcoming = bookings.filter((b) => new Date(b.pickup_time).getTime() >= now && b.status !== "cancelled" && b.status !== "completed");
  const next = upcoming[0];
  const completed = bookings.filter((b) => b.status === "completed");

  useEffect(() => {
    if (!next?.driver_id) { setDriver(null); return; }
    supabase.rpc("get_booking_driver", { _booking_id: next.id })
      .then(({ data }) => setDriver(Array.isArray(data) ? data[0] ?? null : null));
  }, [next?.id, next?.driver_id]);

  const points = profile?.loyalty_points ?? 0;
  const { current, next: nextTier, toNext } = tierOf(points);

  return (
    <PortalLayout title="Overview" subtitle="Your entire BiLUXS world at a glance — journeys, chauffeurs, wallet and rewards, live.">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Next Pickup" value={next ? dt(next.pickup_time).split(",")[0] : "None"} hint={next ? next.pickup_location : "Book your next journey"} accent="text-gold" />
        <Stat label="Chauffeur" value={driver ? driver.full_name.split(" ")[0] : next ? "Pending" : "—"} hint={driver ? `${driver.vehicle_model ?? "Vehicle"} · ${driver.plate_number ?? "—"}` : "Assigned before pickup"} />
        <Stat label="Wallet" value={ngn(balance)} hint="Available balance" accent="text-emerald-400" />
        <Stat label="Reward Points" value={points.toLocaleString()} hint={`${current.label} tier`} accent="text-crimson" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold">Upcoming Journey</div>
            {next && <Link to="/portal/trips/$id" params={{ id: next.id }} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold inline-flex items-center gap-1">Live trip <ArrowRight className="h-3 w-3" /></Link>}
          </div>
          {!next ? (
            <div className="mt-4"><Empty text="No upcoming journeys. Explore the fleet to book your next ride." /></div>
          ) : (
            <div className="mt-4 grid md:grid-cols-2 gap-5">
              <div className="space-y-3 text-sm">
                <Row label="Waybill" value={next.waybill_code} />
                <Row label="Pickup" value={next.pickup_location} />
                <Row label="Drop-off" value={next.dropoff_location} />
                <Row label="Pickup time" value={dt(next.pickup_time)} />
                <Row label="Status" value={String(next.status).replace("_", " ")} />
                <Row label="Fare" value={ngn(next.total_price)} />
              </div>
              <div className="border border-border p-4 bg-white/[0.02]">
                {driver ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 border border-gold overflow-hidden grid place-items-center text-gold">
                        {driver.photo_url ? <img src={driver.photo_url} alt={driver.full_name} className="h-full w-full object-cover" /> : driver.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-lg truncate">{driver.full_name}</div>
                        <div className="text-[11px] text-muted-foreground">{driver.vehicle_model ?? "Luxury vehicle"} · {driver.plate_number ?? "—"}</div>
                        <div className="text-[11px] text-gold">★ {Number(driver.rating).toFixed(1)} · {driver.years_experience} yrs{driver.verified ? " · Verified" : ""}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <a href={`tel:${driver.phone}`} className="h-10 grid place-items-center border border-border text-[10px] uppercase tracking-widest hover:border-gold">Call</a>
                      <a href={`https://wa.me/${(driver.whatsapp ?? driver.phone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="h-10 grid place-items-center border border-emerald-500/60 text-emerald-400 text-[10px] uppercase tracking-widest">WhatsApp</a>
                      <Link to="/portal/messages" className="h-10 grid place-items-center border border-border text-[10px] uppercase tracking-widest hover:border-gold">Message</Link>
                      <Link to="/portal/trips/$id" params={{ id: next.id }} className="h-10 grid place-items-center bg-crimson text-white text-[10px] uppercase tracking-widest">Live map</Link>
                    </div>
                  </>
                ) : (
                  <div className="h-full grid place-items-center text-center text-xs text-muted-foreground py-8">
                    <div>
                      <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      Chauffeur assignment in progress.<br />You'll be notified the moment it's confirmed.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Crown className="h-3 w-3" /> {current.label} Member</div>
          <div className="font-display text-4xl mt-3">{points.toLocaleString()}<span className="text-sm text-muted-foreground ml-2">pts</span></div>
          {nextTier ? (
            <>
              <div className="h-1.5 bg-white/10 mt-4">
                <div className="h-full bg-gold transition-all" style={{ width: `${Math.min(100, (points / nextTier.min) * 100)}%` }} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">{toNext.toLocaleString()} points to {nextTier.label}</div>
            </>
          ) : (
            <div className="text-[11px] text-gold mt-3">Highest tier reached.</div>
          )}
          <ul className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
            {current.perks.map((p) => <li key={p}>· {p}</li>)}
          </ul>
          <Link to="/portal/loyalty" className="mt-4 inline-flex text-[10px] uppercase tracking-widest text-gold hover:underline">All benefits →</Link>
        </Card>
      </div>

      <SectionTitle>Quick Actions</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK.map((q) => (
          <Link key={q.label} to={q.to} className="group relative overflow-hidden bg-card border border-border p-5 hover:border-gold transition-colors">
            <q.icon className="h-6 w-6 text-gold" />
            <div className="mt-6 text-sm">{q.label}</div>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-gold" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-10">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Bell className="h-3 w-3" /> Recent Activity</div>
            <Link to="/portal/notifications" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">{unread} unread</Link>
          </div>
          {notifs.length === 0 ? <Empty text="No activity yet." /> : (
            <div className="divide-y divide-border">
              {notifs.slice(0, 6).map((n) => (
                <div key={n.id} className="py-3 flex gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${n.read ? "bg-white/20" : "bg-crimson"}`} />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground">{dt(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Trip Summary</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Total" value={bookings.length} />
            <MiniStat label="Completed" value={completed.length} />
            <MiniStat label="Upcoming" value={upcoming.length} />
          </div>
          <div className="mt-5 text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Recommended</div>
          <div className="grid grid-cols-3 gap-2">
            {DESTINATIONS.map((d) => (
              <Link key={d.name} to="/portal/tours" className="group relative aspect-[4/5] overflow-hidden border border-border">
                <img src={d.img} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-500" />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="text-[10px] leading-tight">{d.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 border-crimson/40">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-6 w-6 text-crimson shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg">Emergency SOS</div>
            <div className="text-[11px] text-muted-foreground">Instantly alerts BiLUXS dispatch and shares your live location.</div>
          </div>
          <Link to="/portal/support" className="px-5 h-10 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center">Open SOS</Link>
        </div>
      </Card>
    </PortalLayout>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{label}</span>
      <span className="text-right capitalize">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-3">
      <div className="font-display text-2xl">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
