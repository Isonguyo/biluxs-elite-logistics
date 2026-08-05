import { createFileRoute } from "@tanstack/react-router";
import { useCP } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/customers")({ component: Page });

function Page() {
  const { rows: profiles } = useTable("profiles", { limit: 1000 });
  const { rows: bookings } = useTable("bookings", { limit: 1000 });
  const spend = new Map<string, number>();
  const trips = new Map<string, number>();
  bookings.forEach((b: Row) => {
    trips.set(b.user_id, (trips.get(b.user_id) ?? 0) + 1);
    if (b.payment_status === "paid") spend.set(b.user_id, (spend.get(b.user_id) ?? 0) + Number(b.total_price || 0));
  });
  const list: (Row & { spend: number; trips: number })[] = profiles
    .map((p: Row) => ({ ...p, spend: spend.get(p.id) ?? 0, trips: trips.get(p.id) ?? 0 }))
    .sort((a, b) => b.spend - a.spend);
  const vip = list.filter((c) => c.spend >= 500000);

  return (
    <SuperLayout title="Customer Intelligence" subtitle="A CRM view of the customer base — lifetime spend, travel frequency, loyalty tier and VIP status.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Customers" value={list.length.toString()} />
        <CStat label="VIP (₦500k+)" value={vip.length.toString()} tone="good" />
        <CStat label="Avg lifetime value" value={naira(list.length ? list.reduce((a, c) => a + c.spend, 0) / list.length : 0)} />
        <CStat label="Elite tier" value={list.filter((c: Row) => c.loyalty_tier === "elite").length.toString()} />
      </div>
      <CPanel title="Customer Ledger">
        <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
          {list.map((c) => (
            <div key={c.id} className="p-3 flex items-center gap-3 text-xs">
              <span className="flex-1 truncate">{c.full_name ?? c.id.slice(0, 8)}</span>
              <span className="text-[10px] uppercase tracking-widest text-gold">{c.loyalty_tier}</span>
              <span className="text-muted-foreground">{c.trips} trips</span>
              <span className="font-display">{naira(c.spend)}</span>
              {c.spend >= 500000 && <span className="text-[9px] uppercase tracking-widest bg-crimson/20 text-crimson px-1.5 py-0.5">VIP</span>}
            </div>
          ))}
          {!list.length && <CEmpty>No customers yet.</CEmpty>}
        </div>
      </CPanel>
    </SuperLayout>
  );
}
