import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCP, cpInsert } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/broadcasts")({ component: Page });

function Page() {
  const { rows, reload } = useCP("broadcasts", "created_at", false);
  const { rows: profiles } = useCP("profiles", "full_name");
  const { rows: roles } = useCP("user_roles");
  const [form, setForm] = useState<Row>({ channel: "in_app", audience: "all", subject: "", body: "" });
  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";

  const targets = () => {
    const drivers = new Set(roles.filter((r: Row) => r.role === "driver").map((r: Row) => r.user_id));
    const admins = new Set(roles.filter((r: Row) => ["admin", "super_user"].includes(r.role)).map((r: Row) => r.user_id));
    if (form.audience === "drivers") return profiles.filter((p: Row) => drivers.has(p.id));
    if (form.audience === "admins") return profiles.filter((p: Row) => admins.has(p.id));
    if (form.audience === "vip") return profiles.filter((p: Row) => ["diamond", "elite"].includes(p.loyalty_tier));
    if (form.audience === "customers") return profiles.filter((p: Row) => !drivers.has(p.id) && !admins.has(p.id));
    return profiles;
  };

  const send = async () => {
    if (!form.subject || !form.body) return toast.error("Subject and message required");
    const people = targets();
    const err = await cpInsert("broadcasts", { ...form, status: "sent", sent_at: new Date().toISOString(), recipients: people.length }, form.subject);
    if (err) return toast.error(err.message);
    if (form.channel === "in_app" && people.length) {
      await supabase.from("notifications").insert(people.map((p: Row) => ({
        user_id: p.id, title: form.subject, body: form.body, kind: "broadcast",
      })) as never);
    }
    toast.success(`Broadcast dispatched to ${people.length} recipients`);
    setForm({ channel: "in_app", audience: "all", subject: "", body: "" }); reload();
  };

  return (
    <SuperLayout title="Notification Engine" subtitle="Targeted broadcasts across in-app, email, SMS, push and WhatsApp. In-app delivery is live; external channels dispatch once their integration is connected.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Campaigns" value={rows.length.toString()} />
        <CStat label="Sent" value={rows.filter((r) => r.status === "sent").length.toString()} tone="good" />
        <CStat label="Recipients reached" value={rows.reduce((a, r) => a + Number(r.recipients || 0), 0).toString()} />
        <CStat label="Audience size" value={targets().length.toString()} hint="Current selection" />
      </div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <CPanel title="Campaign History">
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-widest bg-white/10 px-1.5 py-0.5">{r.channel}</span>
                  <span className="text-[9px] uppercase tracking-widest text-crimson">{r.audience}</span>
                  <span className="flex-1 truncate">{r.subject}</span>
                  <span className="text-[10px] text-muted-foreground">{r.recipients} · {since(r.created_at)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{r.body}</div>
              </div>
            ))}
            {!rows.length && <CEmpty>No broadcasts sent yet.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="Compose">
          <div className="p-3 space-y-2">
            <select className={field} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {["in_app", "email", "sms", "push", "whatsapp"].map((c) => <option key={c} value={c}>{c.replace("_", "-")}</option>)}
            </select>
            <select className={field} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              {["all", "customers", "drivers", "admins", "vip"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={field} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="p-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full" rows={5} placeholder="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <button onClick={send} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest">Dispatch broadcast</button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
