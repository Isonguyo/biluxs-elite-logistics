import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Stat, SectionTitle } from "@/components/portal/PortalLayout";
import { useProfile, tierOf, TIERS, ngn, dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/loyalty")({
  head: () => ({ meta: [
    { title: "Rewards — BiLUXS Member Portal" },
    { name: "description", content: "Your BiLUXS tier, points balance and member benefits." },
    { property: "og:title", content: "Rewards — BiLUXS" },
    { property: "og:description", content: "Your BiLUXS tier, points balance and member benefits." },
  ] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [trips, setTrips] = useState<{ id: string; waybill_code: string; total_price: number; paid_at: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings").select("id,waybill_code,total_price,paid_at")
      .eq("user_id", user.id).eq("payment_status", "paid")
      .order("paid_at", { ascending: false }).limit(12)
      .then(({ data }) => setTrips((data as typeof trips) ?? []));
  }, [user]);

  const points = profile?.loyalty_points ?? 0;
  const { current, next, toNext } = tierOf(points);
  const pct = next ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100)) : 100;

  return (
    <PortalLayout title="Rewards" subtitle="Every naira spent earns points. Points unlock tiers, upgrades and complimentary services.">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Current tier" value={current.label} accent="text-gold" hint={next ? `${toNext} pts to ${next.label}` : "Highest tier reached"} />
        <Stat label="Points balance" value={points.toLocaleString()} hint="1 pt per ₦1,000 paid" />
        <Stat label="Qualifying trips" value={trips.length.toString()} hint="Paid journeys" />
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
          <span className="text-gold inline-flex items-center gap-2"><Crown className="h-3.5 w-3.5" /> {current.label}</span>
          <span className="text-muted-foreground">{next ? next.label : "Elite"}</span>
        </div>
        <div className="mt-3 h-2 bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-crimson transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          {next ? `${toNext.toLocaleString()} points to unlock ${next.label} benefits.` : "You enjoy every BiLUXS benefit available."}
        </div>
      </Card>

      <SectionTitle>Tiers & benefits</SectionTitle>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {TIERS.map((t) => {
          const active = t.key === current.key;
          const unlocked = points >= t.min;
          return (
            <Card key={t.key} className={active ? "border-gold" : unlocked ? "border-emerald-500/40" : ""}>
              <div className="flex items-center justify-between">
                <div className="font-display text-xl">{t.label}</div>
                {active && <span className="text-[9px] uppercase tracking-[0.3em] text-gold">Current</span>}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{t.min.toLocaleString()}+ points</div>
              <ul className="mt-4 space-y-2">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[12px] text-white/80">
                    <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${unlocked ? "text-emerald-400" : "text-white/25"}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <SectionTitle action={<Link to="/portal/trips" className="text-[10px] uppercase tracking-widest text-gold">All trips</Link>}>
        Points activity
      </SectionTitle>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="text-left p-4">Waybill</th><th className="text-left p-4">Paid</th>
            <th className="text-right p-4">Value</th><th className="text-right p-4">Points earned</th>
          </tr></thead>
          <tbody>
            {trips.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No qualifying journeys yet.</td></tr>
            )}
            {trips.map((t) => (
              <tr key={t.id} className="border-b border-border/60">
                <td className="p-4 font-display tracking-widest">{t.waybill_code}</td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">{dt(t.paid_at)}</td>
                <td className="p-4 text-right">{ngn(t.total_price)}</td>
                <td className="p-4 text-right text-gold">+{Math.max(1, Math.floor(Number(t.total_price) / 1000))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalLayout>
  );
}
