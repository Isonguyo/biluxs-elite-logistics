import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { TiltCard, RevealLines, Magnetic } from "@/components/biluxs/anim";
import { motion } from "framer-motion";
import { ShoppingBag, Globe, Plane, Sparkles, ArrowRight, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Personal Shopping — Zara, Louis Vuitton, Gucci | BiLUXS Calabar" },
      { name: "description", content: "BiLUXS personal shopping concierge from London, New York, Dubai and Paris. Source Zara, Louis Vuitton, Gucci, Hermès and more — delivered to Calabar." },
      { property: "og:title", content: "BiLUXS Fashion & Lifestyle Concierge" },
      { property: "og:description", content: "Global personal shopping from London, New York, Dubai. Authenticated luxury fashion delivered to your door." },
    ],
    links: [{ rel: "canonical", href: "/shopping" }],
  }),
  component: Page,
});

const CITIES = [
  { city: "London", flag: "🇬🇧", note: "Harrods · Selfridges · Bond Street" },
  { city: "New York", flag: "🇺🇸", note: "Saks · Bergdorf · SoHo" },
  { city: "Dubai", flag: "🇦🇪", note: "Mall of the Emirates · Dubai Mall" },
  { city: "Paris", flag: "🇫🇷", note: "Avenue Montaigne · Galeries Lafayette" },
  { city: "Milan", flag: "🇮🇹", note: "Quadrilatero della Moda" },
  { city: "Istanbul", flag: "🇹🇷", note: "Zorlu Center · Istinye Park" },
];

const BRANDS = ["Zara", "Louis Vuitton", "Gucci", "Hermès", "Prada", "Dior", "Burberry", "Balenciaga", "Versace", "Chanel", "Bottega Veneta", "Off-White"];

const STEPS = [
  { n: "01", title: "Wishlist", text: "Send us product links, sizes or a moodboard via WhatsApp." },
  { n: "02", title: "Source", text: "Our agents shop in-store, verify authenticity and take photos." },
  { n: "03", title: "Deliver", text: "Air freight to Calabar with full duty clearance handled by us." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Fashion & Lifestyle"
        title={<><RevealLines text="Personal Shopping." /><br /><span className="gradient-text">Globally Sourced.</span></>}
        subtitle="From London flagship stores to Dubai's gold towers — BiLUXS concierge sources, authenticates and delivers your luxury wardrobe to Calabar."
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Source Cities</div>
          <h2 className="font-display text-4xl md:text-5xl mb-12">Six Cities. One Wardrobe.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CITIES.map((c, i) => (
              <motion.div key={c.city}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}>
                <TiltCard className="bg-card border border-border p-7 h-full hover:border-gold transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl">{c.flag}</div>
                    <Plane className="h-5 w-5 text-gold" />
                  </div>
                  <div className="font-display text-3xl mt-5 tracking-wide">{c.city}</div>
                  <div className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">{c.note}</div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-[var(--navy-deep)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-3">Houses We Source</div>
              <h2 className="font-display text-4xl md:text-5xl mb-6">From Zara to Hermès.</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Whether it's a high-street Zara haul or a Hermès Birkin waitlist, our shopping concierge handles the chase. Every item arrives with a tax-receipt and authenticity card.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {BRANDS.map((b) => (
                  <motion.span key={b}
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.4 }}
                    className="px-3 py-2 border border-border text-xs uppercase tracking-widest hover:border-gold hover:text-gold transition-colors cursor-default">
                    {b}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <motion.div key={s.n}
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="flex gap-5 p-6 bg-card border border-border hover:border-gold transition-colors">
                  <div className="font-display text-5xl gradient-text">{s.n}</div>
                  <div>
                    <div className="font-display text-xl tracking-wide">{s.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 px-1">
                <BadgeCheck className="h-4 w-4 text-gold" /> 100% authenticity guarantee
              </div>
            </div>
          </div>

          <div className="mt-14">
            <Magnetic>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect liquid-glow">
                Start Your Wishlist <ShoppingBag className="h-4 w-4" /> <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
