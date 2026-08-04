import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { SuperLayout, CPanel, CStat, Toggle } from "@/components/super/SuperLayout";
import { useCP, cpUpdate } from "@/lib/super";
import { naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/pricing")({ component: Page });

function Page() {
  const { rows, reload } = useCP("pricing_rules", "category");
  const [draft, setDraft] = useState<Record<string, string>>({});

  const save = async (r: Row) => {
    const value = Number(draft[r.key] ?? r.value);
    if (Number.isNaN(value) || value < 0) return toast.error("Enter a valid amount");
    const err = await cpUpdate("pricing_rules", { key: r.key }, { value }, `${r.label} → ${value}${r.unit === "percent" ? "%" : ""}`);
    if (err) return toast.error(err.message);
    toast.success(`${r.label} updated`); reload();
  };

  const flip = async (r: Row, active: boolean) => {
    const err = await cpUpdate("pricing_rules", { key: r.key }, { active }, `${r.label} ${active ? "active" : "paused"}`);
    if (err) return toast.error(err.message);
    reload();
  };

  const cats = Array.from(new Set(rows.map((r: Row) => r.category)));
  const luxury = rows.find((r: Row) => r.key === "luxury_protocol");
  const base = rows.find((r: Row) => r.key === "airport_base");
  const perKm = rows.find((r: Row) => r.key === "per_km");
  const sample = base && perKm ? (Number(base.value) + Number(perKm.value) * 25) * (1 + Number(luxury?.value ?? 0) / 100) : 0;

  return (
    <SuperLayout title="Pricing Engine" subtitle="Central rate card. The booking wizard and admin quotes consume these values — nothing is hardcoded.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Rules" value={rows.length.toString()} />
        <CStat label="Active" value={rows.filter((r) => r.active).length.toString()} tone="good" />
        <CStat label="Luxury Protocol" value={`${Number(luxury?.value ?? 0)}%`} />
        <CStat label="Sample 25km airport run" value={naira(sample)} hint="Base + distance + protocol" tone="good" />
      </div>

      <div className="space-y-4">
        {cats.map((c) => (
          <CPanel key={c} title={c}>
            <div className="divide-y divide-border">
              {rows.filter((r: Row) => r.category === c).map((r: Row) => (
                <div key={r.key} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="text-sm">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">{r.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.unit === "percent" ? "%" : "₦"}</span>
                    <input value={draft[r.key] ?? String(r.value)} onChange={(e) => setDraft({ ...draft, [r.key]: e.target.value })}
                      className="h-9 w-32 px-2 bg-input border border-border text-xs outline-none focus:border-crimson" />
                    <button onClick={() => save(r)} className="h-9 px-3 border border-border text-[10px] uppercase tracking-widest inline-flex items-center gap-1 hover:border-crimson">
                      <Save className="h-3 w-3" /> Save
                    </button>
                    <Toggle on={!!r.active} onChange={(v) => flip(r, v)} />
                  </div>
                </div>
              ))}
            </div>
          </CPanel>
        ))}
      </div>
    </SuperLayout>
  );
}
