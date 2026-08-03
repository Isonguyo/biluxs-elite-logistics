import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { ChevronLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/bookings/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  const [booking, setBooking] = useState<Row | null>(null);
  const [passenger, setPassenger] = useState<Row | null>(null);
  const [events, setEvents] = useState<Row[]>([]);
  const [notes, setNotes] = useState<Row[]>([]);
  const [note, setNote] = useState("");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });

  const load = async () => {
    const { data: b } = await (supabase as any).from("bookings").select("*").eq("id", id).maybeSingle();
    setBooking(b ?? null);
    if (b?.user_id) {
      const { data: p } = await (supabase as any).from("profiles").select("*").eq("id", b.user_id).maybeSingle();
      setPassenger(p ?? null);
    }
    const { data: ev } = await (supabase as any).from("trip_events").select("*").eq("booking_id", id).order("created_at", { ascending: true });
    setEvents(ev ?? []);
    const { data: nt } = await (supabase as any).from("booking_notes").select("*").eq("booking_id", id).order("created_at", { ascending: false });
    setNotes(nt ?? []);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const update = async (patch: Record<string, unknown>, label: string) => {
    const { error } = await (supabase as any).from("bookings").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("update_booking", "booking", id, label);
    toast.success(label);
    void load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("booking_notes").insert({
      booking_id: id, note: note.trim(), author_id: u.user?.id,
      author_name: (u.user?.user_metadata as any)?.full_name ?? u.user?.email ?? "Staff",
    });
    if (error) return toast.error(error.message);
    setNote("");
    await logAudit("add_note", "booking", id, "Internal comment added");
    void load();
  };

  if (!booking) {
    return <AdminLayout title="Booking Workspace"><Empty>Loading booking…</Empty></AdminLayout>;
  }

  const driver = drivers.find((d) => d.id === booking.driver_id);

  return (
    <AdminLayout
      title={`Booking ${booking.waybill_code}`}
      subtitle="Full operational workspace for this journey."
      actions={
        <Link to="/admin/bookings" className="h-9 px-3 inline-flex items-center gap-1 border border-border text-[10px] uppercase tracking-widest hover:border-gold">
          <ChevronLeft className="h-3 w-3" /> Bookings
        </Link>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Panel title="Journey">
            <div className="p-4 grid sm:grid-cols-2 gap-4 text-sm">
              <Field label="Pickup" value={booking.pickup_location} />
              <Field label="Dropoff" value={booking.dropoff_location} />
              <Field label="Scheduled" value={booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : "On demand"} />
              <Field label="Created" value={new Date(booking.created_at).toLocaleString()} />
              <Field label="Distance" value={booking.distance_km ? `${booking.distance_km} km` : "—"} />
              <Field label="Luxury Protocol" value={booking.luxury_protocol === false ? "Standard" : "+20% applied"} />
            </div>
          </Panel>

          <Panel title="Operations Control">
            <div className="p-4 flex flex-wrap gap-3 items-center">
              <select value={booking.status} onChange={(e) => update({ status: e.target.value }, `Status → ${e.target.value}`)}
                className="h-9 px-3 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={booking.driver_id ?? ""} onChange={(e) => update({ driver_id: e.target.value || null }, e.target.value ? "Chauffeur assigned" : "Chauffeur unassigned")}
                className={`h-9 px-3 bg-input border text-[10px] uppercase outline-none focus:border-gold ${booking.driver_id ? "border-gold text-gold" : "border-border"}`}>
                <option value="">— Chauffeur —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              <select value={booking.payment_status ?? "pending"} onChange={(e) => update({ payment_status: e.target.value }, `Payment → ${e.target.value}`)}
                className="h-9 px-3 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {["pending", "paid", "refunded", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Panel>

          <Panel title="Timeline">
            <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {events.map((e) => (
                <div key={e.id} className="p-3 flex items-center gap-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="uppercase tracking-widest text-white/80">{e.event}</span>
                  <span className="text-muted-foreground flex-1 truncate">{e.note}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))}
              {!events.length && <Empty>No timeline events recorded.</Empty>}
            </div>
          </Panel>

          <Panel title="Internal Comments">
            <div className="p-3 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an operator note (staff only)…"
                className="flex-1 h-9 px-3 bg-input border border-border text-xs outline-none focus:border-gold" />
              <button onClick={addNote} className="h-9 px-4 inline-flex items-center gap-2 border border-gold text-gold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)]">
                <Send className="h-3 w-3" /> Post
              </button>
            </div>
            <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="p-3">
                  <div className="text-xs text-white/85 whitespace-pre-wrap">{n.note}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{n.author_name} · {new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
              {!notes.length && <Empty>No internal comments yet.</Empty>}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Passenger">
            <div className="p-4 space-y-2 text-sm">
              <Field label="Name" value={passenger?.full_name ?? "—"} />
              <Field label="Phone" value={passenger?.phone ?? "—"} />
              <Field label="Account" value={booking.user_id ? booking.user_id.slice(0, 12) : "Guest"} />
              {passenger?.phone && (
                <a href={`tel:${passenger.phone}`} className="mt-2 h-9 px-3 inline-flex items-center border border-gold text-gold text-[10px] uppercase tracking-widest">Call passenger</a>
              )}
            </div>
          </Panel>

          <Panel title="Chauffeur">
            <div className="p-4 space-y-2 text-sm">
              <Field label="Name" value={driver?.full_name ?? "Unassigned"} />
              <Field label="Phone" value={driver?.phone ?? "—"} />
              <Field label="Status" value={driver?.availability ?? driver?.status ?? "—"} />
            </div>
          </Panel>

          <Panel title="Payment & Invoice">
            <div className="p-4 space-y-2 text-sm">
              <Field label="Total" value={naira(booking.total_price)} />
              <Field label="Base" value={naira(booking.base_price ?? booking.total_price)} />
              <div className="pt-2"><Pill tone={booking.payment_status === "paid" ? "good" : "warn"}>{booking.payment_status}</Pill></div>
              <button onClick={() => window.print()} className="mt-3 h-9 px-3 border border-border text-[10px] uppercase tracking-widest hover:border-gold w-full">Print invoice</button>
            </div>
          </Panel>

          {booking.qr_token && (
            <Panel title="QR Verification">
              <div className="p-4 grid place-items-center">
                <div className="bg-white p-3"><QRCode value={String(booking.qr_token)} size={140} /></div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                  {events.some((e) => e.event === "qr_scanned") ? "Verified" : "Awaiting scan"}
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-sm text-white/90 mt-0.5 break-words">{value}</div>
    </div>
  );
}
