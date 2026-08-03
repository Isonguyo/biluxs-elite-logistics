import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/payments")({ component: Page });

function Page() {
  const { rows: bookings, reload } = useTable("bookings");
  const { rows: txns } = useTable("wallet_transactions");
  const { rows: methods } = useTable("payment_methods", { realtime: false });
  const [tab, setTab] = useState<"transactions" | "outstanding" | "wallet" | "methods">("transactions");

  const paid = bookings.filter((b) => b.payment_status === "paid");
  const outstanding = bookings.filter((b) => b.payment_status !== "paid" && b.status !== "cancelled");
  const refunded = bookings.filter((b) => b.payment_status === "refunded");

  const refund = async (b: Row) => {
    const { error } = await (supabase as any).from("bookings").update({ payment_status: "refunded" }).eq("id", b.id);
    if (error) return toast.error(error.message);
    await logAudit("refund_payment", "booking", b.id, `${b.waybill_code} refunded ${naira(b.total_price)}`);
    toast.success(`Refunded ${b.waybill_code}`);
    void reload();
  };

  return (
    <AdminLayout title="Payments" subtitle="Transactions, refunds, invoices, wallet top-ups and outstanding balances.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Collected" value={naira(paid.reduce((a, b) => a + Number(b.total_price ?? 0), 0))} accent />
        <Stat label="Outstanding" value={naira(outstanding.reduce((a, b) => a + Number(b.total_price ?? 0), 0))} />
        <Stat label="Refunded" value={naira(refunded.reduce((a, b) => a + Number(b.total_price ?? 0), 0))} />
        <Stat label="Wallet Movements" value={txns.length.toString()} />
      </div>

      <div className="border border-border bg-card">
        <div className="p-2 border-b border-border flex gap-1 overflow-x-auto">
          {(["transactions", "outstanding", "wallet", "methods"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 h-9 text-[10px] uppercase tracking-widest border transition-colors ${
                tab === t ? "bg-gold text-[var(--navy-deep)] border-gold" : "border-transparent hover:border-gold/40 text-muted-foreground"
              }`}>{t}</button>
          ))}
        </div>

        {tab === "transactions" && (
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {paid.map((b: Row) => (
              <div key={b.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="font-display tracking-widest w-32">{b.waybill_code}</span>
                <span className="text-muted-foreground flex-1 truncate">{b.dropoff_location}</span>
                <Pill tone="good">paid</Pill>
                <span className="font-display">{naira(b.total_price)}</span>
                <button onClick={() => refund(b)} className="h-7 px-3 border border-border text-[10px] uppercase hover:border-crimson hover:text-crimson">Refund</button>
              </div>
            ))}
            {!paid.length && <Empty>No settled transactions.</Empty>}
          </div>
        )}

        {tab === "outstanding" && (
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {outstanding.map((b: Row) => (
              <div key={b.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="font-display tracking-widest w-32">{b.waybill_code}</span>
                <span className="text-muted-foreground flex-1 truncate">{b.pickup_location}</span>
                <span className="text-[10px] text-muted-foreground">{since(b.created_at)}</span>
                <Pill tone="warn">{b.payment_status ?? "pending"}</Pill>
                <span className="font-display">{naira(b.total_price)}</span>
              </div>
            ))}
            {!outstanding.length && <Empty>Nothing outstanding.</Empty>}
          </div>
        )}

        {tab === "wallet" && (
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {txns.map((t: Row) => (
              <div key={t.id} className="p-3 flex items-center gap-3 text-xs">
                <Pill tone={Number(t.amount) >= 0 ? "good" : "warn"}>{t.kind ?? t.type ?? "movement"}</Pill>
                <span className="text-muted-foreground flex-1 truncate">{t.description ?? t.reference ?? "Wallet transaction"}</span>
                <span className="text-[10px] text-muted-foreground">{since(t.created_at)}</span>
                <span className="font-display">{naira(t.amount)}</span>
              </div>
            ))}
            {!txns.length && <Empty>No wallet movements.</Empty>}
          </div>
        )}

        {tab === "methods" && (
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {methods.map((m: Row) => (
              <div key={m.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="uppercase tracking-widest">{m.brand ?? m.kind ?? "card"}</span>
                <span className="text-muted-foreground flex-1">•••• {m.last4 ?? "----"}</span>
                <span className="text-[10px] text-muted-foreground">{since(m.created_at)}</span>
              </div>
            ))}
            {!methods.length && <Empty>No stored payment methods.</Empty>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
