import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Sparkles, Info, Crown } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/concierge")({
  head: () => ({
    meta: [
      { title: "Concierge Services — BiLUXS Member Portal" },
      { name: "description", content: "Personal assistant, restaurant reservations, airport assistance, VIP lounge and private security." },
      { property: "og:title", content: "Concierge Services — BiLUXS" },
      { property: "og:description", content: "Your BiLUXS personal concierge — anything, arranged." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const SERVICES = [
  "personal_assistant", "restaurant_reservation", "airport_assistance",
  "vip_lounge", "shopping", "private_security",
];

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("concierge_requests")
      .select("*")
      .eq("user_id", user.id)
      .in("service", SERVICES)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalLayout
      title="Concierge Desk"
      subtitle="Need anything? Your dedicated BiLUXS concierge arranges it seamlessly — day or night."
    >
      <div className="space-y-8">
        {/* Service Categories Showcase */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3 font-medium">
            Available Services
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map((s, index) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold/50 transition-all p-4 flex items-center gap-3.5 group">
                  <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                    <Crown className="h-4 w-4 text-gold" />
                  </div>
                  <div className="capitalize text-sm font-medium text-white/90 group-hover:text-gold transition-colors">
                    {s.replace(/_/g, " ")}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Split Layout: Form & Requests List */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
          {/* Left Column: Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
                <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-white tracking-wide">
                    New Concierge Request
                  </h2>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                    24/7 Priority Support
                  </p>
                </div>
              </div>

              <RequestForm
                title=""
                table="concierge_requests"
                submitLabel="Send to Concierge"
                onDone={load}
                fields={[
                  {
                    name: "service",
                    label: "Service type",
                    required: true,
                    placeholder: "e.g., restaurant_reservation",
                  },
                  {
                    name: "preferred_date",
                    label: "Preferred date & time",
                    type: "datetime-local",
                  },
                  {
                    name: "details",
                    label: "What do you need?",
                    type: "textarea",
                    required: true,
                    placeholder: "Provide specific details, preferences, or special instructions...",
                  },
                ]}
              />
            </Card>

            <Card className="border-white/10 bg-[#0a0511]/50 p-5">
              <div className="flex gap-3">
                <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <div className="text-[12px] text-white/60 leading-relaxed">
                  Your request is instantly routed to your primary concierge manager. Expect swift communication and coordination via your portal messages.
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Requests List */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4"
          >
            <SectionTitle>Your Requests</SectionTitle>
            <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
              <RequestList
                rows={rows}
                empty="No concierge requests yet. Submit a new task above to get started."
                columns={[
                  { key: "service", label: "Service", render: (r) => <span className="capitalize">{r.service?.replace(/_/g, " ")}</span> },
                  { key: "details", label: "Details" },
                  {
                    key: "preferred_date",
                    label: "When",
                    render: (r) => dt(r.preferred_date),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                ]}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </PortalLayout>
  );
}
