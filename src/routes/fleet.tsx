import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet Catalogue — BiLUXS Luxury Vehicles Calabar" },
      { name: "description", content: "Browse the BiLUXS fleet of luxury sedans, SUVs, executive shuttles and inter-state coaches available for hire in Calabar." },
      { property: "og:title", content: "BiLUXS Fleet Catalogue" },
    ],
    links: [{ rel: "canonical", href: "/fleet" }],
  }),
  component: Page,
});

type Vehicle = {
  id: string; name: string; category: string; capacity: number;
  base_rate: number; per_km_rate: number; status: string;
  image_url: string | null; description: string | null;
  features: string[];
};

function Page() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.from("vehicles").select("*").order("base_rate")
      .then(({ data }) => setVehicles((data as Vehicle[]) || []));
    const ch = supabase.channel("fleet-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        supabase.from("vehicles").select("*").order("base_rate")
          .then(({ data }) => setVehicles((data as Vehicle[]) || []));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cats = ["all", "sedan", "suv", "bus", "coach"];
  const list = filter === "all" ? vehicles : vehicles.filter((v) => v.category === filter);

  return (
    <PageShell>
      <PageHero
        eyebrow="Fleet Catalogue"
        title={<>Choose Your <span className="gradient-text">Class</span></>}
        subtitle="Every vehicle in our fleet is GPS-tracked, fully insured and chauffeur-driven by trained professionals."
      />
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {cats.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-5 h-10 text-[10px] uppercase tracking-widest border transition-colors ${
                  filter === c ? "bg-crimson text-white border-crimson" : "border-border hover:border-gold"
                }`}>{c}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, y: 30 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="bg-card border border-border overflow-hidden group hover:border-gold transition-colors">
                <div className="aspect-video bg-[var(--navy-deep)] grid place-items-center relative">
                  {v.image_url ? <img src={v.image_url} alt={v.name} className="h-full w-full object-cover" />
                    : <Car className="h-16 w-16 text-muted-foreground/40" />}
                  <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] uppercase tracking-widest ${
                    v.status === "available" ? "bg-emerald-500/20 text-emerald-300"
                    : v.status === "in_use" ? "bg-amber-500/20 text-amber-300"
                    : "bg-red-500/20 text-red-300"}`}>{v.status.replace("_", " ")}</div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{v.category}</div>
                    <div className="text-xs text-muted-foreground">{v.capacity} pax</div>
                  </div>
                  <div className="font-display text-xl mt-2 tracking-wide">{v.name}</div>
                  {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">From</div>
                      <div className="font-display text-2xl text-white">₦{Number(v.base_rate).toLocaleString()}</div>
                    </div>
                    <Link to="/book" search={{ vehicle: v.id }}
                      className="px-4 h-10 bg-crimson text-white text-[10px] uppercase tracking-widest press-effect inline-flex items-center">
                      Book
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
            {!list.length && (
              <div className="col-span-full p-16 text-center text-muted-foreground border border-dashed border-border">
                No vehicles in this category yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
