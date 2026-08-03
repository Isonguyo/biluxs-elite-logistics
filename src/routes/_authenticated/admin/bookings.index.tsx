import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/bookings/")({ component: Page });

const STATUSES = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const;

function Page() {
  const { rows: bookings } = useTable("bookings");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = bookings.filter((b: Row) => {
    if (status !== "all" && b.status !== status) return false;
    if (!q) return true;
    const hay = `${b.waybill_code} ${b.pickup_location} ${b.dropoff_location}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AdminLayout title="Booking Management" subtitle="Every journey in the network. Open a booking to reach its full workspace — passenger, chauffeur, payment, QR, timeline and internal notes.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={bookings.length.toString()} />
        <Stat label="Active" value={bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).length.toString()} accent />
        <Stat label="Completed" value={bookings.filter((b) => b.status === "completed").length.toString()} />
        <Stat label="Paid Value" value={naira(bookings.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0))} />
      </div>

      <Panel
        title="All Bookings"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search waybill or route"
                className="h-8 pl-7 pr-2 bg-input border border-border text-xs outline-none focus:border-gold w-56" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="h-8 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      >
        <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
          {filtered.map((b: Row) => (
            <Link key={b.id} to="/admin/bookings/$id" params={{ id: b.id }}
              className="p-3 grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center hover:bg-white/[0.03]">
              <div>
                <div className="font-display tracking-widest">{b.waybill_code}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
              </div>
              <div className="text-xs min-w-0">
                <div className="truncate text-white/80">{b.pickup_location}</div>
                <div className="truncate text-muted-foreground">→ {b.dropoff_location}</div>
              </div>
              <Pill tone={b.payment_status === "paid" ? "good" : "warn"}>{b.payment_status}</Pill>
              <Pill tone={b.status === "completed" ? "good" : b.status === "cancelled" ? "bad" : "neutral"}>{b.status}</Pill>
              <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                {drivers.find((d) => d.id === b.driver_id)?.full_name ?? "Unassigned"}
              </div>
              <div className="font-display">{naira(b.total_price)}</div>
            </Link>
          ))}
          {!filtered.length && <Empty>No bookings match this filter.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
