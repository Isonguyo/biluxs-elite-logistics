import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Search, ShieldCheck, Sparkles, Award, MapPin, Plane, Bus, Car,
  Briefcase, ArrowRight, Phone, Mail, Send,
} from "lucide-react";
import heroImg from "@/assets/biluxs-hero.jpg";
import { Header } from "@/components/biluxs/Header";
import { Footer } from "@/components/biluxs/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BiLUXS — Luxury Car Hire Calabar | Executive Transport Cross River" },
      { name: "description", content: "Luxury car hire, executive coaches, airport protocol & corporate logistics in Calabar, Cross River. Chauffeur-driven Sedans, SUVs and VIP shuttles by BiLUXS, a Brightflow Conglomerate company." },
      { property: "og:title", content: "BiLUXS — Tourism. Travel. Transport." },
      { property: "og:description", content: "Elite chauffeur-driven luxury logistics across Calabar and Nigeria." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Splash({ done }: { done: () => void }) {
  useEffect(() => {
    const t = setTimeout(done, 2200);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[var(--navy-deep)] grid place-items-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-display text-6xl md:text-8xl tracking-[0.2em] text-white"
        >
          Bi<span className="gradient-text">LUXS</span>
        </motion.div>
        <div className="mt-6 mx-auto h-[3px] w-64 bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="h-full gradient-brand"
          />
        </div>
        <div className="mt-4 text-[11px] tracking-[0.4em] text-gold uppercase">Elite Logistics</div>
      </div>
    </motion.div>
  );
}

function Landing() {
  const [splashing, setSplashing] = useState(true);
  const [trackCode, setTrackCode] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) return;
    toast.info(`Locating waybill ${trackCode.toUpperCase()}…`, {
      description: "Live GPS tracking opens shortly.",
    });
  };

  return (
    <div className="min-h-screen text-foreground">
      {splashing && <Splash done={() => setSplashing(false)} />}
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="BiLUXS luxury fleet"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 h-7 border border-gold/40 text-gold text-[10px] tracking-[0.3em] uppercase mb-6">
              <Sparkles className="h-3 w-3" /> A Brightflow Conglomerate Company
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-white">
              Tourism. Travel.
              <br />
              <span className="gradient-text">Transport.</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              Chauffeur-driven luxury car hire, executive coaches, airport protocol and corporate logistics — engineered for first-class hospitality across Calabar and beyond.
            </p>

            {/* Track + CTA */}
            <div id="track" className="mt-10 grid sm:grid-cols-[1fr_auto] gap-3 max-w-xl">
              <form onSubmit={handleTrack} className="flex bg-[var(--navy-deep)]/80 backdrop-blur border border-border focus-within:border-gold transition-colors">
                <div className="grid place-items-center pl-4 text-gold">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="Enter waybill (e.g. BLX-A1B2C3)"
                  className="flex-1 bg-transparent h-14 px-3 text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                <button className="px-5 text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors">
                  Track
                </button>
              </form>
              <a
                href="#fleet"
                className="inline-flex items-center justify-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect"
              >
                Book Luxury Service <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-xs uppercase tracking-widest text-white/60">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Insured Fleet</div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gold" /> Trained Chauffeurs</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Calabar HQ</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">About BiLUXS</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Professionalism. Safety.
              <br /><span className="gradient-text">First-Class Hospitality.</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              BiLUXS is the elite logistics division of <span className="text-gold">Brightflow Conglomerate</span>, headquartered on Harbour Road, Calabar. We exist to redefine premium movement in Nigeria — combining a meticulously maintained fleet, vetted chauffeurs and discreet protocol crews into a single seamless experience.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From boardroom transfers to inter-state executive coaches, every BiLUXS journey is engineered around three non-negotiables: integrity, reliability, and luxury.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, label: "Integrity", text: "Transparent pricing, verified drivers, zero compromise." },
              { icon: Award, label: "Reliability", text: "On-time guarantee with 24/7 dispatch and live tracking." },
              { icon: Sparkles, label: "Luxury", text: "First-class interiors, refreshments, and protocol." },
            ].map((v) => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="p-6 bg-card border border-border hover:border-gold transition-colors"
              >
                <v.icon className="h-6 w-6 text-gold" />
                <div className="font-display text-xl mt-4 tracking-widest">{v.label}</div>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-[var(--navy-deep)] border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Our Services</div>
              <h2 className="font-display text-4xl md:text-5xl">Engineered for the Executive Class</h2>
            </div>
            <a href="#fleet" className="text-xs uppercase tracking-widest text-gold border-b border-gold pb-1">View Catalogue →</a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Car, title: "Luxury Car Hire", text: "Chauffeur-driven Sedans and SUVs for VIP, weddings and city movement." },
              { icon: Bus, title: "Inter-State Travel", text: "Premium Executive Coaches for inter-city journeys with hostess service." },
              { icon: Plane, title: "Tourism & Protocol", text: "Airport fast-track, guided tours and immigration concierge." },
              { icon: Briefcase, title: "Corporate Logistics", text: "Staff bus shuttles, haulage and dedicated corporate accounts." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative p-7 bg-card border border-border hover:border-crimson transition-colors"
              >
                <div className="h-12 w-12 grid place-items-center bg-crimson/10 group-hover:bg-crimson transition-colors">
                  <s.icon className="h-6 w-6 text-crimson group-hover:text-white transition-colors" />
                </div>
                <h3 className="mt-5 font-display text-xl tracking-widest">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FLEET TEASER */}
      <FleetPreview />

      {/* CONTACT */}
      <ContactSection />

      <Footer />
    </div>
  );
}

