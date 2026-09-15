import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { CreditCard, Receipt, PlusCircle, ShieldCheck, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/payments")({
  head: () => ({
    meta: [
      { title: "Payment Center — BiLUXS Member Portal" },
      { name: "description", content: "Invoices, receipts, payment methods and settlement history for your BiLUXS bookings." },
      { property: "og:title", content: "Payment Center — BiLUXS" },
      { property: "og:description", content: "Every invoice, receipt and payment method in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [b, m] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBookings(b.data ?? []);
    setMethods(m.data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const paid = bookings.filter((b) => b.payment_status === "paid");
  const outstanding = bookings.filter((b) => b.payment_status !== "paid" && b.status !== "cancelled");

  const addMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !label) return;
    setBusy(true);
    const { error } = await supabase.from("payment_methods").insert({
      user_id: user.id,
      label,
      last4: last4 || null,
      brand: "card",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment method saved securely");
    setLabel("");
    setLast4("");
    void load();
  };

  const removeMethod = async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment method removed");
    void load();
  };

  const receipt = (b: any) => {
    const html = `<html><head><title>Receipt ${b.waybill_code}</title></head><body style="font-family:system-ui;padding:40px;max-width:640px;color:#111">
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
    if (!w) {
      toast.error("Allow pop-ups to download your receipt");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <PortalLayout
      title="Payment Center"
      subtitle="Invoices, digital receipts, and secure settlement across every BiLUXS service."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Settled</span>
              </div>
              <div className="text-2xl font-display text-emerald-400 mt-1">
                {ngn(paid.reduce((s, b) => s + Number(b.total_price), 0))}
              </div>
              <div className="text-[11px] text-white/40 mt-1">{paid.length} settled payments</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Outstanding</span>
              </div>
              <div className="text-2xl font-display text-amber-400 mt-1">
                {ngn(outstanding.reduce((s, b) => s + Number(b.total_price), 0))}
              </div>
              <div className="text-[11px] text-white/40 mt-1">{outstanding.length} awaiting settlement</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Payment Methods</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{methods.length}</div>
              <div className="text-[11px] text-white/40 mt-1">Saved securely on account</div>
            </Card>
          </motion.div>
        </div>

        {/* Invoices & Receipts Section */}
        <div className="space-y-4">
          <SectionTitle>Invoices & Receipts</SectionTitle>
          {bookings.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No invoices or booking records found." />
            </Card>
          ) : (
            <div className="grid gap-3">
              {bookings.map((b, index) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold/50 transition-all p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
                            {b.waybill_code}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-[9px] uppercase tracking-widest rounded-sm ${
                              b.payment_status === "paid"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {b.payment_status}
                          </span>
                        </div>
                        <div className="text-sm mt-1.5 text-white/90 truncate">
                          {b.pickup_location} → {b.dropoff_location}
                        </div>
                        <div className="text-[11px] text-white/40 mt-1">{dt(b.paid_at ?? b.created_at)}</div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-display text-xl text-white">{ngn(b.total_price)}</div>
                        </div>
                        <button
                          onClick={() => receipt(b)}
                          className="h-10 px-4 border border-white/10 bg-white/[0.02] hover:border-gold text-white text-[10px] uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 shrink-0"
                        >
                          <Receipt className="h-3.5 w-3.5 text-gold" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
              <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <PlusCircle className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">Saved Payment Methods</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Secure Tokenized Cards
                </p>
              </div>
            </div>

            <form onSubmit={addMethod} className="flex flex-wrap gap-3 mb-6">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Card Label (e.g. Visa · Personal)"
                className="h-11 flex-1 min-w-[240px] bg-white/[0.03] border border-white/10 rounded-sm px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold transition-colors"
              />
              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                maxLength={4}
                placeholder="Last 4 digits"
                className="h-11 w-32 bg-white/[0.03] border border-white/10 rounded-sm px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold transition-colors"
              />
              <button
                disabled={busy}
                className="h-11 px-6 bg-gold text-navy-deep font-medium text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/90 transition-all disabled:opacity-50 shrink-0"
              >
                Add Card
              </button>
            </form>

            {methods.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-white/10 rounded-sm">
                <Empty text="No saved payment methods. Add a card for instant one-tap checkouts." />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    className="border border-white/10 bg-white/[0.02] p-4 rounded-sm flex items-center justify-between hover:border-gold/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{m.label}</div>
                        <div className="text-[11px] text-white/40 tracking-widest">•••• {m.last4 ?? "----"}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMethod(m.id)}
                      aria-label={`Remove ${m.label}`}
                      className="text-white/40 hover:text-crimson transition-colors p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
              <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
              <span>BiLUXS stores only tokenized references. Full card numbers never touch our servers.</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
