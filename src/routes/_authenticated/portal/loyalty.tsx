import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Check, Award, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { PortalLayout, Card, Stat, SectionTitle } from "@/components/portal/PortalLayout";
import { useProfile, tierOf, TIERS, ngn, dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/loyalty")({
  head: () => ({
    meta: [
      { title: "Rewards — BiLUXS Member Portal" },
      { name: "description", content: "Your BiLUXS tier, points balance and member benefits." },
      { property: "og:title", content: "Rewards — BiLUXS" },
      { property: "og:description", content: "Your BiLUXS tier, points balance and member benefits." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [trips, setTrips] = useState<{ id: string; waybill_code: string; total_price: number; paid_at: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,waybill_code,total_price,paid_at")
      .eq("user_id", user.id)
      .eq("payment_status", "paid")
      .order("paid_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setTrips((data as typeof trips) ?? []));
  }, [user]);

  const points = profile?.loyalty_points ?? 0;
  const { current, next, toNext } = tierOf(points);
  const pct = next ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100)) : 100;

  return (
    <PortalLayout
      title="Member Rewards & Tiers"
      subtitle="Every naira spent earns reward points. Points unlock exclusive tiers, upgrades, and bespoke complimentary services."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Current Tier</span>
              </div>
              <div className="text-2xl font-display text-gold mt-1">{current.label}</div>
              <div className="text-[11px] text-white/40 mt-1">
                {next ? `${toNext} pts to ${next.label}` : "Highest tier reached"}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Points Balance</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{points.toLocaleString()}</div>
              <div className="text-[11px] text-white/40 mt-1">1 pt per ₦1,000 paid</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Qualifying Trips</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{trips.length}</div>
              <div className="text-[11px] text-white/40 mt-1">Total paid journeys</div>
            </Card>
          </motion.div>
        </div>

        {/* Progress Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
              <span className="text-gold inline-flex items-center gap-2 font-medium">
                <Crown className="h-3.5 w-3.5" /> {current.label}
              </span>
              <span className="text-white/50">{next ? next.label : "Elite Status"}</span>
            </div>
            <div className="mt-3.5 h-2.5 bg-white/10 rounded-sm overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-gold via-amber-400 to-crimson rounded-sm transition-all duration-600"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 text-[12px] text-white/60">
              {next
                ? `${toNext.toLocaleString()} points needed to unlock ${next.label} tier benefits.`
                : "You currently enjoy every premier BiLUXS benefit available."}
            </div>
          </Card>
        </motion.div>

        {/* Tiers & Benefits Grid */}
        <div className="space-y-4">
          <SectionTitle>Tiers & Member Benefits</SectionTitle>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {TIERS.map((t, index) => {
              const active = t.key === current.key;
              const unlocked = points >= t.min;
              return (
                <motion.div
                  key={t.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <Card
                    className={`p-5 h-full flex flex-col justify-between transition-all ${
                      active
                        ? "border-gold bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/10 shadow-lg shadow-gold/5"
                        : unlocked
                        ? "border-emerald-500/40 bg-[#0a0511]/60"
                        : "border-white/10 bg-[#0a0511]/40 opacity-75"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-display text-xl text-white">{t.label}</div>
                        {active && (
                          <span className="text-[9px] uppercase tracking-[0.3em] text-gold font-medium px-2 py-0.5 bg-gold/10 border border-gold/20 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/50 tracking-wider mb-4">{t.min.toLocaleString()}+ points required</div>
                      <ul className="space-y-2.5">
                        {t.perks.map((p) => (
                          <li key={p} className="flex items-start gap-2.5 text-[12px] text-white/80 leading-relaxed">
                            <Check
                              className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                                unlocked ? "text-emerald-400" : "text-white/25"
                              }`}
                            />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Points Activity Section */}
        <div className="space-y-4">
          <SectionTitle
            action={
              <Link to="/portal/trips" className="text-[10px] uppercase tracking-widest text-gold hover:underline">
                All trips →
              </Link>
            }
          >
            Points Activity
          </SectionTitle>
          <Card className="p-0 overflow-x-auto border-white/10 bg-[#0a0511]/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-white/40 border-b border-white/10">
                  <th className="text-left p-4">Waybill</th>
                  <th className="text-left p-4">Paid Date</th>
                  <th className="text-right p-4">Journey Value</th>
                  <th className="text-right p-4">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40">
                      No qualifying journeys recorded yet.
                    </td>
                  </tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-display tracking-widest text-white/90">{t.waybill_code}</td>
                      <td className="p-4 text-white/50 whitespace-nowrap text-xs">{dt(t.paid_at)}</td>
                      <td className="p-4 text-right text-white/90">{ngn(t.total_price)}</td>
                      <td className="p-4 text-right text-gold font-medium">
                        +{Math.max(1, Math.floor(Number(t.total_price) / 1000))} pts
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
