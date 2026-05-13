import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Sparkles, Award, MapPin, ArrowRight, Car, Bus, Plane, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import heroImg from "@/assets/biluxs-hero.jpg";
import { PageShell } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BiLUXS — Luxury Car Hire Calabar | Executive Transport Cross River" },
      { name: "description", content: "Chauffeur-driven luxury car hire, executive coaches, airport protocol & corporate logistics in Calabar, Cross River. A Brightflow Conglomerate company." },
      { property: "og:title", content: "BiLUXS — Tourism. Travel. Transport." },
      { property: "og:description", content: "Elite chauffeur-driven luxury logistics across Calabar and Nigeria." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Splash({ done }: { done: () => void }) {
  useEffect(() => {
    const t = setTimeout(done, 1800);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[var(--navy-deep)] grid place-items-center">
      <div className="text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="font-display text-6xl md:text-8xl tracking-[0.2em] text-white">
          Bi<span className="gradient-text">LUXS</span>
        </motion.div>
        <div className="mt-6 mx-auto h-[3px] w-64 bg-white/10 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }}
            transition={{ duration: 1.5 }} className="h-full gradient-brand" />
        </div>
        <div className="mt-4 text-[11px] tracking-[0.4em] text-gold uppercase">Elite Logistics</div>
      </div>
    </motion.div>
  );
}

function Landing() {
  const [splashing, setSplashing] = useState(true);
  return (
    <>
      {splashing && <Splash done={() => setSplashing(false)} />}
      <PageShell>
        <section className="relative overflow-hidden">
          <img src={heroImg} alt="BiLUXS luxury fleet" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 md:pt-36 md:pb-44">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }} className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 h-7 border border-gold/40 text-gold text-[10px] tracking-[0.3em] uppercase mb-6">
                <Sparkles className="h-3 w-3" /> A Brightflow Conglomerate Company
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-white">
                Tourism. Travel.<br /><span className="gradient-text">Transport.</span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
                Chauffeur-driven luxury car hire, executive coaches, airport protocol and corporate logistics — engineered for first-class hospitality across Calabar and beyond.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/book" className="inline-flex items-center justify-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect">
                  Book Luxury Service <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/track" className="inline-flex items-center justify-center gap-2 px-6 h-14 border border-gold text-gold text-xs uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] transition-colors">
                  <Search className="h-4 w-4" /> Track Waybill
                </Link>
                <Link to="/fleet" className="inline-flex items-center justify-center gap-2 px-6 h-14 border border-border text-xs uppercase tracking-widest hover:border-white">
                  Explore Fleet
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-xs uppercase tracking-widest text-white/60">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Insured Fleet</div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gold" /> Trained Chauffeurs</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Calabar HQ</div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Our Services</div>
                <h2 className="font-display text-4xl md:text-5xl">Engineered for the Executive Class</h2>
              </div>
              <Link to="/services" className="text-xs uppercase tracking-widest text-gold border-b border-gold pb-1">All Services →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Car, title: "Luxury Car Hire", text: "Chauffeur-driven Sedans and SUVs for VIP." },
                { icon: Bus, title: "Inter-State Travel", text: "Premium Coaches for inter-city journeys." },
                { icon: Plane, title: "Airport Protocol", text: "Fast-track, tours and immigration concierge." },
                { icon: Briefcase, title: "Corporate Logistics", text: "Staff shuttles and dedicated accounts." },
              ].map((s, i) => (
                <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="group p-7 bg-card border border-border hover:border-crimson transition-colors">
                  <div className="h-12 w-12 grid place-items-center bg-crimson/10 group-hover:bg-crimson transition-colors">
                    <s.icon className="h-6 w-6 text-crimson group-hover:text-white" />
                  </div>
                  <h3 className="mt-5 font-display text-xl tracking-widest">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
