import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ArrowRight, ArrowLeft, Car, MapPin, Sparkles, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";

type Vehicle = { id: string; name: string; category: string; capacity: number; base_rate: number; per_km_rate: number; image_url: string | null };

const searchSchema = z.object({ vehicle: z.string().optional() });

export const Route = createFileRoute("/book")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Book Luxury Service — BiLUXS Calabar" },
      { name: "description", content: "Book a chauffeur-driven luxury vehicle in Calabar in 4 quick steps. Transparent pricing with optional Luxury Protocol." },
    ],
  }),
  component: Page,
});

const STEPS = ["Vehicle", "Trip Details", "Add-ons", "Review & Pay"];

function Page() {
  const { vehicle: preselectId } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState<string | null>(preselectId ?? null);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [distance, setDistance] = useState<number>(15);
  const [luxury, setLuxury] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("vehicles").select("id,name,category,capacity,base_rate,per_km_rate,image_url")
      .eq("status", "available").order("base_rate")
      .then(({ data }) => setVehicles((data as Vehicle[]) || []));
  }, []);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicles, vehicleId]);
  const pricing = useMemo(() => {
    if (!vehicle) return { base: 0, distanceCharge: 0, subtotal: 0, luxuryFee: 0, total: 0 };
    const base = Number(vehicle.base_rate);
    const distanceCharge = distance * Number(vehicle.per_km_rate);
    const subtotal = base + distanceCharge;
    const luxuryFee = luxury ? subtotal * 0.20 : 0;
    return { base, distanceCharge, subtotal, luxuryFee, total: subtotal + luxuryFee };
  }, [vehicle, distance, luxury]);

  const canNext = () => {
    if (step === 0) return !!vehicleId;
    if (step === 1) return pickup.trim() && dropoff.trim() && distance > 0;
    return true;
  };

  const submit = async () => {
    if (!user) { toast.error("Sign in to confirm your booking."); navigate({ to: "/login" }); return; }
    if (!vehicle) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("bookings").insert({
      user_id: user.id, vehicle_id: vehicle.id,
      pickup_location: pickup, dropoff_location: dropoff,
      pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null,
      distance_km: distance, base_price: pricing.subtotal, total_price: pricing.total,
      luxury_protocol: luxury, addons: luxury ? ["luxury_protocol"] : [],
    }).select("waybill_code,id").single();
    setSubmitting(false);
    if (error || !data) { toast.error(error?.message || "Could not create booking."); return; }
    toast.success(`Booking confirmed — ${data.waybill_code}`);
    navigate({ to: "/dashboard" });
  };

  if (loading) return <PageShell><div className="py-32 text-center text-muted-foreground">Loading…</div></PageShell>;

  return (
    <PageShell>
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Booking Wizard</div>
          <h1 className="font-display text-4xl md:text-5xl mb-8">Reserve Your <span className="gradient-text">Journey</span></h1>

          <Stepper step={step} />

          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="bg-card border border-border p-7 min-h-[440px]">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {step === 0 && (
                    <Step1 vehicles={vehicles} vehicleId={vehicleId} setVehicleId={setVehicleId} />
                  )}
                  {step === 1 && (
                    <Step2 pickup={pickup} dropoff={dropoff} pickupTime={pickupTime} distance={distance}
                      setPickup={setPickup} setDropoff={setDropoff} setPickupTime={setPickupTime} setDistance={setDistance} />
                  )}
                  {step === 2 && <Step3 luxury={luxury} setLuxury={setLuxury} />}
                  {step === 3 && (
                    <Step4 vehicle={vehicle} pickup={pickup} dropoff={dropoff} pickupTime={pickupTime}
                      distance={distance} luxury={luxury} pricing={pricing} />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex items-center justify-between">
                <button disabled={step === 0} onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-2 px-4 h-11 border border-border text-xs uppercase tracking-widest disabled:opacity-30 hover:border-gold transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button disabled={!canNext()} onClick={() => setStep(step + 1)}
                    className="inline-flex items-center gap-2 px-6 h-11 bg-crimson text-white text-xs uppercase tracking-widest press-effect disabled:opacity-50">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button disabled={submitting} onClick={submit}
                    className="inline-flex items-center gap-2 px-6 h-11 bg-gold text-[var(--navy-deep)] text-xs uppercase tracking-widest font-semibold press-effect disabled:opacity-50">
                    {submitting ? "Confirming…" : <>Confirm & Pay <Check className="h-4 w-4" /></>}
                  </button>
                )}
              </div>
            </div>

            <PriceSummary vehicle={vehicle} pricing={pricing} luxury={luxury} distance={distance} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-2">
          <div className={`h-9 w-9 grid place-items-center text-xs font-bold border ${
            i <= step ? "bg-crimson border-crimson text-white" : "border-border text-muted-foreground"
          }`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
          <div className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground">{s}</div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-crimson" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function Step1({ vehicles, vehicleId, setVehicleId }: { vehicles: Vehicle[]; vehicleId: string | null; setVehicleId: (id: string) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest flex items-center gap-2"><Car className="h-5 w-5 text-gold" /> Choose Your Vehicle</h2>
      <p className="text-xs text-muted-foreground mt-2">Select from our available luxury fleet.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {vehicles.map((v) => (
          <button key={v.id} onClick={() => setVehicleId(v.id)} type="button"
            className={`text-left p-4 border transition-colors ${
              vehicleId === v.id ? "border-gold bg-gold/5" : "border-border hover:border-white/40"}`}>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{v.category}</div>
            <div className="font-display text-lg tracking-wide mt-1">{v.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{v.capacity} pax · ₦{Number(v.per_km_rate).toLocaleString()}/km</div>
            <div className="font-display text-xl mt-2 text-white">₦{Number(v.base_rate).toLocaleString()}<span className="text-xs text-muted-foreground"> base</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2(p: { pickup: string; dropoff: string; pickupTime: string; distance: number;
  setPickup: (v: string) => void; setDropoff: (v: string) => void; setPickupTime: (v: string) => void; setDistance: (v: number) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Trip Details</h2>
      <div className="mt-6 grid gap-4">
        <Labeled label="Pickup location">
          <input value={p.pickup} onChange={(e) => p.setPickup(e.target.value)} maxLength={200}
            placeholder="e.g. Margaret Ekpo Airport, Calabar" className="h-12 w-full bg-input border border-border focus:outline-none focus:border-gold px-4 text-sm" />
        </Labeled>
        <Labeled label="Dropoff location">
          <input value={p.dropoff} onChange={(e) => p.setDropoff(e.target.value)} maxLength={200}
            placeholder="e.g. Tinapa Resort" className="h-12 w-full bg-input border border-border focus:outline-none focus:border-gold px-4 text-sm" />
        </Labeled>
        <div className="grid sm:grid-cols-2 gap-4">
          <Labeled label="Pickup time">
            <input type="datetime-local" value={p.pickupTime} onChange={(e) => p.setPickupTime(e.target.value)}
              className="h-12 w-full bg-input border border-border focus:outline-none focus:border-gold px-4 text-sm" />
          </Labeled>
          <Labeled label={`Distance: ${p.distance} km`}>
            <input type="range" min={1} max={500} value={p.distance}
              onChange={(e) => p.setDistance(Number(e.target.value))} className="w-full accent-[var(--crimson)]" />
          </Labeled>
        </div>
      </div>
    </div>
  );
}

function Step3({ luxury, setLuxury }: { luxury: boolean; setLuxury: (v: boolean) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> Premium Add-ons</h2>
      <p className="text-xs text-muted-foreground mt-2">Optional protocol upgrades.</p>
      <button type="button" onClick={() => setLuxury(!luxury)}
        className={`mt-6 w-full p-6 text-left border transition-colors ${luxury ? "border-gold bg-gold/10" : "border-border hover:border-white/40"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Signature</div>
            <div className="font-display text-2xl tracking-widest mt-1">Luxury Protocol</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Dedicated meet-and-greet, refreshments, premium chauffeur, fast-track and concierge support throughout your journey.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Adds</div>
            <div className="font-display text-3xl text-crimson">+20%</div>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <div className={`h-4 w-4 border ${luxury ? "bg-crimson border-crimson" : "border-border"}`}>
            {luxury && <Check className="h-3 w-3 text-white" />}
          </div>
          {luxury ? "Selected" : "Tap to add"}
        </div>
      </button>
    </div>
  );
}

function Step4({ vehicle, pickup, dropoff, pickupTime, distance, luxury, pricing }: any) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest flex items-center gap-2"><Receipt className="h-5 w-5 text-gold" /> Review & Confirm</h2>
      <div className="mt-6 grid gap-4 text-sm">
        <Row label="Vehicle">{vehicle?.name ?? "—"}</Row>
        <Row label="Pickup">{pickup}</Row>
        <Row label="Dropoff">{dropoff}</Row>
        <Row label="Pickup time">{pickupTime ? new Date(pickupTime).toLocaleString() : "On request"}</Row>
        <Row label="Distance">{distance} km</Row>
        <Row label="Luxury Protocol">{luxury ? "Yes (+20%)" : "No"}</Row>
      </div>
      <div className="mt-6 p-4 bg-[var(--navy-deep)] border border-gold/30 text-xs text-muted-foreground">
        Payment is secured via our partner gateway. You'll receive a waybill code immediately upon confirmation.
      </div>
    </div>
  );
}

function PriceSummary({ vehicle, pricing, luxury, distance }: any) {
  return (
    <aside className="bg-[var(--navy-deep)] border border-border p-6 h-fit sticky top-28">
      <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-4">Cost Breakdown</div>
      <PriceRow label={`Base (${vehicle?.name ?? "vehicle"})`} amount={pricing.base} />
      <PriceRow label={`Distance × ${distance}km`} amount={pricing.distanceCharge} />
      <div className="border-t border-border my-3" />
      <PriceRow label="Subtotal" amount={pricing.subtotal} muted />
      {luxury && <PriceRow label="Luxury Protocol (+20%)" amount={pricing.luxuryFee} accent />}
      <div className="border-t border-gold/40 my-3" />
      <div className="flex items-end justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
        <div className="font-display text-3xl text-white">₦{Math.round(pricing.total).toLocaleString()}</div>
      </div>
    </aside>
  );
}

function PriceRow({ label, amount, muted, accent }: { label: string; amount: number; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between text-sm py-1 ${muted ? "text-muted-foreground" : accent ? "text-gold" : ""}`}>
      <span>{label}</span><span>₦{Math.round(amount).toLocaleString()}</span>
    </div>
  );
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</div>{children}</label>);
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}
