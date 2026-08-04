import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, Users, Car } from "lucide-react";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/ai")({ component: Page });

type Insight = { icon: typeof Sparkles; tone: "good" | "warn" | "bad" | "neutral"; title: string; detail: string; action: string };

const day = 86400000;

function Page() {
  const { rows: bookings } = useTable("bookings", { limit: 2000 });
  const { rows: drivers } = useTable("drivers", { limit: 500 });
  const { rows: reviews } = useTable("driver_reviews", { limit: 1000 });
  const { rows: profiles } = useTable("profiles", { limit: 2000 });
  const { rows: incidents } = useTable("driver_incidents", { limit: 300 });

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const paid = bookings.filter((b: Row) => b.payment_status === "paid");
    const sum = (list: Row[]) => list.reduce((a, b) => a + Number(b.total_price || 0), 0);
    const week = paid.filter((b: Row) => Date.now() - new Date(b.paid_at || b.created_at).getTime() < 7 * day);
    const prevWeek = paid.filter((b: Row) => {
      const t = Date.now() - new Date(b.paid_at || b.created_at).getTime();
      return t >= 7 * day && t < 14 * day;
    });
    const delta = sum(prevWeek) ? ((sum(week) - sum(prevWeek)) / sum(prevWeek)) * 100 : 0;
    if (sum(prevWeek)) {
      out.push({
        icon: delta >= 0 ? TrendingUp : TrendingDown,
        tone: delta >= 0 ? "good" : "bad",
        title: `Revenue ${delta >= 0 ? "grew" : "dropped"} ${Math.abs(delta).toFixed(1)}% week over week`,
        detail: `${naira(sum(week))} this week versus ${naira(sum(prevWeek))} last week.`,
        action: delta >= 0 ? "Protect momentum: keep peak-hour capacity staffed." : "Review cancellations, pricing and chauffeur availability.",
      });
    }

    // Complaint clusters
    const lowByDriver = new Map<string, number>();
    reviews.filter((r: Row) => Number(r.rating) <= 2).forEach((r: Row) => lowByDriver.set(r.driver_id, (lowByDriver.get(r.driver_id) ?? 0) + 1));
    lowByDriver.forEach((count, id) => {
      if (count >= 3) {
        const name = drivers.find((d: Row) => d.id === id)?.full_name ?? "A chauffeur";
        out.push({ icon: AlertTriangle, tone: "bad", title: `${name} has received ${count} low ratings`, detail: "Repeated dissatisfaction signals a service or vehicle problem.", action: "Open a performance review and pause premium assignments." });
      }
    });

    // Airport demand
    const airport = bookings.filter((b: Row) => /airport/i.test(`${b.pickup_location} ${b.dropoff_location}`));
    if (airport.length > bookings.length * 0.35 && bookings.length > 5) {
      out.push({ icon: Car, tone: "warn", title: "Airport demand dominates the mix", detail: `${((airport.length / bookings.length) * 100).toFixed(0)}% of trips touch an airport.`, action: "Stage two additional vehicles near the terminal during peak windows." });
    }

    // Idle fleet
    const active = drivers.filter((d: Row) => d.status === "active").length;
    const inProgress = bookings.filter((b: Row) => b.status === "in_progress").length;
    if (active > 0 && inProgress / active < 0.3) {
      out.push({ icon: Car, tone: "warn", title: "Chauffeur capacity is under-utilised", detail: `${inProgress} live trips against ${active} active chauffeurs.`, action: "Trim shifts or launch a demand campaign for the quiet window." });
    }

    // Dormant customers
    const last = new Map<string, number>();
    bookings.forEach((b: Row) => last.set(b.user_id, Math.max(last.get(b.user_id) ?? 0, new Date(b.created_at).getTime())));
    const dormant = profiles.filter((p: Row) => { const t = last.get(p.id); return t && Date.now() - t > 60 * day; }).length;
    if (dormant) {
      out.push({ icon: Users, tone: "warn", title: `${dormant} customers have gone quiet`, detail: "No booking in the last 60 days despite prior travel.", action: "Send a targeted reactivation broadcast with a loyalty incentive." });
    }

    // Fraud / risk signal
    const unpaidHigh = bookings.filter((b: Row) => b.payment_status !== "paid" && Number(b.total_price) > 250000).length;
    if (unpaidHigh) {
      out.push({ icon: AlertTriangle, tone: "bad", title: `${unpaidHigh} high-value bookings remain unpaid`, detail: "Large unsettled bookings carry both revenue and fraud risk.", action: "Require deposit on bookings above ₦250,000." });
    }
    if (incidents.filter((i: Row) => !i.resolved).length >= 3) {
      out.push({ icon: AlertTriangle, tone: "bad", title: "Open incident backlog is growing", detail: `${incidents.filter((i: Row) => !i.resolved).length} unresolved chauffeur incidents.`, action: "Escalate to the Operations Director for same-day closure." });
    }

    // Forecast
    const recent = paid.filter((b: Row) => Date.now() - new Date(b.paid_at || b.created_at).getTime() < 28 * day);
    if (recent.length >= 4) {
      out.push({ icon: Sparkles, tone: "neutral", title: `Next week forecast: ~${Math.round(recent.length / 4)} bookings`, detail: `Based on a four-week trailing average of ${naira(sum(recent) / 4)} weekly revenue.`, action: "Plan chauffeur rota and vehicle availability to this baseline." });
    }
    return out;
  }, [bookings, drivers, reviews, profiles, incidents]);

  return (
    <SuperLayout title="AI Operations" subtitle="An executive copilot that reads live platform data and surfaces what deserves your attention today.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Signals" value={insights.length.toString()} />
        <CStat label="Risks" value={insights.filter((i) => i.tone === "bad").length.toString()} tone="bad" />
        <CStat label="Watch items" value={insights.filter((i) => i.tone === "warn").length.toString()} tone="warn" />
        <CStat label="Positive" value={insights.filter((i) => i.tone === "good").length.toString()} tone="good" />
      </div>

      <CPanel title="Executive Briefing">
        <div className="divide-y divide-border">
          {insights.map((i, idx) => (
            <div key={idx} className="p-4 flex gap-4">
              <i.icon className={`h-4 w-4 mt-1 shrink-0 ${i.tone === "bad" ? "text-crimson" : i.tone === "warn" ? "text-amber-300" : i.tone === "good" ? "text-emerald-300" : "text-gold"}`} />
              <div>
                <div className="text-sm">{i.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{i.detail}</div>
                <div className="text-[11px] text-gold mt-1">Recommendation · {i.action}</div>
              </div>
            </div>
          ))}
          {!insights.length && <CEmpty>Not enough activity yet to generate insights.</CEmpty>}
        </div>
      </CPanel>
    </SuperLayout>
  );
}
