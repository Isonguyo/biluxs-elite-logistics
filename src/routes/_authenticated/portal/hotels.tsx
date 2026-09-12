import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Building2, Info } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/hotels")({
  head: () => ({
    meta: [
      { title: "Hotel Reservations — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Reserve luxury hotels and serviced apartments through the BiLUXS travel desk.",
      },
      { property: "og:title", content: "Hotel Reservations — BiLUXS" },
      {
        property: "og:description",
        content: "Luxury hotel and suite reservations arranged by BiLUXS.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("concierge_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("service", "hotel")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalLayout
      title="Hotel Desk"
      subtitle="Suites, villas, and serviced apartments reserved on your behalf, with chauffeur transfers seamlessly integrated."
    >
      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Left Column: Request Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
              <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">
                  New Reservation
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Global Luxury Stays
                </p>
              </div>
            </div>

            <RequestForm
              title=""
              table="concierge_requests"
              fixed={{ service: "hotel" }}
              submitLabel="Request Reservation"
              onDone={load}
              fields={[
                {
                  name: "preferred_date",
                  label: "Check-in date",
                  type: "datetime-local",
                  required: true,
                },
                {
                  name: "details",
                  label: "City, hotel preference, nights & guests",
                  type: "textarea",
                  required: true,
                  placeholder:
                    "e.g., Calabar, Transcorp — 3 nights, executive suite, 2 guests...",
                },
              ]}
            />
          </Card>

          <Card className="border-white/10 bg-[#0a0511]/50 p-5">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/60 leading-relaxed">
                Hotel requests are reviewed immediately. Your travel consultant will reach out via the Messages tab to provide tailored room options, confirm availability, and secure your booking.
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Request List */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <SectionTitle>Your Reservations</SectionTitle>
          <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
            <RequestList
              rows={rows}
              empty="No active hotel reservations. Submit a new request to begin."
              columns={[
                { key: "details", label: "Reservation Details" },
                {
                  key: "preferred_date",
                  label: "Check-in",
                  render: (r) => dOnly(r.preferred_date),
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
    </PortalLayout>
  );
}
