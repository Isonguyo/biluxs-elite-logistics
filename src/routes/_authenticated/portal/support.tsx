import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Phone, ShieldAlert, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/support")({
  head: () => ({ meta: [
    { title: "Support — BiLUXS Member Portal" },
    { name: "description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
    { property: "og:title", content: "Support — BiLUXS" },
    { property: "og:description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
  ] }),
  component: Page,
});

type Ticket = { id: string; subject: string | null; channel: string; last_message_at: string };

const FAQ = [
  { q: "How do I use my boarding QR?", a: "Open the trip in My Trips and present the QR to your chauffeur. It is single-use and invalidates on scan." },
  { q: "When am I charged?", a: "Payment is confirmed at booking. You can pre-fund your Wallet and pay in one tap on future journeys." },
  { q: "Can I change a pickup time?", a: "Yes — message the support desk with your waybill code and we will re-dispatch at no cost up to 2 hours before pickup." },
  { q: "How do refunds work?", a: "Approved refunds are credited to your BiLUXS wallet instantly and appear in Wallet → Transaction history." },
];

function Page() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("conversations").select("id,subject,channel,last_message_at")
      .eq("user_id", user.id).in("channel", ["support", "emergency"])
      .order("last_message_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const open = async (channel: string, subj: string, message: string) => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase.from("conversations")
      .insert({ user_id: user.id, channel, subject: subj }).select("id").single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    const { error: mErr } = await supabase.from("messages")
      .insert({ conversation_id: (data as { id: string }).id, sender_id: user.id, sender_role: "customer", body: message });
    setBusy(false);
    if (mErr) { toast.error(mErr.message); return; }
    toast.success(channel === "emergency" ? "Emergency team alerted" : "Ticket opened — we'll reply shortly");
    setSubject(""); setBody("");
    void load();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { toast.error("Add a subject and a description"); return; }
    void open("support", subject.trim(), body.trim());
  };

  return (
    <PortalLayout title="Support" subtitle="24/7 BiLUXS assistance, emergency escalation and help topics.">
      <div className="grid sm:grid-cols-3 gap-4">
        <a href="tel:+2348000000000" className="block">
          <Card className="hover:border-gold transition-colors h-full">
            <Phone className="h-5 w-5 text-gold" />
            <div className="font-display text-lg mt-3">Call the desk</div>
            <div className="text-[11px] text-muted-foreground mt-1">Live agents, 24 hours a day</div>
          </Card>
        </a>
        <Link to="/portal/messages" className="block">
          <Card className="hover:border-gold transition-colors h-full">
            <MessageSquare className="h-5 w-5 text-gold" />
            <div className="font-display text-lg mt-3">Live chat</div>
            <div className="text-[11px] text-muted-foreground mt-1">Chauffeur, concierge & consultants</div>
          </Card>
        </Link>
        <button
          disabled={busy}
          onClick={() => open("emergency", "Emergency assistance", "Emergency assistance requested from the member portal.")}
          className="text-left">
          <Card className="border-crimson/50 hover:border-crimson transition-colors h-full">
            <ShieldAlert className="h-5 w-5 text-crimson" />
            <div className="font-display text-lg mt-3 text-crimson">Emergency SOS</div>
            <div className="text-[11px] text-muted-foreground mt-1">Escalates instantly to operations</div>
          </Card>
        </button>
      </div>

      <SectionTitle>Open a ticket</SectionTitle>
      <Card>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
            className="h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How can we help?"
            className="bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold" />
          <button disabled={busy} className="h-11 px-8 bg-crimson text-white text-[10px] uppercase tracking-widest w-fit disabled:opacity-50">
            {busy ? "Sending…" : "Submit ticket"}
          </button>
        </form>
      </Card>

      <SectionTitle>Your tickets</SectionTitle>
      {tickets.length === 0 ? <Empty text="No support tickets yet." /> : (
        <div className="grid gap-2">
          {tickets.map((t) => (
            <Link key={t.id} to="/portal/messages" className="block">
              <Card className="flex items-center gap-4 hover:border-gold/60 transition-colors">
                <LifeBuoy className={`h-4 w-4 ${t.channel === "emergency" ? "text-crimson" : "text-gold"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{t.subject ?? "Support request"}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t.channel} · {dt(t.last_message_at)}</div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gold">Open →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SectionTitle>Help topics</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        {FAQ.map((f) => (
          <Card key={f.q}>
            <div className="text-sm">{f.q}</div>
            <p className="text-[12px] text-muted-foreground mt-2">{f.a}</p>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
