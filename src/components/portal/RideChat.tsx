import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";

type Msg = { id: string; body: string; sender_role: string; sender_id: string | null; created_at: string };

/** Booking-scoped chat between the member and their assigned chauffeur. */
export function RideChat({ bookingId, driverName }: { bookingId: string; driverName?: string | null }) {
  const { user } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadMsgs = useCallback(async (cid: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", cid).order("created_at");
    setMsgs((data as Msg[]) ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("conversations").select("id")
        .eq("booking_id", bookingId).eq("channel", "driver").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (data?.id) { setConvId(data.id); void loadMsgs(data.id); }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user, loadMsgs]);

  useEffect(() => {
    if (!convId) return;
    const ch = supabase.channel(rtTopic("ride-chat-" + convId))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        () => void loadMsgs(convId))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [convId, loadMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setBusy(true);
    let cid = convId;
    if (!cid) {
      const { data, error } = await supabase.from("conversations")
        .insert({ user_id: user.id, booking_id: bookingId, channel: "driver", subject: "Chauffeur chat" })
        .select("id").single();
      if (error || !data) { setBusy(false); return; }
      cid = data.id;
      setConvId(cid);
    }
    await supabase.from("messages").insert({ conversation_id: cid, sender_id: user.id, sender_role: "customer", body });
    setText("");
    setBusy(false);
    void loadMsgs(cid);
  };

  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">
        Message {driverName ? driverName.split(" ")[0] : "your chauffeur"}
      </div>
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
        {msgs.length === 0 && (
          <p className="text-[12px] text-muted-foreground">
            Send a quick note — for example where exactly to meet you. This chat closes when your ride is complete.
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.sender_role === "customer";
          return (
            <div key={m.id} className={`max-w-[85%] px-3 py-2 text-[13px] ${mine ? "ml-auto bg-crimson/20 border border-crimson/40" : "bg-white/[0.05] border border-border"}`}>
              {m.body}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
          className="flex-1 h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
        <button disabled={busy || !text.trim()} aria-label="Send message"
          className="h-11 w-12 grid place-items-center bg-crimson text-white disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
