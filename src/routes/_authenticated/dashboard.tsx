import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { ArrowRight, Calendar, Home, MapPin, Plus, Printer, QrCode, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { PageShell } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BiLUXS" }] }),
   
  component: Page,
});

type Booking = {
  id: string;
  waybill_code: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  total_price: number;
  created_at: string;
  pickup_time: string | null;
  luxury_protocol: boolean;
  payment_status: string;
  qr_token: string | null;
  qr_status: string;
};

function Page() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [qrOpen, setQrOpen] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));

    const load = () => {
      supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setBookings((data as Booking[]) || []));
    };

    load();

    const ch = supabase
      .channel(rtTopic("dash-bookings"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const active = bookings.find(
    (b) =>
      b.payment_status === "paid" &&
      b.qr_status === "valid" &&
      ["confirmed", "pending"].includes(b.status),
  );

  const ongoing = bookings.find((b) => ["confirmed", "pending", "in_progress"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "completed").length;

  return (
    <PageShell>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #boarding-pass-print, #boarding-pass-print * { visibility: visible !important; }
          #boarding-pass-print {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
            color: black !important;
          }
          #boarding-pass-print .print-surface {
            color: black !important;
            background: white !important;
            border: 0 !important;
            width: 100% !important;
            max-width: 420px !important;
          }
        }
      `}</style>

      <div className="border-b border-gold/20 bg-gradient-to-r from-[#0a0511] via-[var(--navy-deep)] to-[#0a0511]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-gold">Member area</div>
            <div className="font-display text-xl tracking-widest mt-1">BI LUXS</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="h-10 px-3 border border-border hover:border-gold text-muted-foreground hover:text-white inline-flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <Link
              to="/book"
              className="h-10 px-4 bg-crimson text-white inline-flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <Plus className="h-3.5 w-3.5" /> Book a ride
            </Link>
          </div>
        </div>
      </div>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-gold">Your account</div>
              <h1 className="font-display text-3xl md:text-4xl tracking-widest mt-2">
                Welcome, <span className="gradient-text">{profile?.full_name || "Member"}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Everything you need for your journeys, in one place.
              </p>
            </div>

            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span><strong className="text-white">{bookings.length}</strong> bookings</span>
              <span><strong className="text-white">{completed}</strong> completed</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {active && active.qr_token && (
            <ActiveTripCard booking={active} onOpen={() => setQrOpen(active)} />
          )}

          {ongoing && !active && ongoing.status === "in_progress" && (
            <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400">Journey in progress</div>
                <div className="font-display text-xl tracking-widest mt-1">{ongoing.waybill_code}</div>
                <div className="text-xs text-muted-foreground mt-1">{ongoing.pickup_location} → {ongoing.dropoff_location}</div>
              </div>
              <Link to="/track" className="h-10 px-4 border border-emerald-500/40 text-emerald-300 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                Track journey <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">History</div>
              <h2 className="font-display text-2xl tracking-widest mt-1">Your bookings</h2>
            </div>
            <Link to="/book" className="text-[10px] uppercase tracking-widest text-gold hover:underline inline-flex items-center gap-2">
              New booking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!bookings.length ? (
            <div className="p-14 text-center border border-dashed border-border">
              <Calendar className="h-9 w-9 mx-auto text-gold/50" />
              <div className="text-white mt-4">No bookings yet</div>
              <div className="text-sm text-muted-foreground mt-1">Your reservations will appear here.</div>
              <Link to="/book" className="mt-6 inline-flex px-6 h-11 items-center bg-crimson text-white text-xs uppercase tracking-widest">
                Make your first booking
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Waybill</span>
                        <span className="font-display tracking-widest">{b.waybill_code}</span>
                        <StatusBadge status={b.status} />
                        <PayBadge status={b.payment_status} />
                      </div>
                      <div className="mt-3 text-sm grid sm:grid-cols-2 gap-y-1 gap-x-6">
                        <span className="inline-flex items-center gap-2"><MapPin className="h-3 w-3 text-gold" />{b.pickup_location}</span>
                        <span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3 text-crimson" />{b.dropoff_location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-5">
                      <div className="text-right">
                        <div className="font-display text-xl">₦{Number(b.total_price).toLocaleString()}</div>
                        {b.pickup_time && <div className="text-[10px] text-muted-foreground mt-1">{new Date(b.pickup_time).toLocaleString()}</div>}
                      </div>

                      {b.payment_status === "paid" && b.qr_status === "valid" && b.qr_token ? (
                        <button
                          onClick={() => setQrOpen(b)}
                          className="h-10 px-3 border border-gold/40 text-gold text-[10px] uppercase tracking-widest inline-flex items-center gap-2"
                        >
                          <QrCode className="h-3.5 w-3.5" /> Boarding pass
                        </button>
                      ) : b.status === "in_progress" ? (
                        <Link to="/track" className="h-10 px-3 border border-border text-gold text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                          Track <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <QrModal booking={qrOpen} onClose={() => setQrOpen(null)} />
    </PageShell>
  );
}

function ActiveTripCard({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden border border-gold/40 bg-gradient-to-br from-[var(--navy-deep)] via-[var(--navy-deep)] to-gold/5 p-6">
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
            <ShieldCheck className="h-3 w-3" /> Active trip · Boarding ready
          </div>
          <div className="font-display text-3xl mt-2 tracking-widest">{booking.waybill_code}</div>
          <div className="text-sm text-muted-foreground mt-3">{booking.pickup_location} → {booking.dropoff_location}</div>
          <button onClick={onOpen} className="mt-5 inline-flex items-center gap-2 px-5 h-11 bg-gold text-[var(--navy-deep)] text-xs uppercase tracking-widest font-semibold">
            <QrCode className="h-4 w-4" /> Open boarding pass
          </button>
        </div>
        <div className="hidden sm:block bg-white p-3">
          <QRCode value={booking.qr_token!} size={132} />
        </div>
      </div>
    </motion.div>
  );
}

function QrModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {booking && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md grid place-items-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[var(--navy-deep)] border border-gold/40 p-6 max-w-sm w-full text-center relative">
            <button onClick={onClose} aria-label="Close boarding pass" className="absolute top-3 right-3 text-muted-foreground hover:text-white">
              <X className="h-4 w-4" />
            </button>

            <div id="boarding-pass-print" className="rounded-lg">
              <div className="print-surface">
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold print:text-black">Boarding pass</div>
                <div className="font-display text-3xl mt-2">{booking.waybill_code}</div>
                <div className="mt-5 bg-white p-4 inline-block">
                  {booking.qr_token && <QRCode value={booking.qr_token} size={220} />}
                </div>
                <div className="mt-5 text-xs text-muted-foreground print:text-black">
                  Present this code to your chauffeur. It is single-use and becomes unavailable after successful verification.
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-center print:hidden">
              <button onClick={() => window.print()} className="h-10 px-4 bg-gold text-[var(--navy-deep)] text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <Printer className="h-3.5 w-3.5" /> Print boarding pass
              </button>
              <button onClick={onClose} className="h-10 px-4 border border-border text-white text-[10px] uppercase tracking-widest">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    confirmed: "bg-blue-500/20 text-blue-300",
    in_progress: "bg-crimson/20 text-crimson",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
  };
  return <div className={`px-2.5 h-6 inline-flex items-center text-[9px] uppercase tracking-widest ${map[status] || "bg-muted text-foreground"}`}>{status.replace("_", " ")}</div>;
}

function PayBadge({ status }: { status: string }) {
  const paid = status === "paid";
  return <div className={`px-2.5 h-6 inline-flex items-center text-[9px] uppercase tracking-widest ${paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{paid ? "Paid" : "Unpaid"}</div>;
}
