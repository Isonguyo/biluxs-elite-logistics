import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Bell, Crown, ArrowRight, Clock, MapPin, LifeBuoy, Wallet, MessageSquare, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { Avatar } from "@/components/portal/Avatar";
import { ngn, dt, useWallet, useNotifications, useProfile } from "@/lib/portal";
import { stageOf, stageLabel, stageHint, stageProgress, rideTier } from "@/lib/ride";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "My BiLUXS Dashboard" },
      { name: "description", content: "See your current ride, your chauffeur's live position, your membership tier and your latest updates in one place." },
      { property: "og:title", content: "My BiLUXS Dashboard" },
      { property: "og:description", content: "Your current ride, chauffeur, membership tier and updates at a glance." },
    ],
  }),
  component: Page,
});

const QUICK = [
  { to: "/fleet", label: "Book a ride", icon: Car },
  { to: "/portal/wallet", label: "Wallet", icon: Wallet },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare },
  { to: "/portal/concierge", label: "Concierge", icon: Sparkles },
];

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance } = useWallet();
  const { items: notifs, unread } = useNotifications();
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("bookings").select("*").eq("user_id", user.id)
        .order("pickup_time", { ascending: true });
      setBookings(data ?? []);
    };
    void load();
    const ch = supabase.channel(rtTopic("portal-bookings-" + user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  const now = Date.now();
  const active = bookings.find((b) => b.status === "in_progress")
    ?? bookings.find((b) => new Date(b.pickup_time).getTime() >= now - 3 * 3600_000 && !["completed", "cancelled"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "completed");

  useEffect(() => {
    if (!active?.id) { setEvents([]); setDriver(null); return; }
    const load = async () => {
      const { data } = await supabase.from("trip_events").select("event").eq("booking_id", active.id);
      setEvents(data ?? []);
      if (active.driver_id) {
        const res = await supabase.rpc("get_booking_driver", { _booking_id: active.id });
        setDriver(Array.isArray(res.data) ? res.data[0] ?? null : null);
      } else setDriver(null);
    };
    void load();
    const ch = supabase.channel(rtTopic("portal-active-" + active.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_events", filter: `booking_id=eq.${active.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [active?.id, active?.driver_id]);

  const stage = active ? stageOf(active, events) : null;
  const tier = rideTier(completed.length);
  const firstName = (profile?.full_name || user?.email || "there").split(" ")[0];

  return (
    <PortalLayout title="My Dashboard">
      {/* Who am I */}
      <Card className="flex items-center gap-4">
        <Avatar value={profile?.avatar_url} name={profile?.full_name || user?.email} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl truncate">{profile?.full_name || firstName}</div>
          <div className="text-[11px] text-muted-foreground truncate">{tier.current.label} member · {completed.length} completed rides</div>
        </div>
        <Link to="/portal/profile" className="h-10 px-4 border border-border hover:border-gold text-[10px] uppercase tracking-widest grid place-items-center">
          Edit
        </Link>
      </Card>

      {/* Current ride */}
      <Card className="mt-4 border-gold/40">
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold">Your ride</div>

        {!active ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">You have no ride booked right now.</p>
            <Link to="/fleet" className="mt-4 inline-flex h-12 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest items-center gap-2">
              <Car className="h-4 w-4" /> Book a ride
            </Link>
          </div>
        ) : (
          <>
            <div className="font-display text-2xl md:text-3xl mt-2">{stageLabel(stage!)}</div>
            <p className="text-sm text-muted-foreground mt-1">{stageHint(stage!)}</p>

            <div className="h-1.5 bg-white/10 mt-4">
              <div className="h-full bg-gradient-to-r from-crimson to-gold transition-all duration-700" style={{ width: `${stageProgress(stage!)}%` }} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex gap-3"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>{active.pickup_location}</span></div>
              <div className="flex gap-3"><MapPin className="h-4 w-4 text-crimson shrink-0 mt-0.5" /><span>{active.dropoff_location}</span></div>
              <div className="flex gap-3"><Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /><span>{dt(active.pickup_time)} · {ngn(active.total_price)}</span></div>
            </div>

            {/* Chauffeur */}
            <div className="mt-4 border border-border p-4 bg-white/[0.02]">
              {driver ? (
                <div className="flex items-center gap-3">
                  <Avatar value={driver.photo_url} name={driver.full_name} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg truncate">{driver.full_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{driver.vehicle_model ?? "Luxury vehicle"} · {driver.plate_number ?? "—"}</div>
                    <div className="text-[11px] text-gold">★ {Number(driver.rating).toFixed(1)}</div>
                  </div>
                  <a href={`tel:${driver.phone}`} className="h-10 px-4 border border-border hover:border-gold text-[10px] uppercase tracking-widest grid place-items-center">Call</a>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Clock className="h-5 w-5 opacity-60 shrink-0" />
                  We're assigning your chauffeur. You'll be told the moment they're confirmed.
                </div>
              )}
            </div>

            <Link to="/portal/trips/$id" params={{ id: active.id }}
              className="mt-4 w-full sm:w-auto h-12 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
              Track my ride <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </Card>

      {/* Tier + updates */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Crown className="h-3 w-3" /> {tier.current.label} member</div>
          <div className="font-display text-3xl mt-3">{completed.length}<span className="text-sm text-muted-foreground ml-2">rides completed</span></div>
          <div className="h-1.5 bg-white/10 mt-4">
            <div className="h-full bg-gold transition-all" style={{ width: `${tier.pct}%` }} />
          </div>
          <div className="text-[12px] text-muted-foreground mt-2">
            {tier.next ? `${tier.remaining} more ride${tier.remaining === 1 ? "" : "s"} to reach ${tier.next.label}.` : "You're at our highest tier."}
          </div>
          <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
            {tier.current.benefits.map((b) => <li key={b}>· {b}</li>)}
          </ul>
          <Link to="/portal/loyalty" className="mt-4 inline-flex text-[10px] uppercase tracking-widest text-gold hover:underline">See all benefits →</Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Bell className="h-3 w-3" /> Latest updates</div>
            <Link to="/portal/notifications" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">{unread} new</Link>
          </div>
          {notifs.length === 0 ? <Empty text="Nothing to report yet." /> : (
            <div className="divide-y divide-border">
              {notifs.slice(0, 5).map((n) => (
                <Link key={n.id} to={n.link ?? "/portal/notifications"} className="py-3 flex gap-3 hover:opacity-80">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${n.read ? "bg-white/20" : "bg-crimson"}`} />
                  <div className="min-w-0">
                    <div className="text-sm">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground">{dt(n.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {QUICK.map((q) => (
          <Link key={q.label} to={q.to} className="bg-card border border-border p-5 hover:border-gold transition-colors">
            <q.icon className="h-5 w-5 text-gold" />
            <div className="mt-4 text-sm">{q.label}</div>
          </Link>
        ))}
      </div>

      <Card className="mt-4 flex flex-wrap items-center gap-4">
        <LifeBuoy className="h-5 w-5 text-crimson shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm">Need help right now?</div>
          <div className="text-[11px] text-muted-foreground">Wallet balance {ngn(balance)} · our team is available 24/7.</div>
        </div>
        <Link to="/portal/support" className="h-11 px-5 bg-crimson text-white text-[10px] uppercase tracking-widest grid place-items-center">Get help</Link>
      </Card>
    </PortalLayout>
  );
}
