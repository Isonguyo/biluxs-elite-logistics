import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: Page });

function Page() {
  const { rows: sent } = useTable("notifications", { limit: 200 });
  const { rows: profiles } = useTable("profiles", { order: "created_at", realtime: false });
  const { rows: roles } = useTable("user_roles", { order: "user_id", ascending: true, realtime: false });
  const [audience, setAudience] = useState<"customers" | "drivers" | "admins" | "everyone">("customers");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const targets = () => {
    const ids = new Set(profiles.map((p: Row) => p.id));
    const withRole = (r: string) => new Set(roles.filter((x: Row) => x.role === r).map((x: Row) => x.user_id));
    if (audience === "everyone") return [...ids];
    if (audience === "drivers") return [...withRole("driver")];
    if (audience === "admins") return [...new Set([...withRole("admin"), ...withRole("super_user")])];
    const staff = new Set([...withRole("driver"), ...withRole("admin"), ...withRole("super_user")]);
    return [...ids].filter((i) => !staff.has(i));
  };

  const broadcast = async () => {
    if (!title.trim()) return toast.error("Give the broadcast a title.");
    const ids = targets();
    if (!ids.length) return toast.error("No recipients in this audience.");
    setBusy(true);
    const { error } = await (supabase as any).from("notifications").insert(
      ids.map((id) => ({ user_id: id, title: title.trim(), body: body.trim() || null, kind: "broadcast" })),
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAudit("broadcast", "notification", undefined, `${audience} · ${title} (${ids.length} recipients)`);
    toast.success(`Broadcast delivered to ${ids.length} recipients`);
    setTitle(""); setBody("");
  };

  return (
    <AdminLayout title="Notifications" subtitle="Broadcast in-app messages to a targeted audience and review everything the platform has sent.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Sent" value={sent.length.toString()} />
        <Stat label="Unread" value={sent.filter((n) => !n.read).length.toString()} accent />
        <Stat label="Audience Size" value={targets().length.toString()} hint={audience} />
        <Stat label="Latest" value={since(sent[0]?.created_at)} />
      </div>
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        <Panel title="Compose Broadcast">
          <div className="p-4 space-y-3">
            <select value={audience} onChange={(e) => setAudience(e.target.value as any)}
              className="w-full h-10 px-3 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
              {["customers", "drivers", "admins", "everyone"].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
              className="w-full h-10 px-3 bg-input border border-border text-sm outline-none focus:border-gold" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Message"
              className="w-full p-3 bg-input border border-border text-sm outline-none focus:border-gold" />
            <button onClick={broadcast} disabled={busy}
              className="w-full h-10 inline-flex items-center justify-center gap-2 border border-gold text-gold text-[10px] uppercase tracking-widest hover:bg-gold hover:text-[var(--navy-deep)] disabled:opacity-50">
              <Send className="h-3 w-3" /> {busy ? "Sending…" : "Send broadcast"}
            </button>
            <p className="text-[10px] text-muted-foreground">Email, SMS and WhatsApp channels require provider keys — in-app delivery is live today.</p>
          </div>
        </Panel>
        <Panel title="Delivery Log">
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {sent.map((n: Row) => (
              <div key={n.id} className="p-3 text-xs">
                <div className="text-white/85">{n.title}</div>
                <div className="text-muted-foreground">{n.body}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{n.kind ?? "system"} · {since(n.created_at)}</div>
              </div>
            ))}
            {!sent.length && <Empty>Nothing delivered yet.</Empty>}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
