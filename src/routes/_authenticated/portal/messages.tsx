import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/messages")({
  head: () => ({
    meta: [
      { title: "Messages — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Chat with your chauffeur, concierge, consultant and BiLUXS support.",
      },
      { property: "og:title", content: "Messages — BiLUXS" },
      {
        property: "og:description",
        content:
          "Chat with your chauffeur, concierge, consultant and BiLUXS support.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Convo = {
  id: string;
  channel: string;
  subject: string | null;
  last_message_at: string;
};

type Msg = {
  id: string;
  body: string;
  sender_id: string | null;
  sender_role: string;
  created_at: string;
};

const CHANNELS = [
  { key: "support", label: "Support" },
  { key: "concierge", label: "Concierge" },
  { key: "consultant", label: "Travel Consultant" },
  { key: "driver", label: "Chauffeur" },
];

function Page() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("support");
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id,channel,subject,last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    
    const list = (data as Convo[]) ?? [];
    setConvos(list);
    setActiveId((cur) => cur ?? list[0]?.id ?? null);
  }, [user]);

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
      .channel(rtTopic("portal-msgs-" + activeId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => void loadMsgs(activeId),
      )
      .subscribe();
      
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [activeId, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const startConvo = async () => {
    if (!user) return;
    setIsCreating(true);
    const label = CHANNELS.find((c) => c.key === channel)?.label ?? "Support";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, channel, subject: `${label} conversation` })
      .select("id,channel,subject,last_message_at")
      .single();
      
    setIsCreating(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    setConvos((c) => [data as Convo, ...c]);
    setActiveId((data as Convo).id);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !body.trim() || isSending) return;
    
    const text = body.trim();
    setBody("");
    setIsSending(true);
    
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      sender_role: "customer",
      body: text,
    });
    
    setIsSending(false);
    
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
  };

  const activeConvo = convos.find((c) => c.id === activeId);

  return (
    <PortalLayout
      title="Messages"
      subtitle="Connect directly with your chauffeur, concierge, or BiLUXS desk."
      actions={
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              aria-label="Conversation type"
              className="h-10 appearance-none bg-white/[0.02] border border-white/10 pl-3 pr-8 text-xs text-white/80 outline-none focus:border-gold focus:bg-white/[0.05] transition-colors cursor-pointer"
            >
              {CHANNELS.map((c) => (
                <option key={c.key} value={c.key} className="bg-[#0a0511]">
                  {c.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
              ▼
            </div>
          </div>
          <button
            onClick={startConvo}
            disabled={isCreating}
            className="h-10 px-5 bg-crimson hover:bg-crimson/90 text-white text-[10px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            New Thread
          </button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column: Conversation List */}
        <Card className="p-0 border-white/10 h-[70vh] flex flex-col bg-[#0a0511]/50">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gold" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">
              Active Threads
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 ? (
              <div className="p-6 text-center text-white/40">
                <div className="text-sm">No conversations yet.</div>
                <button
                  onClick={startConvo}
                  className="mt-4 inline-flex h-10 items-center justify-center px-6 border border-crimson/50 text-crimson hover:bg-crimson hover:text-white text-[10px] uppercase tracking-[0.2em] transition-colors"
                >
                  Start one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {convos.map((c) => {
                  const isActive = activeId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left p-5 transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "bg-white/[0.04]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                        />
                      )}
                      <div className="flex justify-between items-start mb-1.5">
                        <span
                          className={`text-[9px] uppercase tracking-[0.3em] ${
                            isActive ? "text-gold" : "text-white/40"
                          }`}
                        >
                          {c.channel}
                        </span>
                        <span className="text-[10px] text-white/30 shrink-0">
                          {dt(c.last_message_at).split(" at ")[1] ?? dt(c.last_message_at)}
                        </span>
                      </div>
                      <div
                        className={`text-sm truncate pr-4 ${
                          isActive ? "text-white" : "text-white/70"
                        }`}
                      >
                        {c.subject ?? "Secure Conversation"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Active Chat View */}
        <Card className="p-0 flex flex-col h-[70vh] border-gold/20 bg-gradient-to-br from-[#0a0511] to-gold/5 relative overflow-hidden">
          {!activeId ? (
            <div className="flex-1 grid place-items-center">
              <Empty text="Select a conversation from the sidebar or start a new one." />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between z-10">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-1">
                    {activeConvo?.channel ?? "Channel"}
                  </div>
                  <div className="text-sm text-white font-medium">
                    {activeConvo?.subject ?? "Secure Chat"}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scroll-smooth">
                {msgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-gold/70" />
                    </div>
                    <div className="text-sm text-white/60 max-w-sm">
                      This channel is secure. Send your first message below—our desk responds within minutes.
                    </div>
                  </div>
                )}
                
                <AnimatePresence initial={false}>
                  {msgs.map((m) => {
                    const mine = m.sender_role === "customer";
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] px-5 py-4 ${
                            mine
                              ? "bg-gold/10 border border-gold/20 text-white rounded-l-sm rounded-tr-sm"
                              : "bg-white/[0.03] border border-white/10 text-white/90 rounded-r-sm rounded-tl-sm"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-4 mb-2">
                            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40">
                              {m.sender_role.replace("_", " ")}
                            </span>
                          </div>
                          <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                            {m.body}
                          </div>
                          <div className="text-[9px] text-white/30 mt-3 text-right">
                            {dt(m.created_at)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={endRef} className="h-1" />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={send}
                className="border-t border-white/10 bg-[#0a0511] p-4 flex gap-3 z-10"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message securely..."
                  disabled={isSending}
                  className="flex-1 h-12 bg-white/[0.02] border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold focus:bg-white/[0.05] transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!body.trim() || isSending}
                  className="h-12 px-6 bg-crimson hover:bg-crimson/90 text-white inline-flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:hover:bg-crimson shadow-[0_0_15px_rgba(220,20,60,0.15)] hover:shadow-[0_0_20px_rgba(220,20,60,0.3)]"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </form>

              {/* Decorative Background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full mix-blend-screen filter blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-crimson rounded-full mix-blend-screen filter blur-[100px]" />
              </div>
            </>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
}
