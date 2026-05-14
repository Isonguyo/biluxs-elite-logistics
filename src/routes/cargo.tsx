import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { TiltCard, RevealLines, Magnetic } from "@/components/biluxs/anim";
import { motion } from "framer-motion";
import { Package, Truck, ShieldCheck, Clock, Boxes, Lock, Snowflake, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cargo")({
  head: () => ({
    meta: [
      { title: "Cargo Handling & Door-to-Door Delivery — BiLUXS Calabar" },
      { name: "description", content: "Secure cargo handling and door-to-door logistics for high-value items across Calabar, Cross River and Nigeria. Insured, tracked, chauffeured." },
      { property: "og:title", content: "BiLUXS Cargo & Door-to-Door Delivery" },
      { property: "og:description", content: "Insured, GPS-tracked logistics for high-value cargo, art, electronics, documents and luxury goods." },
    ],
    links: [{ rel: "canonical", href: "/cargo" }],
  }),
  component: Page,
});

const SERVICES = [
  { icon: Package, title: "High-Value Parcels", text: "Insured handling for jewellery, electronics, art and confidential documents." },
  { icon: Truck, title: "Door-to-Door Delivery", text: "Chauffeured pickup at your address, drop-off anywhere in Cross River or beyond." },
  { icon: ShieldCheck, title: "Armed Escort Option", text: "Optional security escort for cash, art, and high-net-worth shipments." },
  { icon: Snowflake, title: "Climate-Controlled", text: "Temperature-stable transport for pharma, fine wine, and perishables." },
  { icon: Boxes, title: "Bulk Corporate Freight", text: "Pallets, retail stock, and inter-state distribution for corporate clients." },
  { icon: Lock, title: "Sealed Chain-of-Custody", text: "Tamper-evident seals and signed receipts at every handover." },
];

const TIERS = [
  { name: "Express City", text: "Same-day inside Calabar metro.", price: "₦15,000+" },
  { name: "Inter-State", text: "Lagos · Abuja · Port Harcourt overnight.", price: "₦85,000+" },
  { name: "Vault Class", text: "High-value, escorted, chain-of-custody.", price: "On request" },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Cargo & Logistics"
        title={<><RevealLines text="Door-to-Door." /><br /><span className="gradient-text">Vault-Grade Trust.</span></>}
        subtitle="From a single confidential envelope to inter-state corporate freight — insured, GPS-tracked and handled by chauffeurs trained in close-protection logistics."
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <motion.div key={s.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}>
                <TiltCard className="bg-card border border-border p-7 h-full hover:border-gold transition-colors group">
                  <div className="h-12 w-12 grid place-items-center bg-crimson/10 group-hover:bg-crimson transition-colors">
                    <s.icon className="h-6 w-6 text-crimson group-hover:text-white" />
                  </div>
                  <h3 className="font-display text-xl tracking-wide mt-5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.text}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-[var(--navy-deep)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Service Tiers</div>
          <h2 className="font-display text-4xl md:text-5xl mb-12">Choose Your Class of Care</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="border border-border p-8 bg-card hover:border-gold transition-colors">
                <div className="text-[10px] tracking-[0.3em] uppercase text-gold">Tier {i + 1}</div>
                <div className="font-display text-2xl mt-2">{t.name}</div>
                <p className="text-sm text-muted-foreground mt-2">{t.text}</p>
                <div className="mt-6 font-display text-3xl text-white">{t.price}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-3 text-xs uppercase tracking-widest text-white/70">
            <Clock className="h-4 w-4 text-gold" /> Average pickup window: 45 minutes inside Calabar
          </div>

          <div className="mt-10">
            <Magnetic>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect liquid-glow">
                Request a Cargo Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
