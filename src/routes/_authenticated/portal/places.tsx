import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Home, Building2, Plane, MapPin, Trash2, BookmarkPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/places")({
  head: () => ({
    meta: [
      { title: "Saved Places — BiLUXS Member Portal" },
      { name: "description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
      { property: "og:title", content: "Saved Places — BiLUXS" },
      { property: "og:description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Place = { id: string; label: string; address: string; kind: string };

const KINDS = [
  { key: "home", label: "Home", icon: Home },
  { key: "office", label: "Office", icon: Building2 },
  { key: "airport", label: "Airport", icon: Plane },
  { key: "favourite", label: "Favourite", icon: MapPin },
];

function Page() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState({ label: "", address: "", kind: "home" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_places")
      .select("id,label,address,kind")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setPlaces((data as Place[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.label.trim() || !form.address.trim()) {
      toast.error("Add a label and an address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("saved_places").insert({ ...form, user_id: user.id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Place saved successfully");
    setForm({ label: "", address: "", kind: "home" });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_places").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPlaces((p) => p.filter((x) => x.id !== id));
    toast.success("Place removed");
  };

  return (
    <PortalLayout
      title="Saved Places"
      subtitle="Home, office, airport, and favourite pickup points saved for rapid one-tap booking."
    >
      <div className="space-y-8">
        {/* Add Place Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
              <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <BookmarkPlus className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">Save a New Location</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Quick-Access Transit Hubs
                </p>
              </div>
            </div>

            <form onSubmit={add} className="grid sm:grid-cols-4 gap-4">
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Label (e.g. Ikoyi Residence)"
                className="h-11 bg-white/[0.03] border border-white/10 rounded-sm px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold transition-colors"
              />
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Full street address or description"
                className="sm:col-span-2 h-11 bg-white/[0.03] border border-white/10 rounded-sm px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-gold transition-colors"
              />
              <div className="flex gap-2">
                <select
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                  aria-label="Place type"
                  className="h-11 flex-1 bg-[#0a0511] border border-white/10 rounded-sm px-2 text-sm text-white outline-none focus:border-gold transition-colors"
                >
                  {KINDS.map((k) => (
                    <option key={k.key} value={k.key} className="bg-[#0a0511] text-white">
                      {k.label}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy}
                  className="h-11 px-6 bg-gold text-navy-deep font-medium text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/90 transition-all disabled:opacity-50 shrink-0"
                >
                  Save
                </button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Places List Section */}
        <div className="space-y-4">
          <SectionTitle>Your Places</SectionTitle>
          {places.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No saved places yet. Add your home, office, or frequent destinations for instant booking." />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {places.map((p, index) => {
                const Icon = KINDS.find((k) => k.key === p.kind)?.icon ?? MapPin;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold/50 transition-all flex items-start gap-4 p-5 h-full justify-between group">
                      <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-5 w-5 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                            {p.label}
                          </div>
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
                            {p.kind}
                          </span>
                        </div>
                        <div className="text-[12px] text-white/60 break-words mt-1 leading-relaxed">
                          {p.address}
                        </div>
                        <Link
                          to="/book"
                          className="mt-3.5 inline-block text-[10px] uppercase tracking-widest text-gold hover:underline"
                        >
                          Book from here →
                        </Link>
                      </div>
                      <button
                        onClick={() => remove(p.id)}
                        aria-label={`Delete ${p.label}`}
                        className="text-white/40 hover:text-crimson transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
