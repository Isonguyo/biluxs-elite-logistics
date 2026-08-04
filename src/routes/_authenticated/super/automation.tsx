import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Zap } from "lucide-react";
import { SuperLayout, CPanel, CStat, CEmpty, Toggle } from "@/components/super/SuperLayout";
import { useCP, cpInsert, cpUpdate, cpDelete } from "@/lib/super";
import { since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/automation")({ component: Page });

const FIELDS = [
  { key: "booking_total", label: "Booking value (₦)" },
  { key: "driver_offline_minutes", label: "Driver offline (minutes)" },
  { key: "trip_delay_minutes", label: "Trip delay (minutes)" },
  { key: "wallet_balance", label: "Wallet balance (₦)" },
  { key: "cancellation_rate", label: "Cancellation rate (%)" },
];
const OPS = [{ key: "gt", label: "is greater than" }, { key: "lt", label: "is less than" }, { key: "eq", label: "equals" }];
const ACTIONS = [
  "Apply Luxury Protocol", "Assign Senior Driver", "Notify Operations Director",
  "Notify Fleet Manager", "Notify Finance Manager", "Flag for Review", "Send Customer Apology", "Escalate to SOS Desk",
];

function Page() {
  const { rows, reload } = useCP("automation_rules", "created_at", false);
  const [form, setForm] = useState<Row>({ name: "", trigger_field: FIELDS[0].key, trigger_operator: "gt", trigger_value: "", actions: [] as string[] });

  const toggleAction = (a: string) => setForm((f: Row) => ({
    ...f, actions: (f.actions as string[]).includes(a) ? (f.actions as string[]).filter((x) => x !== a) : [...(f.actions as string[]), a],
  }));

  const add = async () => {
    if (!form.name || !form.trigger_value || !(form.actions as string[]).length) return toast.error("Name, threshold and at least one action required");
    const err = await cpInsert("automation_rules", form, form.name);
    if (err) return toast.error(err.message);
    toast.success("Rule armed");
    setForm({ name: "", trigger_field: FIELDS[0].key, trigger_operator: "gt", trigger_value: "", actions: [] });
    reload();
  };

  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";

  return (
    <SuperLayout title="Workflow Automation" subtitle="If/then governance rules that operations inherits automatically — no engineering ticket required.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Rules" value={rows.length.toString()} />
        <CStat label="Armed" value={rows.filter((r) => r.enabled).length.toString()} tone="good" />
        <CStat label="Total fires" value={rows.reduce((a, r) => a + Number(r.fire_count || 0), 0).toString()} />
        <CStat label="Last fired" value={since(rows.map((r) => r.last_fired_at).filter(Boolean).sort().reverse()[0])} />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <CPanel title="Rule Book">
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-4 flex gap-4 items-start">
                <Zap className="h-4 w-4 text-crimson mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    IF {FIELDS.find((f) => f.key === r.trigger_field)?.label ?? r.trigger_field}{" "}
                    {OPS.find((o) => o.key === r.trigger_operator)?.label} {r.trigger_value}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {((r.actions as string[]) ?? []).map((a) => (
                      <span key={a} className="text-[9px] uppercase tracking-widest bg-white/10 px-1.5 py-0.5">{a}</span>
                    ))}
                  </div>
                </div>
                <Toggle on={!!r.enabled} onChange={async (v) => { await cpUpdate("automation_rules", { id: r.id }, { enabled: v }, r.name); reload(); }} />
                <button onClick={async () => { await cpDelete("automation_rules", { id: r.id }, r.name); reload(); }}
                  className="text-muted-foreground hover:text-crimson"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {!rows.length && <CEmpty>No automation rules yet.</CEmpty>}
          </div>
        </CPanel>

        <CPanel title="Rule Builder">
          <div className="p-3 space-y-2">
            <input className={field} placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="text-[9px] uppercase tracking-[0.35em] text-crimson pt-2">If</div>
            <select className={field} value={form.trigger_field} onChange={(e) => setForm({ ...form, trigger_field: e.target.value })}>
              {FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select className={field} value={form.trigger_operator} onChange={(e) => setForm({ ...form, trigger_operator: e.target.value })}>
              {OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <input className={field} placeholder="Threshold e.g. 250000" value={form.trigger_value} onChange={(e) => setForm({ ...form, trigger_value: e.target.value })} />
            <div className="text-[9px] uppercase tracking-[0.35em] text-crimson pt-2">Then</div>
            <div className="grid gap-1">
              {ACTIONS.map((a) => {
                const on = (form.actions as string[]).includes(a);
                return (
                  <button key={a} onClick={() => toggleAction(a)}
                    className={`text-left px-3 py-2 border text-xs ${on ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-crimson/50"}`}>{a}</button>
                );
              })}
            </div>
            <button onClick={add} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Arm rule
            </button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
