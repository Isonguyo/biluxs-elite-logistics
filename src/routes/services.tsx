import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Bus, Plane, Briefcase, ShieldCheck, Award } from "lucide-react";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import heroservicesImg from "@/assets/hero-services.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — BiLUXS Luxury Logistics Calabar" },
      { name: "description", content: "Luxury car hire, executive coaches, airport protocol services on Harbour Road, and corporate logistics across Calabar and Cross River." },
      { property: "og:title", content: "BiLUXS Services — Executive Transport Cross River" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Page,
});

const SERVICES = [
  { icon: Car, title: "Luxury Car Hire Calabar", text: "Chauffeur-driven Mercedes-Benz, BMW and Lexus sedans for VIP appointments, weddings and intra-city movement.", bullets: ["Hourly / daily rates", "Vetted chauffeurs", "Refreshments included"] },
  { icon: Bus, title: "Executive Inter-State Coaches", text: "Premium coaches with hostess service and onboard refreshments for Calabar to Lagos, Abuja, Port Harcourt and beyond.", bullets: ["Recliner seating", "Onboard WiFi", "Restroom equipped"] },
  { icon: Plane, title: "Airport Protocol Services Harbour Road", text: "Fast-track immigration, meet & greet, baggage handling and seamless airport-to-hotel transfers.", bullets: ["Margaret Ekpo Airport", "VIP lounge access", "24/7 dispatch"] },
  { icon: Briefcase, title: "Corporate & Haulage Accounts", text: "Dedicated corporate billing, staff shuttle programs and secure haulage with live GPS tracking.", bullets: ["Monthly invoicing", "Live tracking", "Account manager"] },
];

function Page() {
  return (
    <PageShell>
      <PageHero image={heroservicesImg}
        eyebrow="What We Do"
        title={<>Engineered for the <span className="gradient-text">Executive Class</span></>}
        subtitle="Four divisions. One standard. Every BiLUXS journey is built around integrity, reliability and luxury."
      />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {SERVICES.map((s) => (
            <div key={s.title} className="p-8 bg-card border border-border hover:border-crimson transition-colors">
              <div className="flex items-start gap-5">
                <div className="h-14 w-14 grid place-items-center bg-crimson/10 shrink-0">
                  <s.icon className="h-7 w-7 text-crimson" />
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-widest">{s.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-white/70">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-gold" /> {b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-14 flex flex-wrap items-center justify-between gap-4 p-8 bg-[var(--navy-deep)] border border-gold/30">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold">Ready to ride?</div>
            <div className="font-display text-3xl mt-2">Book in under 60 seconds.</div>
          </div>
          <div className="flex gap-3">
            <Link to="/fleet" className="px-6 h-12 inline-flex items-center border border-border text-xs uppercase tracking-widest hover:border-white">View Fleet</Link>
            <Link to="/fleet" className="px-6 h-12 inline-flex items-center bg-crimson text-white text-xs uppercase tracking-widest press-effect">Book Now</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
