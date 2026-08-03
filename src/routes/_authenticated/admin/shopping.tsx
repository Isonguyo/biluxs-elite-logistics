import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/shopping")({ component: Page });

const STAGES = ["requested", "sourcing", "purchased", "shipping", "customs", "delivered", "returned"];

function Page() {
  const { rows: orders, reload } = useTable("shop_orders");

  const setStatus = async (o: Row, status: string) => {
    const { error } = await (supabase as any).from("shop_orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    await logAudit("update_shop_order", "shop_order", o.id, `Status → ${status}`);
    void reload();
  };

  return (
    <AdminLayout title="Luxury Shopping" subtitle="Personal-shopper orders, vendor sourcing, shipping, customs and returns.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Orders" value={orders.length.toString()} />
        <Stat label="Sourcing" value={orders.filter((o) => o.status === "sourcing").length.toString()} accent />
        <Stat label="Delivered" value={orders.filter((o) => o.status === "delivered").length.toString()} />
        <Stat label="Order Value" value={naira(orders.reduce((a, o) => a + Number(o.budget ?? o.total ?? 0), 0))} />
      </div>

      <Panel title="Order Book">
        <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
          {orders.map((o: Row) => (
            <div key={o.id} className="p-4 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-sm truncate">{o.item ?? o.brand ?? "Sourcing request"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{o.notes ?? o.details ?? ""} · {since(o.created_at)}</div>
              </div>
              <div className="font-display">{naira(o.budget ?? o.total ?? 0)}</div>
              <Pill tone={o.status === "delivered" ? "good" : o.status === "returned" ? "bad" : "warn"}>{o.status ?? "requested"}</Pill>
              <select value={o.status ?? "requested"} onChange={(e) => setStatus(o, e.target.value)}
                className="h-9 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          {!orders.length && <Empty>No shopping orders yet.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
