import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Home, Building2, Plane, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/places")({
  head: () => ({ meta: [
    { title: "Saved Places — BiLUXS Member Portal" },
    { name: "description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
    { property: "og:title", content: "Saved Places — BiLUXS" },
    { property: "og:description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
  ] }),
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
    const { data } = await supabase.from("saved_places").select("id,label,address,kind")
      .eq("user_id", user.id).order("created_at", { ascending: true });
    setPlaces((data as Place[]) ?? []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.label.trim() || !form.address.trim()) { toast.error("Add a label and an address"); return; }
    setBusy(true);
    const { error } = await supabase.from("saved_places").insert({ ...form, user_id: user.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Place saved");
    setForm({ label: "", address: "", kind: "home" });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_places").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setPlaces((p) => p.filter((x) => x.id !== id));
  };

  return (
    <PortalLayout title="Saved Places" subtitle="Home, office, airport and favourite pickup points saved for one-tap booking.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Add a place</div>
        <form onSubmit={add} className="grid sm:grid-cols-4 gap-3">
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (e.g. Ikoyi residence)"
            className="h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Full address"
            className="sm:col-span-2 h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <div className="flex gap-2">
            <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
              aria-label="Place type"
              className="h-11 flex-1 bg-white/[0.03] border border-border px-2 text-sm outline-none focus:border-gold">
              {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
            <button disabled={busy} className="h-11 px-5 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">Save</button>
          </div>
        </form>
      </Card>

      <SectionTitle>Your places</SectionTitle>
      {places.length === 0 ? <Empty text="No saved places yet. Add your home or office for faster booking." /> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {places.map((p) => {
            const Icon = KINDS.find((k) => k.key === p.kind)?.icon ?? MapPin;
            return (
              <Card key={p.id} className="flex items-start gap-4 hover:border-gold/60 transition-colors">
                <Icon className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{p.label}</div>
                  <div className="text-[12px] text-muted-foreground break-words">{p.address}</div>
                  <Link to="/book" className="mt-3 inline-block text-[10px] uppercase tracking-widest text-gold">Book from here →</Link>
                </div>
                <button onClick={() => remove(p.id)} aria-label={`Delete ${p.label}`} className="text-muted-foreground hover:text-crimson">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
