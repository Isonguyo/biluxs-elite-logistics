import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalLayout, Card, Stat, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt, useWallet } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/wallet")({
  head: () => ({ meta: [
    { title: "Wallet — BiLUXS Member Portal" },
    { name: "description", content: "Your BiLUXS wallet balance, top-ups, refunds, credits and transaction history." },
    { property: "og:title", content: "Wallet — BiLUXS" },
    { property: "og:description", content: "Top up, view credits and review every wallet transaction." },
  ] }),
  component: Page,
});

function Page() {
  const { balance, tx, reload } = useWallet();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const topUp = async (value: number) => {
    if (!value || value <= 0) { toast.error("Enter a valid amount"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("wallet_topup", { _amount: value, _description: "Wallet top-up" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Wallet credited with ${ngn(value)}`);
    setAmount("");
    void reload();
  };

  const credits = tx.filter((t) => ["credit", "bonus", "refund"].includes(t.kind)).reduce((s, t) => s + Number(t.amount), 0);
  const spent = tx.filter((t) => t.kind === "payment").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <PortalLayout title="Wallet" subtitle="Pre-fund your journeys and pay in one tap. Refunds and credits land here instantly.">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Balance" value={ngn(balance)} accent="text-emerald-400" hint="Available now" />
        <Stat label="Credits & refunds" value={ngn(credits)} hint="Lifetime" />
        <Stat label="Spent from wallet" value={ngn(Math.abs(spent))} hint="Lifetime" />
      </div>

      <Card className="mt-4">
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Top up</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[25000, 50000, 100000, 250000].map((v) => (
            <button key={v} disabled={busy} onClick={() => topUp(v)}
              className="px-4 h-10 border border-border hover:border-gold text-[11px] tracking-widest disabled:opacity-50">{ngn(v)}</button>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Custom amount"
            className="flex-1 h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <button disabled={busy} onClick={() => topUp(Number(amount))}
            className="h-11 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">Top up</button>
        </div>
      </Card>

      <SectionTitle>Transaction history</SectionTitle>
      {tx.length === 0 ? <Empty text="No transactions yet." /> : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left p-4">Date</th><th className="text-left p-4">Description</th>
              <th className="text-left p-4">Type</th><th className="text-right p-4">Amount</th>
            </tr></thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{dt(t.created_at)}</td>
                  <td className="p-4">{t.description ?? "—"}</td>
                  <td className="p-4 capitalize text-muted-foreground">{String(t.kind).replace(/_/g, " ")}</td>
                  <td className={`p-4 text-right ${Number(t.amount) < 0 ? "text-crimson" : "text-emerald-400"}`}>{ngn(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PortalLayout>
  );
}
