import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Car,
  CheckCircle2,
  Clock,
  Crown,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Sparkles,
  Wallet,
  QrCode,
} from "lucide-react";
import { motion } from "framer-motion";
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
      {
        name: "description",
        content:
          "Your current ride, chauffeur, membership tier and account updates at a glance.",
      },
      { property: "og:title", content: "My BiLUXS Dashboard" },
      {
        property: "og:description",
        content: "Your current ride, chauffeur, membership tier and updates at a glance.",
      },
    ],
  }),
  component: Page,
});

const QUICK = [
  {
    to: "/fleet",
    label: "Book a ride",
    hint: "Choose your vehicle",
    icon: Car,
    tone: "crimson",
  },
  {
    to: "/portal/trips",
    label: "My rides",
    hint: "View your journeys",
    icon: Clock,
    tone: "gold",
  },
  {
    to: "/portal/messages",
    label: "Messages",
    hint: "Speak with our team",
    icon: MessageSquare,
    tone: "blue",
  },
  {
    to: "/portal/concierge",
    label: "Concierge",
    hint: "Personal assistance",
    icon: Sparkles,
    tone: "gold",
  },
] as const;

type Booking = {
  id: string;
  waybill_code: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  total_price: number;
  pickup_time: string | null;
  luxury_protocol: boolean;
  payment_status: string;
  qr_token: string | null;
  qr_status: string;
  driver_id?: string | null;
};

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance } = useWallet();
  const { items: notifs, unread } = useNotifications();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("pickup_time", { ascending: true });

      if (!error) setBookings((data as Booking[]) ?? []);
    };

    void load();

    const ch = supabase
      .channel(rtTopic(`portal-bookings-${user.id}`))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user]);

  const now = Date.now();

  const active = useMemo(
    () =>
      bookings.find((b) => b.status === "in_progress") ??
      bookings.find(
        (b) =>
          !!b.pickup_time &&
          new Date(b.pickup_time).getTime() >= now - 3 * 3600_000 &&
          !["completed", "cancelled"].includes(b.status),
      ),
    [bookings, now],
  );

  const upcoming = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.id !== active?.id &&
            !!b.pickup_time &&
            new Date(b.pickup_time).getTime() > now &&
            !["completed", "cancelled"].includes(b.status),
        )
        .slice(0, 3),
    [bookings, active?.id, now],
  );

  const completed = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings],
  );

  const totalSpend = useMemo(
    () =>
      bookings
        .filter((b) => b.payment_status === "paid")
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0),
    [bookings],
  );

  useEffect(() => {
    if (!active?.id) {
      setEvents([]);
      setDriver(null);
      return;
    }

    const load = async () => {
      const { data: eventData } = await supabase
        .from("trip_events")
        .select("event")
        .eq("booking_id", active.id);

      setEvents(eventData ?? []);

      if (active.driver_id) {
        const res = await supabase.rpc("get_booking_driver", {
          _booking_id: active.id,
        });
        setDriver(Array.isArray(res.data) ? res.data[0] ?? null : null);
      } else {
        setDriver(null);
      }
    };

    void load();

    const ch = supabase
      .channel(rtTopic(`portal-active-${active.id}`))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_events",
          filter: `booking_id=eq.${active.id}`,
        },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [active?.id, active?.driver_id]);

  const stage = active ? stageOf(active, events) : null;
  const tier = rideTier(completed.length);
  const firstName = (
    profile?.full_name ||
    user?.email ||
    "there"
  ).split(" ")[0];

  return (
    <PortalLayout title="My Dashboard" subtitle="Your BiLUXS journeys, membership and account essentials.">
      <div className="space-y-6">
        {/* Welcome hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden border border-gold/20 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-[#130b18] p-6 md:p-8"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-crimson/5 blur-3xl" />

          <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.35em] text-gold">
                Member dashboard
              </div>
              <h1 className="font-display text-3xl md:text-5xl tracking-[0.08em] mt-2 text-white">
                Welcome,{" "}
                <span className="gradient-text">{firstName}</span>
              </h1>
              <p className="text-sm md:text-[15px] text-white/70 mt-3 max-w-2xl">
                Your journeys, chauffeur updates and BiLUXS member benefits — all
                in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/fleet"
                  className="h-11 px-5 bg-crimson text-white text-[10px] uppercase tracking-[0.22em] inline-flex items-center gap-2 hover:bg-crimson/90 transition-colors"
                >
                  <Car className="h-4 w-4" />
                  Book a ride
                </Link>
                <Link
                  to="/portal/trips"
                  className="h-11 px-5 border border-gold/30 bg-white/[0.02] text-gold text-[10px] uppercase tracking-[0.22em] inline-flex items-center gap-2 hover:bg-gold/10 transition-colors"
                >
                  View my rides
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Avatar
                value={profile?.avatar_url}
                name={profile?.full_name || user?.email}
                size={60}
              />
              <div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  Membership
                </div>
                <div className="font-display text-xl text-white mt-1">
                  {tier.current.label}
                </div>
                <div className="text-[11px] text-white/55 mt-1">
                  {completed.length} completed rides
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Snapshot */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <DashboardStat
            label="Total bookings"
            value={bookings.length}
            hint="All reservations"
          />
          <DashboardStat
            label="Completed rides"
            value={completed.length}
            hint="Journeys completed"
            accent="text-emerald-300"
          />
          <DashboardStat
            label="Wallet balance"
            value={ngn(balance)}
            hint="Available balance"
            accent="text-gold"
          />
          <DashboardStat
            label="Total spent"
            value={ngn(totalSpend)}
            hint="Paid bookings"
          />
        </section>

        {/* Active ride */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-gold">
                Current journey
              </div>
              <h2 className="font-display text-2xl md:text-3xl tracking-wide text-white mt-1">
                Your ride
              </h2>
            </div>
            {active && (
              <Link
                to="/portal/trips/$id"
                params={{ id: active.id }}
                className="text-[10px] uppercase tracking-widest text-gold hover:underline inline-flex items-center gap-2"
              >
                Open ride
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {!active ? (
            <Card className="border-gold/20 bg-gradient-to-br from-[#0a0511] to-[var(--navy-deep)]">
              <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    No active journey
                  </div>
                  <div className="font-display text-2xl md:text-3xl text-white mt-2">
                    Ready for your next trip?
                  </div>
                  <p className="text-sm text-white/60 mt-2 max-w-xl">
                    Choose a vehicle from the BiLUXS fleet and arrange your next
                    chauffeur-driven journey.
                  </p>
                </div>
                <Link
                  to="/fleet"
                  className="h-12 px-6 bg-crimson text-white text-[10px] uppercase tracking-[0.22em] inline-flex items-center justify-center gap-2"
                >
                  <Car className="h-4 w-4" />
                  Browse fleet
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="relative overflow-hidden border-gold/40 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-0">
              <div className="p-6 md:p-7">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.35em] text-gold">
                        {active.status === "in_progress" ? "Live journey" : "Upcoming journey"}
                      </span>
                      <StatusPill status={active.status} />
                      {active.payment_status === "paid" && (
                        <span className="px-2.5 py-1 text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Paid
                        </span>
                      )}
                    </div>

                    <div className="font-display text-3xl md:text-4xl tracking-[0.08em] text-white mt-3">
                      {active.waybill_code}
                    </div>

                    <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm">
                      <RouteLine
                        icon={<MapPin className="h-4 w-4 text-gold" />}
                        label="Pickup"
                        value={active.pickup_location}
                      />
                      <RouteLine
                        icon={<MapPin className="h-4 w-4 text-crimson" />}
                        label="Destination"
                        value={active.dropoff_location}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/60">
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gold" />
                        {active.pickup_time ? dt(active.pickup_time) : "Time pending"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-gold" />
                        {ngn(active.total_price)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full xl:w-[290px] shrink-0">
                    <div className="border border-gold/20 bg-white/[0.03] p-4">
                      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                        Journey status
                      </div>
                      <div className="font-display text-xl text-white mt-2">
                        {stageLabel(stage!)}
                      </div>
                      <div className="text-[11px] text-white/55 mt-1">
                        {stageHint(stage!)}
                      </div>
                      <div className="h-1.5 bg-white/10 mt-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stageProgress(stage!)}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-crimson to-gold"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {active.qr_token && active.qr_status === "valid" && (
                        <Link
                          to="/portal/trips/$id"
                          params={{ id: active.id }}
                          className="flex-1 h-11 border border-gold/30 text-gold text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-gold/10"
                        >
                          <QrCode className="h-4 w-4" />
                          Boarding pass
                        </Link>
                      )}
                      <Link
                        to="/portal/trips/$id"
                        params={{ id: active.id }}
                        className="flex-1 h-11 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2"
                      >
                        Track
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border/70">
                  {driver ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar value={driver.photo_url} name={driver.full_name} size={52} />
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase tracking-[0.3em] text-gold">
                            Your chauffeur
                          </div>
                          <div className="font-display text-lg text-white truncate mt-1">
                            {driver.full_name}
                          </div>
                          <div className="text-[11px] text-white/55 truncate">
                            {driver.vehicle_model ?? "Luxury vehicle"} ·{" "}
                            {driver.plate_number ?? "Plate pending"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                            Rating
                          </div>
                          <div className="text-sm text-gold mt-1">
                            ★ {Number(driver.rating ?? 0).toFixed(1)}
                          </div>
                        </div>
                        <a
                          href={`tel:${driver.phone}`}
                          className="h-10 px-4 border border-border hover:border-gold text-white/80 text-[10px] uppercase tracking-widest inline-flex items-center justify-center"
                        >
                          Call chauffeur
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Clock className="h-5 w-5 text-gold shrink-0" />
                      We’re assigning your chauffeur. You’ll be notified as soon as
                      the assignment is confirmed.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                Next journeys
              </div>
              <h2 className="font-display text-2xl tracking-wide text-white mt-1">
                Upcoming rides
              </h2>
            </div>
            <Link
              to="/portal/trips"
              className="text-[10px] uppercase tracking-widest text-gold hover:underline"
            >
              View all →
            </Link>
          </div>

          {!upcoming.length ? (
            <Card>
              <Empty text="No upcoming rides. Your next reservation will appear here." />
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-3">
              {upcoming.map((ride, index) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link
                    to="/portal/trips/$id"
                    params={{ id: ride.id }}
                    className="block h-full bg-card border border-border p-5 hover:border-gold/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-gold">
                        {ride.waybill_code}
                      </span>
                      <StatusPill status={ride.status} />
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <RouteLine
                        icon={<MapPin className="h-3.5 w-3.5 text-gold" />}
                        label="From"
                        value={ride.pickup_location}
                      />
                      <RouteLine
                        icon={<MapPin className="h-3.5 w-3.5 text-crimson" />}
                        label="To"
                        value={ride.dropoff_location}
                      />
                    </div>
                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                          Departure
                        </div>
                        <div className="text-[11px] text-white/75 mt-1">
                          {ride.pickup_time ? dt(ride.pickup_time) : "Time pending"}
                        </div>
                      </div>
                      <div className="font-display text-lg text-white">
                        {ngn(ride.total_price)}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Membership + updates */}
        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5" />
                  {tier.current.label} member
                </div>
                <div className="font-display text-3xl md:text-4xl text-white mt-3">
                  {completed.length}
                  <span className="text-sm text-white/50 ml-2">rides completed</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  Progress
                </div>
                <div className="font-display text-lg text-gold mt-1">
                  {Math.round(tier.pct)}%
                </div>
              </div>
            </div>

            <div className="h-2 bg-white/10 mt-5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tier.pct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-crimson to-gold"
              />
            </div>

            <p className="text-[12px] text-white/60 mt-3">
              {tier.next
                ? `${tier.remaining} more ride${tier.remaining === 1 ? "" : "s"} to reach ${tier.next.label}.`
                : "You’ve reached our highest member tier."}
            </p>

            <div className="mt-5 grid sm:grid-cols-2 gap-2">
              {tier.current.benefits.slice(0, 4).map((benefit) => (
                <div
                  key={benefit}
                  className="border border-gold/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/65"
                >
                  {benefit}
                </div>
              ))}
            </div>

            <Link
              to="/portal/loyalty"
              className="mt-5 inline-flex text-[10px] uppercase tracking-widest text-gold hover:underline"
            >
              Explore member benefits →
            </Link>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" />
                Latest updates
              </div>
              <Link
                to="/portal/notifications"
                className="text-[10px] uppercase tracking-widest text-white/50 hover:text-gold"
              >
                {unread > 0 ? `${unread} new` : "View all"}
              </Link>
            </div>

            {notifs.length === 0 ? (
              <Empty text="Nothing new to report." />
            ) : (
              <div className="divide-y divide-border">
                {notifs.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    to={n.link ?? "/portal/notifications"}
                    className="py-3.5 flex gap-3 hover:bg-white/[0.02] px-1 -mx-1 transition-colors"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        n.read ? "bg-white/15" : "bg-crimson"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-white/85">{n.title}</div>
                      {n.body && (
                        <div className="text-[11px] text-white/45 mt-0.5 line-clamp-2">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[10px] text-white/30 mt-1">
                        {dt(n.created_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <section>
          <div className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
            Quick access
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`group relative overflow-hidden border p-5 transition-all hover:-translate-y-0.5 ${
                  item.tone === "crimson"
                    ? "border-crimson/30 bg-crimson/5 hover:border-crimson/60"
                    : item.tone === "blue"
                      ? "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40"
                      : "border-gold/20 bg-white/[0.02] hover:border-gold/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <item.icon
                    className={`h-5 w-5 ${
                      item.tone === "crimson"
                        ? "text-crimson"
                        : item.tone === "blue"
                          ? "text-sky-300"
                          : "text-gold"
                    }`}
                  />
                  <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="mt-6 text-sm text-white">{item.label}</div>
                <div className="mt-1 text-[11px] text-white/40">{item.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Support strip */}
        <Card className="border-crimson/20 bg-gradient-to-r from-crimson/5 via-black/20 to-gold/5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 border border-crimson/30 bg-crimson/10 grid place-items-center shrink-0">
                <LifeBuoy className="h-5 w-5 text-crimson" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white">Need help with your journey?</div>
                <div className="text-[11px] text-white/45 mt-1">
                  Your wallet balance is {ngn(balance)} and our support team is available 24/7.
                </div>
              </div>
            </div>
            <Link
              to="/portal/support"
              className="h-11 px-5 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center shrink-0"
            >
              Get support
            </Link>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}

function DashboardStat({
  label,
  value,
  hint,
  accent = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent?: string;
}) {
  return (
    <Card className="border-gold/15 bg-white/[0.015] hover:border-gold/35 transition-colors">
      <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">
        {label}
      </div>
      <div className={`font-display text-xl md:text-2xl mt-2 ${accent}`}>
        {value}
      </div>
      <div className="text-[10px] text-white/35 mt-1">{hint}</div>
    </Card>
  );
}

function RouteLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">
          {label}
        </div>
        <div className="text-[13px] text-white/80 mt-1 truncate">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    confirmed: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    in_progress: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    completed: "bg-white/5 text-white/50 border-white/10",
    cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={`px-2.5 py-1 border text-[9px] uppercase tracking-widest ${
        map[status] ?? "bg-white/5 text-white/60 border-white/10"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
