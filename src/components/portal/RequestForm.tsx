import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, Empty } from "./PortalLayout";
import { dt } from "@/lib/portal";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "textarea";
  required?: boolean;
  placeholder?: string;
};

/** Reusable "request a service" form backed by a real table. */
export function RequestForm({
  table, fields, fixed, submitLabel, title, onDone,
}: {
  table: "concierge_requests" | "cargo_shipments" | "tour_bookings" | "shop_orders";
  fields: Field[];
  fixed?: Record<string, unknown>;
  submitLabel: string;
  title: string;
  onDone?: () => void;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (hp) return;
    if (Date.now() - openedAt < 2000) { toast.error("Please take a moment to review your request."); return; }
    setBusy(true);
    const payload: Record<string, unknown> = { user_id: user.id, ...fixed };
    for (const f of fields) {
      const v = values[f.name];
      if (v === undefined || v === "") continue;
      payload[f.name] = f.type === "number" ? Number(v) : v;
    }
    const { error } = await supabase.from(table).insert(payload as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request received — our team will confirm shortly.");
    setValues({});
    onDone?.();
  };

  return (
    <Card>
      <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">{title}</div>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} name="website_verify" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {fields.map((f) => (
          <label key={f.name} className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                required={f.required} rows={3} placeholder={f.placeholder}
                value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="mt-1 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold"
              />
            ) : (
              <input
                type={f.type ?? "text"} required={f.required} placeholder={f.placeholder}
                value={values[f.name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="mt-1 w-full h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold"
              />
            )}
          </label>
        ))}
        <div className="sm:col-span-2">
          <button disabled={busy} className="h-11 px-8 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">
            {busy ? "Sending…" : submitLabel}
          </button>
        </div>
      </form>
    </Card>
  );
}

export function RequestList({ rows, columns, empty }: {
  rows: any[]; columns: { key: string; label: string; render?: (r: any) => React.ReactNode }[]; empty: string;
}) {
  if (!rows.length) return <Empty text={empty} />;
  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Card key={r.id} className="hover:border-gold/60 transition-colors">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {columns.map((c) => (
              <div key={c.key} className="min-w-0">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
                <div className="text-sm truncate capitalize">{c.render ? c.render(r) : String(r[c.key] ?? "—").replace(/_/g, " ")}</div>
              </div>
            ))}
            <div className="ml-auto text-[11px] text-muted-foreground">{dt(r.created_at)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone =
    ["delivered", "completed", "confirmed", "approved"].includes(value) ? "bg-emerald-500/15 text-emerald-300"
    : ["cancelled", "rejected", "failed"].includes(value) ? "bg-red-500/15 text-red-300"
    : ["in_transit", "processing", "in_progress"].includes(value) ? "bg-amber-500/15 text-amber-300"
    : "bg-white/10 text-white/70";
  return <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest capitalize ${tone}`}>{value.replace(/_/g, " ")}</span>;
}
