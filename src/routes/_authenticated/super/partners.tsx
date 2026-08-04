import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCP, cpInsert, cpUpdate, cpDelete } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/partners")({ component: Page });

function Page() {
  const { rows, reload } = useCP("partners", "name");
  const [form, setForm] = useState<Row>({ name: "", category: "hotel", contact_name: "", contact_email: "", contract_status: "prospect" });
  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";
  const add = async () => {
    if (!form.name) return toast.error("Name required");
    const err = await cpInsert("partners", form, form.name);
    if (err) return toast.error(err.message);
    toast.success("Partner added"); setForm({ name: "", category: "hotel", contact_name: "", contact_email: "", contract_status: "prospect" }); reload();
  };
  return (
    <SuperLayout title="Partner Management" subtitle="Airlines, hotels, security firms, cargo partners, fashion houses, insurers and corporate clients — contracts and performance in one registry.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Partners" value={rows.length.toString()} />
        <CStat label="Active contracts" value={rows.filter((r) => r.contract_status === "active").length.toString()} tone="good" />
        <CStat label="Prospects" value={rows.filter((r) => r.contract_status === "prospect").length.toString()} tone="warn" />
        <CStat label="Categories" value={new Set(rows.map((r) => r.category)).size.toString()} />
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <CPanel title="Registry">
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-3 flex items-center gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate">{r.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.category} · {r.contact_email ?? "no contact"}</div>
                </div>
                <select value={r.contract_status} onChange={async (e) => { await cpUpdate("partners", { id: r.id }, { contract_status: e.target.value }, r.name); reload(); }}
                  className="h-8 px-2 bg-input border border-border text-[10px] uppercase tracking-widest outline-none focus:border-crimson">
                  {["prospect", "negotiating", "active", "paused", "ended"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={async () => { await cpDelete("partners", { id: r.id }, r.name); reload(); }} className="text-muted-foreground hover:text-crimson">✕</button>
              </div>
            ))}
            {!rows.length && <CEmpty>No partners yet.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="Add Partner">
          <div className="p-3 space-y-2">
            <input className={field} placeholder="Partner name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["airline", "hotel", "security", "cargo", "fashion", "insurance", "corporate"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={field} placeholder="Contact name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            <input className={field} placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <button onClick={add} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest">Add partner</button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
