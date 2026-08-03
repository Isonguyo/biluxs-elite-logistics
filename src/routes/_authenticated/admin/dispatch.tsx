import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/dispatch")({ component: Page });

function Page() {
  const { rows: bookings, reload } = useTable("bookings");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true });
  const [busyId, setBusyId] = useState<string | null>(null);

  const waiting = bookings.filter((b) => !b.driver_id && ["pending", "confirmed"].includes(b.status));
  const available = drivers.filter((d) => d.availability === "online" || d.status === "active");

  const assign = async (booking: Row, driverId: string) => {
    if (!driverId) return;
    setBusyId(booking.id);
    const { error } = await supabase.from("bookings").update({ driver_id: driverId, status: "confirmed" } as never).eq("id", booking.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    const d = drivers.find((x) => x.id === driverId);
    await logAudit("assign_driver", "booking", booking.id, `${booking.waybill_code} → ${d?.full_name ?? driverId}`);
    await (supabase as any).from("trip_events").insert({ booking_id: booking.id, event: "assigned", note: `Dispatched to ${d?.full_name ?? "driver"}` });
    if (booking.user_id) {
      await (supabase as any).from("notifications").insert({
        user_id: booking.user_id, title: "Chauffeur assigned",
        body: `${d?.full_name ?? "Your chauffeur"} is assigned to ${booking.waybill_code}.`, kind: "trip",
      });
    }
    toast.success(`Dispatched ${booking.waybill_code} → ${d?.full_name}`);
    void reload();
  };

  const autoAssign = async (booking: Row) => {
    const pick = available.find((d) => !bookings.some((b) => b.driver_id === d.id && b.status === "in_progress"));
    if (!pick) return toast.error("No available chauffeur — all units engaged.");
    await assign(booking, pick.id);
  };

  return (
    <AdminLayout title="Dispatch Center" subtitle="Match waiting journeys to available chauffeurs. Auto-assign picks the first idle online unit; manual override always wins.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Waiting" value={waiting.length.toString()} accent={waiting.length > 0} />
        <Stat label="Available Units" value={available.length.toString()} />
        <Stat label="In Progress" value={bookings.filter((b) => b.status === "in_progress").length.toString()} />
        <Stat label="Fleet Size" value={drivers.length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <Panel title="Waiting Bookings">
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {waiting.map((b) => (
              <div key={b.id} className="p-4 grid md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center">
                <div>
                  <div className="font-display tracking-widest">{b.waybill_code}</div>
                  <div className="text-[10px] text-muted-foreground">{since(b.created_at)}</div>
                </div>
                <div className="text-xs min-w-0">
                  <div className="truncate text-white/80">{b.pickup_location}</div>
                  <div className="truncate text-muted-foreground">→ {b.dropoff_location}</div>
                </div>
                <div className="font-display">{naira(b.total_price)}</div>
                <select defaultValue="" onChange={(e) => assign(b, e.target.value)} disabled={busyId === b.id}
                  className="bg-input border border-border h-9 px-2 text-[10px] uppercase focus:outline-none focus:border-gold">
                  <option value="">— Manual assign —</option>
                  {available.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
                <button onClick={() => autoAssign(b)} disabled={busyId === b.id}
                  className="h-9 px-3 inline-flex items-center gap-2 border border-gold text-gold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] transition-colors">
                  <Zap className="h-3 w-3" /> Auto
                </button>
              </div>
            ))}
            {!waiting.length && <Empty>Queue clear — every journey has a chauffeur.</Empty>}
          </div>
        </Panel>

        <Panel title="Chauffeur Availability">
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {drivers.map((d) => {
              const onTrip = bookings.some((b) => b.driver_id === d.id && b.status === "in_progress");
              return (
                <div key={d.id} className="p-3 flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-gold shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{d.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{since(d.last_seen_at)}</div>
                  </div>
                  <Pill tone={onTrip ? "warn" : d.availability === "online" ? "good" : "neutral"}>
                    {onTrip ? "on trip" : d.availability ?? d.status ?? "offline"}
                  </Pill>
                </div>
              );
            })}
            {!drivers.length && <Empty>No chauffeurs registered.</Empty>}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
