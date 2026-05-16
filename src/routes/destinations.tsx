import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import herodestinationsImg from "@/assets/hero-destinations.jpg";
import { TiltCard, RevealLines, Magnetic, ParallaxY } from "@/components/biluxs/anim";
import { motion } from "framer-motion";
import { MapPin, Mountain, Waves, Plane, Compass, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Tourism Destinations — Obudu Ranch, Agbokim Falls, Paris, Zanzibar | BiLUXS" },
      { name: "description", content: "BiLUXS curated tourism. Local trips to Obudu Cattle Ranch, Agbokim Falls, Tinapa — and international escapes to Paris, Zanzibar, Dubai, Cape Town." },
      { property: "og:title", content: "BiLUXS Experience & Destinations" },
      { property: "og:description", content: "Curated luxury escapes — Obudu Ranch, Agbokim Falls, Paris, Zanzibar, Dubai." },
    ],
    links: [{ rel: "canonical", href: "/destinations" }],
  }),
  component: Page,
});

type Dest = { name: string; region: string; tag: "Local" | "International"; img: string; blurb: string; from: string; icon: typeof Mountain };

const DESTS: Dest[] = [
  { name: "Obudu Cattle Ranch", region: "Cross River, Nigeria", tag: "Local", icon: Mountain,
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    blurb: "Cable-car rides over the plateau, mountain chalets, and cool highland air at 1,576 m.", from: "₦185,000" },
  { name: "Agbokim Waterfalls", region: "Etung, Cross River", tag: "Local", icon: Waves,
    img: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&q=80",
    blurb: "Seven-cascade waterfall on the Cameroon border. Day trips with chauffeur and lunch.", from: "₦95,000" },
  { name: "Tinapa Resort", region: "Calabar, Cross River", tag: "Local", icon: Compass,
    img: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80",
    blurb: "Free-trade leisure city — water park, nightlife, shopping and lakeside lounges.", from: "₦55,000" },
  { name: "Paris", region: "France", tag: "International", icon: Plane,
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    blurb: "Five-night couture escape. Suite at Le Bristol, Michelin dining, private Louvre tour.", from: "$5,400" },
  { name: "Zanzibar", region: "Tanzania", tag: "International", icon: Waves,
    img: "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=1200&q=80",
    blurb: "Seven nights on the Indian Ocean — overwater villa, dhow sunset cruise, spice tour.", from: "$4,200" },
  { name: "Dubai", region: "UAE", tag: "International", icon: Compass,
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
    blurb: "Burj Al Arab suite, desert falconry, yacht charter at Dubai Marina.", from: "$6,800" },
];

function Page() {
  return (
    <PageShell>
      <PageHero image={herodestinationsImg}
        eyebrow="Experience"
        title={<><RevealLines text="Destinations" /><br /><span className="gradient-text">Worth the Journey.</span></>}
        subtitle="Curated escapes — from the highland air of Obudu to overwater villas in Zanzibar. BiLUXS handles flights, transfers, accommodation and protocol end-to-end."
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DESTS.map((d, i) => (
              <motion.div key={d.name}
                initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}>
                <TiltCard className="bg-card border border-border overflow-hidden group hover:border-gold transition-colors h-full">
                  <div className="aspect-[4/3] relative overflow-hidden bg-[var(--navy-deep)]">
                    <ParallaxY distance={40} className="h-full w-full">
                      <img src={d.img} alt={d.name} loading="lazy"
                        className="h-full w-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000" />
                    </ParallaxY>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-deep)] via-transparent to-transparent" />
                    <div className={`absolute top-3 left-3 px-2 py-1 text-[10px] uppercase tracking-widest z-10 ${
                      d.tag === "Local" ? "bg-gold/20 text-gold border border-gold/40" : "bg-crimson/20 text-white border border-crimson/40"
                    }`}>{d.tag}</div>
                    <div className="absolute bottom-3 right-3 z-10">
                      <d.icon className="h-6 w-6 text-gold" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {d.region}
                    </div>
                    <div className="font-display text-2xl mt-1 tracking-wide">{d.name}</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{d.blurb}</p>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">From</div>
                        <div className="font-display text-2xl text-white">{d.from}</div>
                      </div>
                      <Link to="/contact"
                        className="px-4 h-10 border border-gold text-gold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] transition-colors inline-flex items-center">
                        Enquire
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Magnetic>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 h-14 bg-crimson text-white text-xs uppercase tracking-widest press-effect liquid-glow">
                Plan a Custom Itinerary <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
