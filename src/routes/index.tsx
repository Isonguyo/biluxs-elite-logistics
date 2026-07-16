import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Sparkles, Award, MapPin, ArrowRight, Car, Bus, Plane, Briefcase } from "lucide-react";

import heroImg from "@/assets/biluxs-hero.jpg";
import { PageShell } from "@/components/biluxs/PageShell";
import { ScrambleText, Magnetic, KenBurns, RevealLines } from "@/components/biluxs/anim";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "BiLUXS — Luxury Car Hire Calabar | Executive Transport Cross River",
      },
      {
        name: "description",
        content:
          "Chauffeur-driven luxury car hire, executive coaches, airport protocol & corporate logistics in Calabar, Cross River. A Brightflow Conglomerate company.",
      },
      {
        property: "og:title",
        content:
          "BiLUXS — Luxury Car Hire Calabar | Executive Transport Cross River",
      },
      {
        property: "og:description",
        content:
          "Chauffeur-driven luxury car hire, executive coaches, airport protocol & corporate logistics in Calabar, Cross River. A Brightflow Conglomerate company.",
      },
    ],
    links: [
      { rel: "canonical", href: "/" },
      {
        rel: "icon",
        type: "image/png",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1783969651/bilux_whvihe.png",
      },
    ],
  }),
  component: Landing,
});
import { useLoaderReady } from "@/components/biluxs/GlobalLoader";

function Landing() {
  const ready = useLoaderReady();
  return (
    <>
      <PageShell>
        <section className="relative overflow-hidden">
          <KenBurns src={heroImg} alt="BiLUXS luxury fleet" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 md:pt-36 md:pb-44">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.7 }} className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 h-7 border border-gold/40 text-gold text-[10px] tracking-[0.3em] uppercase mb-6">
                <Sparkles className="h-3 w-3" /> A Brightflow Conglomerate Company
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-white">
                {ready ? (
                  <>
                    <RevealLines text="Tourism. Travel." /><br />
                    <span className="gradient-text"><ScrambleText text="BiLUXS." duration={1600} /></span>
                  </>
                ) : (
                  <>
                    <span className="opacity-0">Tourism. Travel.</span><br />
                    <span className="opacity-0">BiLUXS.</span>
                  </>
                )}
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
                Chauffeur-driven luxury car hire, executive coaches, airport protocol and corporate logistics — engineered for first-class hospitality across Calabar and beyond.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Magnetic>
                  <Link to="/fleet" className="inline-flex items-center justify-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect liquid-glow">
                    Book Luxury Service <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link to="/track" className="inline-flex items-center justify-center gap-2 px-6 h-14 border border-gold text-gold text-xs uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] transition-colors">
                    <Search className="h-4 w-4" /> Track Waybill
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link to="/fleet" className="inline-flex items-center justify-center gap-2 px-6 h-14 border border-border text-xs uppercase tracking-widest hover:border-white">
                    Explore Fleet
                  </Link>
                </Magnetic>
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
