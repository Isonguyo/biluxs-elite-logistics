import { createFileRoute } from "@tanstack/react-router";
import { useCP } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/finance")({ component: Page });

function Page() {
  const { rows: bookings } = useTable("bookings", { limit: 1000 });
  const { rows: wallets } = useTable("wallets", { order: "updated_at", limit: 500 });
  const { rows: tx } = useTable("wallet_transactions", { limit: 500 });
  const { rows: corp } = useTable("corporate_accounts", { limit: 200 });
  const { rows: pricing } = useCP("pricing_rules");

  const paid = bookings.filter((b: Row) => b.payment_status === "paid");
  const revenue = paid.reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0);
  const outstanding = bookings.filter((b: Row) => b.payment_status !== "paid").reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0);
  const refunds = tx.filter((t: Row) => t.kind === "refund").reduce((a: number, t: Row) => a + Number(t.amount || 0), 0);
  const vat = Number(pricing.find((p: Row) => p.key === "tax_vat")?.value ?? 0);
  const fee = Number(pricing.find((p: Row) => p.key === "service_fee")?.value ?? 0);
  const bonus = Number(pricing.find((p: Row) => p.key === "driver_bonus")?.value ?? 0);
  const tax = revenue * vat / 100;
  const commission = revenue * fee / 100;
  const payouts = paid.length * bonus;
  const walletFloat = wallets.reduce((a: number, w: Row) => a + Number(w.balance || 0), 0);

  return (
    <SuperLayout title="Financial Center" subtitle="Revenue, commission, tax exposure, refunds, payouts and wallet float — computed from the live pricing engine.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Gross revenue" value={naira(revenue)} tone="good" />
        <CStat label="Commission" value={naira(commission)} hint={`${fee}% service fee`} />
        <CStat label="Tax (VAT)" value={naira(tax)} hint={`${vat}%`} />
        <CStat label="Profit after fees" value={naira(revenue - tax - payouts)} tone="good" />
        <CStat label="Outstanding" value={naira(outstanding)} tone="warn" />
        <CStat label="Refunds" value={naira(refunds)} tone={refunds ? "bad" : "neutral"} />
        <CStat label="Driver payouts" value={naira(payouts)} hint={`${paid.length} completed trips`} />
        <CStat label="Wallet float" value={naira(walletFloat)} hint={`${wallets.length} wallets`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Corporate Accounts">
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {corp.map((c: Row) => (
              <div key={c.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{c.company_name}</span>
                <span className="text-muted-foreground truncate">{c.contact_email}</span>
                <span className={c.approved ? "text-emerald-300" : "text-amber-300"}>{c.approved ? "Approved" : "Pending"}</span>
              </div>
            ))}
            {!corp.length && <CEmpty>No corporate accounts.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="Recent Ledger">
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {tx.slice(0, 40).map((t: Row) => (
              <div key={t.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{t.description ?? t.kind}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.kind}</span>
                <span className="font-display">{naira(t.amount)}</span>
                <span className="text-[10px] text-muted-foreground">{since(t.created_at)}</span>
              </div>
            ))}
            {!tx.length && <CEmpty>No wallet activity.</CEmpty>}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
