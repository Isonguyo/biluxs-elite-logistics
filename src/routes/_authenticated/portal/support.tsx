import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Phone, ShieldAlert, MessageSquare, HelpCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/support")({
  head: () => ({
    meta: [
      { title: "Support — BiLUXS Member Portal" },
      { name: "description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
      { property: "og:title", content: "Support — BiLUXS" },
      { property: "og:description", content: "24/7 BiLUXS assistance, emergency escalation and help topics." },
      { name: "robots", content: "noindex" },
    ],
  }),
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
    const { data } = await supabase
      .from("conversations")
      .select("id,subject,channel,last_message_at")
      .eq("user_id", user.id)
      .in("channel", ["support", "emergency"])
      .order("last_message_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (channel: string, subj: string, message: string) => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, channel, subject: subj })
      .select("id")
      .single();
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const { error: mErr } = await supabase
      .from("messages")
      .insert({ conversation_id: (data as { id: string }).id, sender_id: user.id, sender_role: "customer", body: message });
    setBusy(false);
    if (mErr) {
      toast.error(mErr.message);
      return;
    }
    toast.success(channel === "emergency" ? "Emergency team alerted" : "Ticket opened — we'll reply shortly");
    setSubject("");
    setBody("");
    void load();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and a description");
      return;
    }
    void open("support", subject.trim(), body.trim());
  };

  return (
    <PortalLayout
      title="Member Support"
      subtitle="24/7 dedicated assistance, direct concierge channels, emergency protocol escalation, and knowledge base."
    >
      <div className="space-y-8">
        {/* Quick Channels Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <a href="tel:+2348000000000" className="block h-full">
              <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold transition-all p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                    <Phone className="h-4 w-4 text-gold" />
                  </div>
                  <div className="font-display text-lg text-white">Call the Desk</div>
                  <div className="text-[11px] text-white/50 mt-1">Live elite agents available 24 hours a day</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[10px] uppercase tracking-widest text-gold font-medium flex items-center justify-between">
                  <span>Connect direct</span>
                  <span>→</span>
                </div>
              </Card>
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Link to="/portal/messages" className="block h-full">
              <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold transition-all p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                    <MessageSquare className="h-4 w-4 text-gold" />
                  </div>
                  <div className="font-display text-lg text-white">Live Chat</div>
                  <div className="text-[11px] text-white/50 mt-1">Direct channel with chauffeurs, concierge & consultants</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[10px] uppercase tracking-widest text-gold font-medium flex items-center justify-between">
                  <span>Open messages</span>
                  <span>→</span>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <button
              disabled={busy}
              onClick={() => open("emergency", "Emergency assistance", "Emergency assistance requested from the member portal.")}
              className="text-left w-full h-full block"
            >
              <Card className="border-crimson/40 bg-[#0a0511]/60 hover:border-crimson transition-all p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="h-9 w-9 rounded-sm bg-crimson/10 border border-crimson/30 flex items-center justify-center mb-3">
                    <ShieldAlert className="h-4 w-4 text-crimson" />
                  </div>
                  <div className="font-display text-lg text-crimson">Emergency SOS</div>
                  <div className="text-[11px] text-white/50 mt-1">Escalates instantly to security & operations control</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[10px] uppercase tracking-widest text-crimson font-medium flex items-center justify-between">
                  <span>Trigger alert</span>
                  <span>→</span>
                </div>
              </Card>
            </button>
          </motion.div>
        </div>

        {/* Open a Ticket Section */}
        <div className="space-y-4">
          <SectionTitle>Open a Support Ticket</SectionTitle>
          <Card className="border-white/10 bg-[#0a0511]/50 p-6">
            <form onSubmit={submit} className="grid gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your request"
                  className="w-full h-11 bg-white/[0.03] border border-white/10 px-3 text-sm text-white outline-none focus:border-gold rounded-sm transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50">Description</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Provide detailed information on how our team can assist..."
                  className="w-full bg-white/[0.03] border border-white/10 p-3 text-sm text-white outline-none focus:border-gold rounded-sm transition-colors resize-none"
                />
              </div>
              <button
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 h-11 px-8 bg-crimson hover:bg-crimson/90 text-white text-[10px] uppercase tracking-widest font-medium rounded-sm w-fit disabled:opacity-55 transition-all shadow-md"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{busy ? "Transmitting…" : "Submit Ticket"}</span>
              </button>
            </form>
          </Card>
        </div>

        {/* Your Tickets Section */}
        <div className="space-y-4">
          <SectionTitle>Your Active Tickets</SectionTitle>
          {tickets.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No open support tickets or active escalation logs." />
            </Card>
          ) : (
            <div className="grid gap-2">
              {tickets.map((t) => (
                <Link key={t.id} to="/portal/messages" className="block">
                  <Card className="border-white/10 bg-[#0a0511]/60 flex items-center gap-4 hover:border-gold/60 transition-colors p-4">
                    <div className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${t.channel === "emergency" ? "bg-crimson/10 border border-crimson/20" : "bg-gold/10 border border-gold/20"}`}>
                      <LifeBuoy className={`h-4 w-4 ${t.channel === "emergency" ? "text-crimson" : "text-gold"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{t.subject ?? "Support request"}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                        {t.channel} · {dt(t.last_message_at)}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gold font-medium shrink-0">Open →</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Help Topics Section */}
        <div className="space-y-4">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQ.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="border-white/10 bg-[#0a0511]/60 p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-2.5 mb-2">
                      <HelpCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <div className="text-sm font-medium text-white">{f.q}</div>
                    </div>
                    <p className="text-[12px] text-white/60 leading-relaxed pl-6">{f.a}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
