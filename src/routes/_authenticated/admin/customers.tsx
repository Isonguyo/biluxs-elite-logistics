import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Page });

function Page() {
  const { rows: profiles } = useTable("profiles", { order: "created_at" });
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const { rows: roles } = useTable("user_roles", { order: "user_id", ascending: true, realtime: false });
  const { rows: wallets } = useTable("wallets", { order: "created_at", realtime: false });
  const { rows: tickets } = useTable("contact_messages", { realtime: false });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const rowsFor = (id: string) => bookings.filter((b) => b.user_id === id);
  const spendFor = (id: string) => rowsFor(id).filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0);
  const tierFor = (spend: number) => (spend >= 5_000_000 ? "Elite" : spend >= 2_000_000 ? "Diamond" : spend >= 500_000 ? "Gold" : "Member");

  const list = profiles.filter((p: Row) =>
    !q || `${p.full_name ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const active = sel ? profiles.find((p) => p.id === sel) : null;

  return (
    <AdminLayout title="Customer Management" subtitle="Member profiles, lifetime value, loyalty tier, wallet balance and support history. Roles are read-only here — grants belong to the Control Plane.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Customers" value={profiles.length.toString()} />
        <Stat label="Booked At Least Once" value={new Set(bookings.map((b) => b.user_id)).size.toString()} />
        <Stat label="Lifetime Revenue" value={naira(bookings.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0))} accent />
        <Stat label="Wallets Funded" value={wallets.filter((w: Row) => Number(w.balance ?? 0) > 0).length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <Panel title="Directory" action={
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone"
              className="h-8 pl-7 pr-2 bg-input border border-border text-xs outline-none focus:border-gold w-56" />
          </div>
        }>
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {list.map((p: Row) => {
              const spend = spendFor(p.id);
              return (
                <button key={p.id} onClick={() => setSel(p.id)}
                  className={`w-full text-left p-3 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center hover:bg-white/[0.03] ${sel === p.id ? "bg-white/[0.05]" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{p.full_name || "Unnamed member"}</div>
                    <div className="text-[10px] text-muted-foreground">{p.phone || p.id.slice(0, 12)}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {roles.filter((r: Row) => r.user_id === p.id).map((r: Row) => (
                      <Pill key={r.role} tone={r.role === "super_user" ? "bad" : r.role === "admin" ? "warn" : "neutral"}>{r.role}</Pill>
                    ))}
                  </div>
                  <Pill tone={spend >= 500_000 ? "good" : "neutral"}>{tierFor(spend)}</Pill>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Trips</div>
                    <div className="font-display">{rowsFor(p.id).length}</div>
                  </div>
                </button>
              );
            })}
            {!list.length && <Empty>No customers match.</Empty>}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Customer Profile">
            {!active ? <Empty>Select a member to open their profile.</Empty> : (
              <div className="p-4 space-y-3 text-sm">
                <div className="font-display text-xl">{active.full_name || "Unnamed member"}</div>
                <div className="text-xs text-muted-foreground">{active.phone || "No phone on file"}</div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <M label="Lifetime value" value={naira(spendFor(active.id))} />
                  <M label="Tier" value={tierFor(spendFor(active.id))} />
                  <M label="Trips" value={String(rowsFor(active.id).length)} />
                  <M label="Wallet" value={naira(wallets.find((w: Row) => w.user_id === active.id)?.balance ?? 0)} />
                  <M label="Joined" value={since(active.created_at)} />
                  <M label="Cancelled" value={String(rowsFor(active.id).filter((b) => b.status === "cancelled").length)} />
                </div>
              </div>
            )}
          </Panel>

          {active && (
            <>
              <Panel title="Booking History">
                <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
                  {rowsFor(active.id).map((b: Row) => (
                    <div key={b.id} className="p-3 flex items-center gap-2 text-xs">
                      <span className="font-display tracking-widest">{b.waybill_code}</span>
                      <span className="text-muted-foreground truncate flex-1">{b.dropoff_location}</span>
                      <span className="font-display">{naira(b.total_price)}</span>
                    </div>
                  ))}
                  {!rowsFor(active.id).length && <Empty>No journeys yet.</Empty>}
                </div>
              </Panel>
              <Panel title="Support History">
                <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
                  {tickets.filter((t: Row) => t.email && active.email && t.email === active.email).map((t: Row) => (
                    <div key={t.id} className="p-3 text-xs">{t.message}</div>
                  ))}
                  <Empty>Linked by email — no matching tickets.</Empty>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function M({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
