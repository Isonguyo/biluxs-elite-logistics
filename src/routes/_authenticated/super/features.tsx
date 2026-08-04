import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SuperLayout, CPanel, CStat, Toggle } from "@/components/super/SuperLayout";
import { useCP, cpUpdate } from "@/lib/super";
import { since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/features")({ component: Page });

function Page() {
  const { rows, reload } = useCP("feature_flags", "category");

  const flip = async (r: Row, enabled: boolean) => {
    const err = await cpUpdate("feature_flags", { key: r.key }, { enabled }, `${r.label} → ${enabled ? "on" : "off"}`);
    if (err) return toast.error(err.message);
    toast.success(`${r.label} ${enabled ? "enabled" : "disabled"} platform-wide`);
    reload();
  };

  const cats = Array.from(new Set(rows.map((r: Row) => r.category)));

  return (
    <SuperLayout title="Feature Flags" subtitle="Turn product surfaces on or off across the whole platform without shipping code. Customer, driver and admin dashboards read these flags live.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Features" value={rows.length.toString()} />
        <CStat label="Enabled" value={rows.filter((r) => r.enabled).length.toString()} tone="good" />
        <CStat label="Disabled" value={rows.filter((r) => !r.enabled).length.toString()} tone="warn" />
        <CStat label="Last change" value={since(rows.map((r) => r.updated_at).sort().reverse()[0])} />
      </div>

      <div className="space-y-4">
        {cats.map((c) => (
          <CPanel key={c} title={c}>
            <div className="divide-y divide-border">
              {rows.filter((r: Row) => r.category === c).map((r: Row) => (
                <div key={r.key} className="p-4 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">{r.description}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mt-1">key · {r.key}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest ${r.enabled ? "text-emerald-300" : "text-crimson"}`}>
                    {r.enabled ? "Live" : "Off"}
                  </span>
                  <Toggle on={!!r.enabled} onChange={(v) => flip(r, v)} />
                </div>
              ))}
            </div>
          </CPanel>
        ))}
      </div>
    </SuperLayout>
  );
}
