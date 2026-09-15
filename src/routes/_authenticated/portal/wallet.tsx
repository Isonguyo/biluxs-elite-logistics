import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck } from "lucide-react";
import { PortalLayout, Card, Stat, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt, useWallet } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — BiLUXS Member Portal" },
      { name: "description", content: "Your BiLUXS wallet balance, top-ups, refunds, credits and transaction history." },
      { property: "og:title", content: "Wallet — BiLUXS" },
      { property: "og:description", content: "Top up, view credits and review every wallet transaction." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { balance, tx, reload } = useWallet();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const topUp = async (value: number) => {
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("wallet_topup", { _amount: value, _description: "Wallet top-up" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Wallet credited with ${ngn(value)}`);
    setAmount("");
    void reload();
  };

  const credits = tx.filter((t) => ["credit", "bonus", "refund"].includes(t.kind)).reduce((s, t) => s + Number(t.amount), 0);
  const spent = tx.filter((t) => t.kind === "payment").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <PortalLayout
      title="Member Wallet"
      subtitle="Pre-fund your journeys and settle expenses in one tap. Refunds and bonuses land here instantly."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Balance</span>
              </div>
              <div className="text-2xl font-display text-emerald-400 mt-1">{ngn(balance)}</div>
              <div className="text-[11px] text-white/40 mt-1">Available for immediate use</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Credits & Refunds</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{ngn(credits)}</div>
              <div className="text-[11px] text-white/40 mt-1">Lifetime total accrued</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Spent</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{ngn(Math.abs(spent))}</div>
              <div className="text-[11px] text-white/40 mt-1">Lifetime total disbursed</div>
            </Card>
          </motion.div>
        </div>

        {/* Top Up Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
              <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <PlusCircle className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">Top Up Wallet</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Instant Secure Funding
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">Quick Select Amounts</div>
              <div className="flex flex-wrap gap-3">
                {[25000, 50000, 100000, 250000].map((v) => (
                  <button
                    key={v}
                    disabled={busy}
                    onClick={() => topUp(v)}
                    className="px-5 h-11 border border-white/10 bg-white/[0.02] hover:border-gold text-white text-[11px] font-medium tracking-widest rounded-sm transition-all disabled:opacity-50"
                  >
                    {ngn(v)}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">Custom Amount</div>
                <div className="flex gap-3 max-w-md">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    placeholder="Enter amount (₦)"
                    className="flex-1 h-11 bg-white/[0.03] border border-white/10 rounded-sm px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold transition-colors"
                  />
                  <button
                    disabled={busy}
                    onClick={() => topUp(Number(amount))}
                    className="h-11 px-6 bg-gold text-navy-deep font-medium text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/90 transition-all disabled:opacity-50 shrink-0"
                  >
                    Top Up
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
              <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
              <span>All transactions are encrypted and secured through the BiLUXS payment gateway.</span>
            </div>
          </Card>
        </motion.div>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <SectionTitle>Transaction History</SectionTitle>
          {tx.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No wallet transactions yet." />
            </Card>
          ) : (
            <Card className="p-0 overflow-x-auto border-white/10 bg-[#0a0511]/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-right p-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tx.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white/50 whitespace-nowrap text-xs">{dt(t.created_at)}</td>
                      <td className="p-4 text-white/90">{t.description ?? "—"}</td>
                      <td className="p-4 capitalize text-white/60 text-xs">{String(t.kind).replace(/_/g, " ")}</td>
                      <td className={`p-4 text-right font-medium ${Number(t.amount) < 0 ? "text-crimson" : "text-emerald-400"}`}>
                        {ngn(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