function FleetPreview() {
  type Vehicle = {
    id: string; name: string; category: string; capacity: number;
    base_rate: number; status: string; image_url: string | null;
  };
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  useEffect(() => {
    supabase.from("vehicles").select("id,name,category,capacity,base_rate,status,image_url").limit(6)
      .then(({ data }) => setVehicles((data as Vehicle[]) || []));
  }, []);

  return (
    <section id="fleet" className="py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Fleet Catalogue</div>
        <h2 className="font-display text-4xl md:text-5xl mb-10">Choose Your Class</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="bg-card border border-border overflow-hidden group"
            >
              <div className="aspect-video bg-[var(--navy-deep)] grid place-items-center relative">
                {v.image_url ? (
                  <img src={v.image_url} alt={v.name} className="h-full w-full object-cover" />
                ) : (
                  <Car className="h-16 w-16 text-muted-foreground/40" />
                )}
                <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] uppercase tracking-widest ${v.status === "available" ? "bg-emerald-500/20 text-emerald-300" : v.status === "in_use" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                  {v.status.replace("_", " ")}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{v.category}</div>
                  <div className="text-xs text-muted-foreground">{v.capacity} pax</div>
                </div>
                <div className="font-display text-xl mt-2 tracking-wide">{v.name}</div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">From</div>
                    <div className="font-display text-2xl text-white">₦{Number(v.base_rate).toLocaleString()}</div>
                  </div>
                  <button className="px-4 h-10 bg-crimson text-white text-[10px] uppercase tracking-widest press-effect">
                    Book
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (form.company.trim()) {
      const { error } = await supabase.from("corporate_accounts").insert({
        company_name: form.company,
        contact_email: form.email,
        contact_phone: null,
        address: form.message,
      });
      if (error) toast.error(error.message);
      else toast.success("Partnership request received. Our corporate desk will reach out.");
    } else {
      toast.success("Message received. Our concierge will respond shortly.");
    }
    setForm({ name: "", email: "", message: "", company: "" });
    setSubmitting(false);
  };

  return (
    <section id="contact" className="py-24 bg-[var(--navy-deep)] border-t border-border">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Contact & Location</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">Visit our Calabar Headquarters</h2>
          <p className="mt-5 text-muted-foreground">
            Cooperative House, Harbour Road, Calabar, Cross River State — Nigeria.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gold" /> +234 800 BiLUXS</div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold" /> concierge@biluxs.com</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-gold" /> Cooperative House, Harbour Road, Calabar</div>
          </div>
          <div className="mt-6 aspect-video border border-border overflow-hidden">
            <iframe
              title="BiLUXS Calabar HQ"
              src="https://www.google.com/maps?q=Harbour%20Road%2C%20Calabar%2C%20Cross%20River&output=embed"
              className="h-full w-full grayscale contrast-125"
              loading="lazy"
            />
          </div>
        </div>

        <form onSubmit={submitInquiry} className="bg-card border border-border p-8">
          <h3 className="font-display text-2xl tracking-widest mb-6">Inquiry / Partnership</h3>
          <div className="grid gap-4">
            <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
            <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
            <input maxLength={150} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company (for partnership requests)" className="h-12 px-4 bg-input border border-border focus:outline-none focus:border-gold text-sm" />
            <textarea required maxLength={1000} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we serve you?" className="px-4 py-3 bg-input border border-border focus:outline-none focus:border-gold text-sm resize-none" />
            <button disabled={submitting} className="h-12 bg-crimson text-white text-xs uppercase tracking-widest press-effect inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? "Sending…" : <>Send Message <Send className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
