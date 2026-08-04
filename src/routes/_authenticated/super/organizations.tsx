import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useCP, cpInsert, cpUpdate, cpDelete } from "@/lib/super";
import type { Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/organizations")({ component: Page });

const KINDS = ["branch", "business_unit", "city", "country", "region", "fleet_region", "warehouse", "tour_office"];

function Page() {
  const { rows, reload } = useCP("organizations", "name");
  const [form, setForm] = useState<Row>({ name: "", kind: "branch", city: "", country: "Nigeria", region: "", contact_email: "", contact_phone: "" });

  const add = async () => {
    if (!form.name) return toast.error("Name required");
    const err = await cpInsert("organizations", form, `Organization ${form.name}`);
    if (err) return toast.error(err.message);
    toast.success("Organization created");
    setForm({ name: "", kind: "branch", city: "", country: "Nigeria", region: "", contact_email: "", contact_phone: "" });
    reload();
  };

  const toggle = async (r: Row) => {
    const next = r.status === "active" ? "suspended" : "active";
    const err = await cpUpdate("organizations", { id: r.id }, { status: next }, `${r.name} → ${next}`);
    if (err) return toast.error(err.message);
    reload();
  };

  const remove = async (r: Row) => {
    const err = await cpDelete("organizations", { id: r.id }, r.name);
    if (err) return toast.error(err.message);
    toast.success("Removed"); reload();
  };

  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";

  return (
    <SuperLayout title="Organization Management" subtitle="Branches, business units, cities, regions, fleet zones, warehouses and tour offices. Every operational record can later be filtered by these units.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Units" value={rows.length.toString()} />
        <CStat label="Active" value={rows.filter((r) => r.status === "active").length.toString()} tone="good" />
        <CStat label="Countries" value={new Set(rows.map((r) => r.country).filter(Boolean)).size.toString()} />
        <CStat label="Cities" value={new Set(rows.map((r) => r.city).filter(Boolean)).size.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <CPanel title="Registry">
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{r.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {String(r.kind).replace("_", " ")} · {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <button onClick={() => toggle(r)}
                  className={`text-[10px] px-2 h-6 uppercase tracking-widest ${r.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-crimson/20 text-crimson"}`}>
                  {r.status}
                </button>
                <button onClick={() => remove(r)} className="text-muted-foreground hover:text-crimson"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {!rows.length && <CEmpty>No organizations yet. Create the first branch.</CEmpty>}
          </div>
        </CPanel>

        <CPanel title="New Unit">
          <div className="p-3 space-y-2">
            <input className={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
            </select>
            <input className={field} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={field} placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <input className={field} placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <input className={field} placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <input className={field} placeholder="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <button onClick={add} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Create unit
            </button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
