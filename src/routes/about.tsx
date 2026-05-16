import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Award, Sparkles, MapPin } from "lucide-react";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import heroaboutImg from "@/assets/hero-about.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BiLUXS — Brightflow Conglomerate Calabar" },
      { name: "description", content: "BiLUXS is the elite logistics division of Brightflow Conglomerate, redefining premium movement from Harbour Road, Calabar." },
      { property: "og:title", content: "About BiLUXS" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHero image={heroaboutImg}
        eyebrow="About BiLUXS"
        title={<>Professionalism. Safety. <span className="gradient-text">First-Class Hospitality.</span></>}
        subtitle="The elite logistics division of Brightflow Conglomerate, headquartered on Harbour Road, Calabar."
      />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
          <div>
            <p className="text-muted-foreground leading-relaxed">
              BiLUXS exists to redefine premium movement in Nigeria — combining a meticulously maintained fleet, vetted chauffeurs and discreet protocol crews into a single seamless experience. From boardroom transfers to inter-state executive coaches, every BiLUXS journey is engineered around three non-negotiables: integrity, reliability, and luxury.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our Calabar headquarters anchors operations across Cross River and serves a growing network of partners across Nigeria.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { k: "200+", v: "VIP clients served" },
                { k: "24/7", v: "Dispatch & GPS" },
                { k: "100%", v: "Insured fleet" },
                { k: "5★", v: "Concierge rating" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="font-display text-5xl text-white">{s.k}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: "Integrity", text: "Transparent pricing, verified drivers, zero compromise." },
              { icon: Award, label: "Reliability", text: "On-time guarantee with 24/7 dispatch and live tracking." },
              { icon: Sparkles, label: "Luxury", text: "First-class interiors, refreshments, and protocol." },
              { icon: MapPin, label: "Local Roots", text: "Born in Calabar. Built for Cross River. Trusted nationwide." },
            ].map((v) => (
              <div key={v.label} className="p-6 bg-card border border-border hover:border-gold transition-colors">
                <v.icon className="h-6 w-6 text-gold" />
                <div className="font-display text-xl mt-4 tracking-widest">{v.label}</div>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
