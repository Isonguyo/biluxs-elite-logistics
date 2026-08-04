import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "@/components/super/SuperLayout";
import { useCP, cpInsert, cpUpdate, cpDelete } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/destinations")({ component: Page });

function Page() {
  const { rows, reload } = useCP("destinations", "country");
  const [form, setForm] = useState<Row>({ country: "", city: "", package_name: "", price: 0, image_url: "", summary: "" });
  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";
  const add = async () => {
    if (!form.country || !form.city) return toast.error("Country and city required");
    const err = await cpInsert("destinations", { ...form, price: Number(form.price) || 0 }, `${form.city}, ${form.country}`);
    if (err) return toast.error(err.message);
    toast.success("Destination added"); setForm({ country: "", city: "", package_name: "", price: 0, image_url: "", summary: "" }); reload();
  };
  return (
    <SuperLayout title="Destination Management" subtitle="The travel catalogue: countries, cities, packages, pricing, imagery, availability and featured tours.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Destinations" value={rows.length.toString()} />
        <CStat label="Available" value={rows.filter((r) => r.available).length.toString()} tone="good" />
        <CStat label="Featured" value={rows.filter((r) => r.featured).length.toString()} />
        <CStat label="Countries" value={new Set(rows.map((r) => r.country)).size.toString()} />
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <CPanel title="Catalogue">
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-3 flex items-center gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate">{r.city}, {r.country}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.package_name ?? "—"} · {naira(r.price)}</div>
                </div>
                <button onClick={async () => { await cpUpdate("destinations", { id: r.id }, { featured: !r.featured }, r.city); reload(); }}
                  className={`text-[10px] uppercase tracking-widest px-2 h-6 ${r.featured ? "bg-gold/20 text-gold" : "bg-white/10 text-white/60"}`}>Featured</button>
                <Toggle on={!!r.available} onChange={async (v) => { await cpUpdate("destinations", { id: r.id }, { available: v }, r.city); reload(); }} />
                <button onClick={async () => { await cpDelete("destinations", { id: r.id }, r.city); reload(); }} className="text-muted-foreground hover:text-crimson">✕</button>
              </div>
            ))}
            {!rows.length && <CEmpty>No destinations yet.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="New Destination">
          <div className="p-3 space-y-2">
            <input className={field} placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <input className={field} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={field} placeholder="Package name" value={form.package_name} onChange={(e) => setForm({ ...form, package_name: e.target.value })} />
            <input className={field} placeholder="Price (₦)" value={String(form.price)} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className={field} placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <button onClick={add} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest">Add destination</button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
