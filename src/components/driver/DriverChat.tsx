import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";

type Msg = { id: string; body: string; sender_id: string | null; sender_role: string; created_at: string };
export type SystemEvent = { id: string; label: string; created_at: string };

const time = (v: string) => new Date(v).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function DriverChat({
  bookingId,
  channel,
  ownerUserId,
  systemEvents = [],
  placeholder = "Type a message…",
  emptyText = "No messages yet.",
}: {
  bookingId: string | null;
  channel: "driver" | "dispatch";
  /** For ride chat this is the customer (conversation owner). For dispatch it is the driver. */
  ownerUserId: string | null;
  systemEvents?: SystemEvent[];
  placeholder?: string;
  emptyText?: string;
}) {
  const { user } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const findConv = useCallback(async () => {
    if (!user) return null;
    let q = supabase.from("conversations").select("id").eq("channel", channel).limit(1);
    q = bookingId ? q.eq("booking_id", bookingId) : q.is("booking_id", null).eq("user_id", user.id);
    const { data } = await q;
    return data?.[0]?.id ?? null;
  }, [user, channel, bookingId]);

  useEffect(() => {
    let alive = true;
    setMsgs([]);
    setConvId(null);
    void (async () => {
      const id = await findConv();
      if (alive) setConvId(id);
    })();
    return () => { alive = false; };
  }, [findConv]);

  const loadMsgs = useCallback(async (id: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at");
    setMsgs((data as Msg[]) ?? []);
  }, []);

  useEffect(() => {
    if (!convId) return;
    void loadMsgs(convId);
    const ch = supabase.channel(rtTopic("dchat-" + convId))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        () => void loadMsgs(convId))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [convId, loadMsgs]);

  const feed = useMemo(() => {
    const items = [
      ...msgs.map((m) => ({ kind: "msg" as const, at: m.created_at, m })),
      ...systemEvents.map((e) => ({ kind: "sys" as const, at: e.created_at, e })),
    ];
    return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [msgs, systemEvents]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [feed.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user) return;
    setBusy(true);
    let id = convId ?? (await findConv());
    if (!id) {
      const { data, error } = await supabase.from("conversations").insert({
        user_id: ownerUserId ?? user.id,
        channel,
        booking_id: bookingId,
        subject: channel === "dispatch" ? "Dispatch" : "Ride chat",
      } as never).select("id").single();
      if (error) { setBusy(false); return; }
      id = (data as { id: string }).id;
      setConvId(id);
    }
    await supabase.from("messages").insert({
      conversation_id: id, sender_id: user.id, sender_role: "driver", body,
    } as never);
    setText("");
    setBusy(false);
    void loadMsgs(id);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-3">
        {feed.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-10">{emptyText}</div>
        )}
        {feed.map((it) =>
          it.kind === "sys" ? (
            <div key={"s" + it.e.id} className="text-center">
              <span className="inline-block px-3 py-1 border border-border bg-white/[0.03] text-[10px] uppercase tracking-widest text-muted-foreground">
                {time(it.at)} · System · {it.e.label}
              </span>
            </div>
          ) : (
            <div key={it.m.id} className={`flex ${it.m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 text-sm ${
                it.m.sender_id === user?.id ? "bg-gold/15 border border-gold/40" : "bg-white/[0.05] border border-border"}`}>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                  {it.m.sender_id === user?.id ? "You" : it.m.sender_role} · {time(it.m.created_at)}
                </div>
                {it.m.body}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          placeholder={placeholder}
          className="flex-1 h-12 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold"
        />
        <button onClick={() => void send()} disabled={busy || !text.trim()}
          aria-label="Send message"
          className="h-12 w-12 grid place-items-center bg-gold text-[var(--navy-deep)] disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
