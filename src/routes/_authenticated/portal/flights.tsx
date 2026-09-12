import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Plane, Info } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/flights")({
  head: () => ({
    meta: [
      { title: "Flight Desk — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Request business and first-class flight reservations through the BiLUXS travel desk.",
      },
      { property: "og:title", content: "Flight Desk — BiLUXS" },
      {
        property: "og:description",
        content:
          "Premium flight reservations arranged by your BiLUXS travel consultant.",
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
      .eq("service", "flight")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalLayout
      title="Flight Desk"
      subtitle="Allow your BiLUXS travel consultant to handle fares, seating, and airport protocol for your next journey."
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
                <Plane className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">
                  New Flight Request
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Global Charter & Commercial
                </p>
              </div>
            </div>

            {/* Note: Assuming RequestForm internal styling adapts to dark mode. 
                We remove its internal title since we built a custom header above. */}
            <RequestForm
              title=""
              table="concierge_requests"
              fixed={{ service: "flight" }}
              submitLabel="Submit Request"
              onDone={load}
              fields={[
                {
                  name: "preferred_date",
                  label: "Departure date",
                  type: "datetime-local",
                  required: true,
                },
                {
                  name: "details",
                  label: "Route, cabin class & preferences",
                  type: "textarea",
                  required: true,
                  placeholder:
                    "e.g., Lagos → London Heathrow, First Class, 2 passengers, aisle seats...",
                },
              ]}
            />
          </Card>

          <Card className="border-white/10 bg-[#0a0511]/50 p-5">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/60 leading-relaxed">
                Flight requests are processed within 2 hours. Your dedicated consultant will contact you via the Messages tab to confirm itineraries, seating, and finalize ticketing.
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
          <SectionTitle>Your Flight Requests</SectionTitle>
          <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
            <RequestList
              rows={rows}
              empty="No active flight requests. Submit a new request to begin."
              columns={[
                { key: "details", label: "Itinerary" },
                {
                  key: "preferred_date",
                  label: "Departure",
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
