import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/messages")({
  head: () => ({ meta: [
    { title: "Messages — BiLUXS Member Portal" },
    { name: "description", content: "Chat with your chauffeur, concierge, consultant and BiLUXS support." },
    { property: "og:title", content: "Messages — BiLUXS" },
    { property: "og:description", content: "Chat with your chauffeur, concierge, consultant and BiLUXS support." },
  ] }),
  component: Page,
});

type Convo = { id: string; channel: string; subject: string | null; last_message_at: string };
type Msg = { id: string; body: string; sender_id: string | null; sender_role: string; created_at: string };

const CHANNELS = [
  { key: "support", label: "Support" },
  { key: "concierge", label: "Concierge" },
  { key: "consultant", label: "Travel consultant" },
  { key: "driver", label: "Chauffeur" },
];

function Page() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("support");
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("conversations").select("id,channel,subject,last_message_at")
      .eq("user_id", user.id).order("last_message_at", { ascending: false });
    const list = (data as Convo[]) ?? [];
    setConvos(list);
    setActiveId((cur) => cur ?? list[0]?.id ?? null);
  }, [user]);

  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await supabase.from("messages").select("id,body,sender_id,sender_role,created_at")
      .eq("conversation_id", id).order("created_at", { ascending: true });
    setMsgs((data as Msg[]) ?? []);
  }, []);

  useEffect(() => { void loadConvos(); }, [loadConvos]);

  useEffect(() => {
    if (!activeId) { setMsgs([]); return; }
    void loadMsgs(activeId);
    const ch = supabase.channel("portal-msgs-" + activeId)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        () => void loadMsgs(activeId))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [activeId, loadMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const startConvo = async () => {
    if (!user) return;
    const label = CHANNELS.find((c) => c.key === channel)?.label ?? "Support";
    const { data, error } = await supabase.from("conversations")
      .insert({ user_id: user.id, channel, subject: `${label} conversation` })
      .select("id,channel,subject,last_message_at").single();
    if (error) { toast.error(error.message); return; }
    setConvos((c) => [data as Convo, ...c]);
    setActiveId((data as Convo).id);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !body.trim()) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, sender_role: "customer", body: text });
    if (error) { toast.error(error.message); setBody(text); return; }
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeId);
    void loadMsgs(activeId);
  };

  return (
    <PortalLayout title="Messages" subtitle="Chat with your chauffeur, concierge, consultant and BiLUXS support."
      actions={
        <div className="hidden sm:flex gap-2">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Conversation type"
            className="h-10 bg-white/[0.03] border border-border px-2 text-xs outline-none focus:border-gold">
            {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button onClick={startConvo} className="h-10 px-4 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
      }>
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-0 max-h-[70vh] overflow-y-auto">
          {convos.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No conversations yet.
              <button onClick={startConvo} className="mt-4 block h-10 px-4 bg-crimson text-white text-[10px] uppercase tracking-widest">Start one</button>
            </div>
          ) : convos.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-4 border-b border-border/60 transition-colors ${activeId === c.id ? "bg-white/[0.05] text-gold" : "hover:bg-white/[0.03]"}`}>
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{c.channel}</div>
              <div className="text-sm truncate">{c.subject ?? "Conversation"}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{dt(c.last_message_at)}</div>
            </button>
          ))}
        </Card>

        <Card className="p-0 flex flex-col h-[70vh]">
          {!activeId ? <div className="flex-1 grid place-items-center"><Empty text="Select or start a conversation." /></div> : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.length === 0 && <div className="text-sm text-muted-foreground">Send the first message — our desk replies within minutes.</div>}
                {msgs.map((m) => {
                  const mine = m.sender_role === "customer";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 text-sm ${mine ? "bg-crimson/20 border border-crimson/40" : "bg-white/[0.05] border border-border"}`}>
                        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{m.sender_role}</div>
                        {m.body}
                        <div className="text-[10px] text-muted-foreground mt-1">{dt(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
                <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…"
                  className="flex-1 h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
                <button className="h-11 px-5 bg-crimson text-white inline-flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
}
