import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, MessageSquare, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: Page,
});

type Convo = {
  id: string;
  user_id: string;
  channel: string;
  subject: string | null;
  last_message_at: string;
  booking_id?: string | null;
};

type Msg = {
  id: string;
  body: string;
  sender_id: string | null;
  sender_role: string;
  created_at: string;
};

function Page() {
  const { user } = useAuth();
  const { rows: profiles } = useTable("profiles", { order: "full_name", realtime: false });
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setConvos((data as Convo[]) ?? []);
    setActiveId((cur) => cur ?? (data?.[0]?.id ?? null));
  }, []);

  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id,body,sender_id,sender_role,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMsgs((data as Msg[]) ?? []);
  }, []);

  useEffect(() => {
    void loadConvos();
  }, [loadConvos]);

  useEffect(() => {
    if (!activeId) {
      setMsgs([]);
      return;
    }
    void loadMsgs(activeId);
    const ch = supabase
      .channel(rtTopic("admin-msgs-" + activeId))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        () => void loadMsgs(activeId)
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [activeId, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !body.trim()) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      sender_role: "admin",
      body: text,
    } as never);
    if (error) {
      toast.error(error.message);
      setBody(text);
      return;
    }
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeId);
    void loadMsgs(activeId);
    void loadConvos();
  };

  const active = activeId ? convos.find((c) => c.id === activeId) : null;
  const participant = active ? profiles.find((p: Row) => p.id === active.user_id) : null;

  const filtered = convos.filter((c) => {
    if (!search) return true;
    const hay = search.toLowerCase();
    const prof = profiles.find((p: Row) => p.id === c.user_id);
    return `${prof?.full_name ?? ""} ${c.subject ?? ""} ${c.channel}`.toLowerCase().includes(hay);
  });

  const unread = convos.filter((c) => {
    const lastMsg = msgs.find((m) => m.id);
    return lastMsg && new Date(c.last_message_at) > new Date(lastMsg.created_at);
  });

  return (
    <AdminLayout
      title="Messages"
      subtitle="Admin ↔ Customer and Driver communications across support, concierge, and booking-specific channels."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Conversations" value={convos.length.toString()} />
        <Stat label="Active" value={filtered.length.toString()} />
        <Stat label="Support Channel" value={convos.filter((c) => c.channel === "support").length.toString()} />
        <Stat label="Booking Related" value={convos.filter((c) => c.booking_id).length.toString()} />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Panel title={<span className="inline-flex items-center gap-2"><MessageSquare className="h-3 w-3" /> Conversations</span>}>
          <div className="p-3 border-b border-border">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full h-8 px-2 bg-input border border-border text-xs outline-none focus:border-gold"
            />
          </div>
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {filtered.length === 0 ? (
              <Empty>No conversations match.</Empty>
            ) : (
              filtered.map((c) => {
                const prof = profiles.find((p: Row) => p.id === c.user_id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left p-3 border-b border-border/50 hover:bg-white/[0.03] transition-colors ${
                      activeId === c.id ? "bg-white/[0.05]" : ""
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-[0.3em] text-gold">{c.channel}</div>
                    <div className="text-sm truncate mt-0.5">{prof?.full_name ?? "Unknown"}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 truncate">{c.subject ?? "Conversation"}</div>
                    <div className="text-[9px] text-muted-foreground mt-1">{since(c.last_message_at)}</div>
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title={active ? `Chat — ${participant?.full_name ?? "Conversation"}` : "Select a conversation"}>
          {!activeId ? (
            <Empty>Select a conversation to view messages.</Empty>
          ) : (
            <div className="flex flex-col h-[600px]">
              {participant && (
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-display">{participant.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{participant.phone ?? "No phone"}</div>
                  </div>
                  {participant.phone && (
                    <a
                      href={`tel:${participant.phone}`}
                      className="h-8 w-8 grid place-items-center border border-border hover:border-gold text-[10px]"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.length === 0 && <div className="text-sm text-muted-foreground">No messages yet.</div>}
                {msgs.map((m) => {
                  const isAdmin = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 text-sm rounded ${
                          isAdmin ? "bg-gold/20 border border-gold/30" : "bg-white/[0.05] border border-border"
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{m.sender_role}</div>
                        {m.body}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 h-10 bg-input border border-border px-3 text-sm outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-gold text-black inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold hover:bg-gold/90 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </form>
            </div>
          )}
        </Panel>
      </div>
    </AdminLayout>
  );
}
