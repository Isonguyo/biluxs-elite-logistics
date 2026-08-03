import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/tourism")({ component: Page });

function Page() {
  const { rows: tours, reload } = useTable("tour_bookings");

  const setStatus = async (t: Row, status: string) => {
    const { error } = await (supabase as any).from("tour_bookings").update({ status }).eq("id", t.id);
    if (error) return toast.error(error.message);
    await logAudit("update_tour", "tour_booking", t.id, `Status → ${status}`);
    void reload();
  };

  return (
    <AdminLayout title="Tourism" subtitle="Destination packages, seasonal offers and guest itineraries.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Bookings" value={tours.length.toString()} />
        <Stat label="Pending" value={tours.filter((t) => (t.status ?? "pending") === "pending").length.toString()} accent />
        <Stat label="Confirmed" value={tours.filter((t) => t.status === "confirmed").length.toString()} />
        <Stat label="Value" value={naira(tours.reduce((a, t) => a + Number(t.budget ?? t.price ?? 0), 0))} />
      </div>

      <Panel title="Tour Requests">
        <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
          {tours.map((t: Row) => (
            <div key={t.id} className="p-4 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-sm truncate">{t.package_name ?? t.destination ?? "Custom itinerary"}</div>
                <div className="text-[10px] text-muted-foreground">{t.notes ?? t.details ?? ""} · {since(t.created_at)}</div>
              </div>
              <div className="font-display">{naira(t.budget ?? t.price ?? 0)}</div>
              <Pill tone={t.status === "confirmed" ? "good" : "warn"}>{t.status ?? "pending"}</Pill>
              <select value={t.status ?? "pending"} onChange={(e) => setStatus(t, e.target.value)}
                className="h-9 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          {!tours.length && <Empty>No tour bookings yet.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
