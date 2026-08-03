import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Phone } from "lucide-react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, since, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/drivers")({ component: Page });

function Page() {
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true });
  const { rows: stats } = useTable("driver_stats", { order: "completed_rides", realtime: false });
  const { rows: reviews } = useTable("driver_reviews", { realtime: false });
  const { rows: incidents } = useTable("driver_incidents", { realtime: false });
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const [sel, setSel] = useState<string | null>(null);

  const active = sel ? drivers.find((d) => d.id === sel) : null;
  const stat = (id: string) => stats.find((s: Row) => s.driver_id === id);

  return (
    <AdminLayout title="Driver Management" subtitle="Chauffeur roster, performance, documents, incidents and live presence.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Chauffeurs" value={drivers.length.toString()} />
        <Stat label="Online" value={drivers.filter((d) => d.availability === "online").length.toString()} accent />
        <Stat label="Luxury Certified" value={drivers.filter((d) => d.luxury_certified).length.toString()} />
        <Stat label="Open Incidents" value={incidents.filter((i: Row) => i.status !== "resolved").length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <Panel title="Roster">
          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {drivers.map((d: Row) => {
              const s = stat(d.id);
              return (
                <button key={d.id} onClick={() => setSel(d.id)}
                  className={`w-full text-left p-3 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center hover:bg-white/[0.03] ${sel === d.id ? "bg-white/[0.05]" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{d.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.phone} · {since(d.last_seen_at)}</div>
                  </div>
                  <Pill tone={d.availability === "online" ? "good" : d.availability === "emergency" ? "bad" : "neutral"}>
                    {d.availability ?? d.status ?? "offline"}
                  </Pill>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Trips</div>
                    <div className="font-display">{s?.completed_rides ?? 0}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Rating</div>
                    <div className="font-display text-gold inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold" /> {Number(s?.avg_rating ?? 0).toFixed(1)}
                    </div>
                  </div>
                </button>
              );
            })}
            {!drivers.length && <Empty>No chauffeurs registered.</Empty>}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Driver Profile">
            {!active ? (
              <Empty>Select a chauffeur to open their dossier.</Empty>
            ) : (
              <div className="p-4 space-y-3 text-sm">
                <div className="font-display text-xl">{active.full_name}</div>
                <div className="text-xs text-muted-foreground">{active.phone}</div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Meta label="Licence" value={active.license_number ?? "—"} />
                  <Meta label="Vehicle" value={active.vehicle_id ?? "—"} />
                  <Meta label="Certified" value={active.luxury_certified ? "Luxury" : "Standard"} />
                  <Meta label="Last seen" value={since(active.last_seen_at)} />
                  <Meta label="Completed" value={String(stat(active.id)?.completed_rides ?? 0)} />
                  <Meta label="Reviews" value={String(stat(active.id)?.review_count ?? 0)} />
                </div>
                <div className="pt-2">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Revenue generated</div>
                  <div className="font-display text-lg text-gold">
                    {naira(bookings.filter((b) => b.driver_id === active.id && b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0))}
                  </div>
                </div>
                {active.phone && (
                  <a href={`tel:${active.phone}`} className="h-9 px-3 inline-flex items-center gap-2 border border-gold text-gold text-[10px] uppercase tracking-widest">
                    <Phone className="h-3 w-3" /> Call chauffeur
                  </a>
                )}
              </div>
            )}
          </Panel>

          {active && (
            <>
              <Panel title="Ratings & Reviews">
                <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                  {reviews.filter((r: Row) => r.driver_id === active.id).map((r: Row) => (
                    <div key={r.id} className="p-3">
                      <div className="text-gold text-xs">{"★".repeat(Number(r.rating ?? 0))}</div>
                      <div className="text-xs text-white/80 mt-1">{r.comment}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{since(r.created_at)}</div>
                    </div>
                  ))}
                  {!reviews.some((r: Row) => r.driver_id === active.id) && <Empty>No reviews yet.</Empty>}
                </div>
              </Panel>
              <Panel title="Incidents">
                <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
                  {incidents.filter((i: Row) => i.driver_id === active.id).map((i: Row) => (
                    <div key={i.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <Pill tone={i.severity === "critical" ? "bad" : "warn"}>{i.kind ?? i.severity}</Pill>
                        <span className="text-[10px] text-muted-foreground">{since(i.created_at)}</span>
                      </div>
                      <div className="text-xs text-white/80 mt-1">{i.description}</div>
                    </div>
                  ))}
                  {!incidents.some((i: Row) => i.driver_id === active.id) && <Empty>Clean record.</Empty>}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}
