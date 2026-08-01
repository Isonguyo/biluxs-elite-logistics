import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Stat, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/payments")({
  head: () => ({ meta: [
    { title: "Payment Center — BiLUXS Member Portal" },
    { name: "description", content: "Invoices, receipts, payment methods and settlement history for your BiLUXS bookings." },
    { property: "og:title", content: "Payment Center — BiLUXS" },
    { property: "og:description", content: "Every invoice, receipt and payment method in one place." },
  ] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const [b, m] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBookings(b.data ?? []);
    setMethods(m.data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const paid = bookings.filter((b) => b.payment_status === "paid");
  const outstanding = bookings.filter((b) => b.payment_status !== "paid" && b.status !== "cancelled");

  const addMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !label) return;
    const { error } = await supabase.from("payment_methods").insert({ user_id: user.id, label, last4: last4 || null, brand: "card" });
    if (error) { toast.error(error.message); return; }
    toast.success("Payment method saved");
    setLabel(""); setLast4(""); void load();
  };

  const receipt = (b: any) => {
    const html = `<html><head><title>Receipt ${b.waybill_code}</title></head><body style="font-family:system-ui;padding:40px;max-width:640px">
      <h1 style="font-family:Georgia">BiLUXS</h1><p>Receipt · ${b.waybill_code}</p><hr/>
      <p><b>Route:</b> ${b.pickup_location} → ${b.dropoff_location}</p>
      <p><b>Pickup:</b> ${new Date(b.pickup_time).toLocaleString()}</p>
      <p><b>Distance:</b> ${b.distance_km} km</p>
      <p><b>Base:</b> ₦${Number(b.base_price).toLocaleString()}</p>
      <p><b>Luxury protocol:</b> ${b.luxury_protocol ? "Yes (20%)" : "No"}</p>
      <h2>Total: ₦${Number(b.total_price).toLocaleString()}</h2>
      <p>Status: ${b.payment_status}${b.paid_at ? " on " + new Date(b.paid_at).toLocaleString() : ""}</p>
      <p style="margin-top:40px;font-size:12px;color:#666">A Brightflow Conglomerate company.</p></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow pop-ups to download your receipt"); return; }
    w.document.write(html); w.document.close(); w.print();
  };

  return (
    <PortalLayout title="Payments" subtitle="Invoices, receipts and settlement across every BiLUXS service.">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Settled" value={ngn(paid.reduce((s, b) => s + Number(b.total_price), 0))} accent="text-emerald-400" hint={`${paid.length} payments`} />
        <Stat label="Outstanding" value={ngn(outstanding.reduce((s, b) => s + Number(b.total_price), 0))} accent="text-amber-400" hint={`${outstanding.length} awaiting payment`} />
        <Stat label="Payment methods" value={methods.length} hint="Saved on your account" />
      </div>

      <SectionTitle>Invoices & receipts</SectionTitle>
      {bookings.length === 0 ? <Empty text="No invoices yet." /> : (
        <div className="grid gap-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{b.waybill_code}</div>
                  <div className="text-sm mt-1 truncate">{b.pickup_location} → {b.dropoff_location}</div>
                  <div className="text-[11px] text-muted-foreground">{dt(b.paid_at ?? b.created_at)}</div>
                </div>
                <div className="font-display text-xl">{ngn(b.total_price)}</div>
                <span className={`px-3 py-1 text-[10px] uppercase tracking-widest ${b.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{b.payment_status}</span>
                <button onClick={() => receipt(b)} className="h-10 px-4 border border-border hover:border-gold text-[10px] uppercase tracking-widest">Receipt</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Payment methods</SectionTitle>
      <Card>
        <form onSubmit={addMethod} className="flex flex-wrap gap-2 mb-4">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Visa · personal" className="h-11 flex-1 min-w-48 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <input value={last4} onChange={(e) => setLast4(e.target.value)} maxLength={4} placeholder="Last 4" className="h-11 w-28 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <button className="h-11 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest">Add</button>
        </form>
        {methods.length === 0 ? <Empty text="No saved payment methods." /> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {methods.map((m) => (
              <div key={m.id} className="border border-border p-4 flex items-center justify-between">
                <div><div className="text-sm">{m.label}</div><div className="text-[11px] text-muted-foreground tracking-widest">•••• {m.last4 ?? "----"}</div></div>
                <button onClick={async () => { await supabase.from("payment_methods").delete().eq("id", m.id); void load(); }}
                  className="text-[10px] uppercase tracking-widest text-crimson">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PortalLayout>
  );
}
