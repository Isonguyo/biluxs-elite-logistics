import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/trips/")({
  head: () => ({
    meta: [
      { title: "My Trips — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Every BiLUXS journey you've booked: upcoming, in progress, completed and cancelled.",
      },
      { property: "og:title", content: "My Trips — BiLUXS" },
      {
        property: "og:description",
        content:
          "Track upcoming and past chauffeur journeys in your BiLUXS member portal.",
      },
    ],
  }),
  component: Page,
});

const FILTERS = ["all", "upcoming", "in_progress", "completed", "cancelled"];

function formatFilterLabel(filter: string) {
  return filter.replace("_", " ");
}

function statusConfig(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "border-red-400/20 bg-red-400/10 text-red-300",
      };
    case "in_progress":
      return {
        label: "In Progress",
        icon: Car,
        className: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };
    default:
      return {
        label: "Upcoming",
        icon: Clock3,
        className: "border-sky-400/20 bg-sky-400/10 text-sky-300",
      };
  }
}

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("pickup_time", { ascending: false });

      if (mounted) setRows(data ?? []);
    };

    void load();

    const ch = supabase
      .channel(rtTopic("trips-" + user.id))
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
      mounted = false;
      void supabase.removeChannel(ch);
    };
  }, [user]);

  const now = Date.now();

  const list = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((booking) => {
      const isUpcoming =
        new Date(booking.pickup_time).getTime() >= now &&
        !["completed", "cancelled"].includes(booking.status);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "upcoming"
            ? isUpcoming
            : booking.status === filter;

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        booking.waybill_code,
        booking.pickup_location,
        booking.dropoff_location,
        booking.status,
        booking.payment_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [rows, filter, search, now]);

  const summary = useMemo(() => {
    const upcoming = rows.filter(
      (booking) =>
        new Date(booking.pickup_time).getTime() >= Date.now() &&
        !["completed", "cancelled"].includes(booking.status),
    ).length;

    const inProgress = rows.filter(
      (booking) => booking.status === "in_progress",
    ).length;

    const completed = rows.filter(
      (booking) => booking.status === "completed",
    ).length;

    const cancelled = rows.filter(
      (booking) => booking.status === "cancelled",
    ).length;

    return {
      total: rows.length,
      upcoming,
      inProgress,
      completed,
      cancelled,
    };
  }, [rows]);

  return (
    <PortalLayout
      title="My Trips"
      subtitle="Every BiLUXS journey in one place, with live status, route details and fare information."
    >
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden border border-gold/20 bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-crimson/[0.10] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-crimson/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">
                <RouteIcon className="h-3.5 w-3.5" />
                Journey history
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Your BiLUXS journeys.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Review upcoming rides, active journeys and completed trips.
                Open any booking for its full journey workspace.
              </p>
            </div>

            <Link
              to="/fleet"
              className="inline-flex h-11 items-center justify-center gap-2 border border-gold/40 bg-gold px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-black transition-transform hover:-translate-y-0.5"
            >
              Book another ride
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Snapshot */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="All trips"
            value={summary.total}
            icon={RouteIcon}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <SummaryCard
            label="Upcoming"
            value={summary.upcoming}
            icon={CalendarDays}
            active={filter === "upcoming"}
            onClick={() => setFilter("upcoming")}
          />
          <SummaryCard
            label="In progress"
            value={summary.inProgress}
            icon={Car}
            active={filter === "in_progress"}
            onClick={() => setFilter("in_progress")}
          />
          <SummaryCard
            label="Completed"
            value={summary.completed}
            icon={CheckCircle2}
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          />
          <SummaryCard
            label="Cancelled"
            value={summary.cancelled}
            icon={XCircle}
            active={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          />
        </section>

        {/* Controls */}
        <Card className="border-white/10 bg-white/[0.025] p-3 md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`inline-flex h-9 items-center border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all ${
                    filter === item
                      ? "border-crimson bg-crimson text-white shadow-[0_0_22px_rgba(196,30,58,0.18)]"
                      : "border-white/10 bg-white/[0.02] text-white/55 hover:border-gold/50 hover:text-white"
                  }`}
                >
                  {formatFilterLabel(item)}
                </button>
              ))}
            </div>

            <label className="relative block min-w-0 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search trips, route or booking code"
                className="h-10 w-full border border-white/10 bg-black/20 pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-gold/50"
              />
            </label>
          </div>
        </Card>

        {/* Results heading */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
              {formatFilterLabel(filter)}
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold text-white">
              {list.length === 1 ? "1 journey" : `${list.length} journeys`}
            </h2>
          </div>

          <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Live booking updates
          </div>
        </div>

        {list.length === 0 ? (
          <Empty text="No trips match this view yet." />
        ) : (
          <div className="grid gap-4">
            {list.map((booking) => {
              const status = statusConfig(booking.status);
              const StatusIcon = status.icon;

              return (
                <Card
                  key={booking.id}
                  className="group overflow-hidden border-white/10 bg-gradient-to-r from-white/[0.045] to-white/[0.02] p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/35"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      {/* Main journey */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                            {booking.waybill_code || "BiLUXS Booking"}
                          </span>

                          {booking.luxury_protocol ? (
                            <span className="border border-gold/20 bg-gold/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
                              Luxury Protocol
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                          <RoutePoint
                            label="Pickup"
                            value={booking.pickup_location}
                            icon={MapPin}
                          />

                          <div className="hidden items-center justify-center md:flex">
                            <div className="h-px w-16 bg-gradient-to-r from-gold/10 via-gold/50 to-gold/10" />
                            <div className="-mx-1 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.55)]" />
                            <div className="h-px w-16 bg-gradient-to-r from-gold/10 via-gold/50 to-gold/10" />
                          </div>

                          <RoutePoint
                            label="Destination"
                            value={booking.dropoff_location}
                            icon={MapPin}
                            align="right"
                          />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/45">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-white/30" />
                            {dt(booking.pickup_time)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <RouteIcon className="h-3.5 w-3.5 text-white/30" />
                            {Number(booking.distance_km || 0).toLocaleString()} km
                          </span>
                        </div>
                      </div>

                      {/* Fare + status */}
                      <div className="grid gap-3 sm:grid-cols-2 xl:w-[260px] xl:grid-cols-1">
                        <div className="border border-white/10 bg-black/15 p-4">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/35">
                            Total fare
                          </div>
                          <div className="mt-1 font-display text-2xl font-semibold text-white">
                            {ngn(booking.total_price)}
                          </div>
                          <div
                            className={`mt-2 text-[9px] font-semibold uppercase tracking-[0.2em] ${
                              booking.payment_status === "paid"
                                ? "text-emerald-300"
                                : "text-amber-300"
                            }`}
                          >
                            {booking.payment_status || "Payment pending"}
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-2 border px-4 py-3 ${status.className}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          <div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] opacity-70">
                              Journey status
                            </div>
                            <div className="mt-0.5 text-xs font-semibold">
                              {status.label}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="xl:w-[130px]">
                        <Link
                          to="/portal/trips/$id"
                          params={{ id: booking.id }}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.025] text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-all hover:border-gold/50 hover:bg-gold hover:text-black"
                        >
                          Open trip
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof RouteIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border p-4 text-left transition-all ${
        active
          ? "border-gold/40 bg-gold/[0.07] shadow-[0_0_24px_rgba(212,175,55,0.06)]"
          : "border-white/10 bg-white/[0.025] hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-semibold text-white">
            {value}
          </div>
        </div>

        <span
          className={`flex h-8 w-8 items-center justify-center border ${
            active
              ? "border-gold/25 bg-gold/10 text-gold"
              : "border-white/10 bg-white/[0.02] text-white/30"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function RoutePoint({
  label,
  value,
  icon: Icon,
  align = "left",
}: {
  label: string;
  value: string;
  icon: typeof MapPin;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "md:text-right" : ""}>
      <div
        className={`mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35 ${
          align === "right" ? "md:justify-end" : ""
        }`}
      >
        <Icon className="h-3 w-3 text-gold/70" />
        {label}
      </div>
      <div className="font-display text-sm font-medium leading-6 text-white md:text-base">
        {value || "Not specified"}
      </div>
    </div>
  );
}
