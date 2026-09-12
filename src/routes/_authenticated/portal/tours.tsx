import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Compass, Info, MapPin } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly, ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/tours")({
  head: () => ({
    meta: [
      { title: "Tour Packages — BiLUXS Member Portal" },
      { name: "description", content: "Book curated BiLUXS tour packages across Cross River and beyond." },
      { property: "og:title", content: "Tour Packages — BiLUXS" },
      { property: "og:description", content: "Curated luxury tour packages with chauffeur transfers included." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const RECOMMENDED = [
  { name: "Obudu Mountain Escape", note: "3 nights · cable car · ranch suites" },
  { name: "Tinapa & Marina Weekend", note: "2 nights · waterfront · nightlife" },
  { name: "Cross River Rainforest", note: "4 nights · eco-lodge · guided treks" },
];

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tour_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalLayout
      title="Tour Desk"
      subtitle="Curated journeys with chauffeur transfers, luxury lodging, and expert guides handled end-to-end."
    >
      <div className="space-y-8">
        {/* Recommended Packages Showcase */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3 font-medium">
            Curated Experiences
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {RECOMMENDED.map((r, index) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold/50 transition-all p-5 h-full flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-gold/10" />
                  <div>
                    <div className="flex items-center gap-2 text-gold/80 mb-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Featured Package</span>
                    </div>
                    <div className="font-display text-lg text-white group-hover:text-gold transition-colors">
                      {r.name}
                    </div>
                    <div className="text-xs text-white/50 mt-1.5">{r.note}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Split Layout: Form & Bookings List */}
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
                  <Compass className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-white tracking-wide">
                    Book a Tour
                  </h2>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                    Bespoke Itineraries
                  </p>
                </div>
              </div>

              <RequestForm
                title=""
                table="tour_bookings"
                submitLabel="Request Package"
                onDone={load}
                fields={[
                  {
                    name: "package_name",
                    label: "Package name",
                    required: true,
                    placeholder: "e.g., Obudu Mountain Escape",
                  },
                  {
                    name: "destination",
                    label: "Destination",
                    required: true,
                    placeholder: "e.g., Obudu, Cross River",
                  },
                  { name: "travellers", label: "Number of travellers", type: "number", placeholder: "2" },
                  { name: "start_date", label: "Start date", type: "date" },
                  { name: "end_date", label: "End date", type: "date" },
                ]}
              />
            </Card>

            <Card className="border-white/10 bg-[#0a0511]/50 p-5">
              <div className="flex gap-3">
                <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <div className="text-[12px] text-white/60 leading-relaxed">
                  Tour itineraries include dedicated private transfers, exclusive access passes, and 24/7 concierge support throughout your stay.
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Booked Tours List */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4"
          >
            <SectionTitle>Your Tours</SectionTitle>
            <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
              <RequestList
                rows={rows}
                empty="No tours booked yet. Select an experience or request a custom package to begin."
                columns={[
                  { key: "package_name", label: "Package" },
                  { key: "destination", label: "Destination" },
                  {
                    key: "start_date",
                    label: "Departs",
                    render: (r) => dOnly(r.start_date),
                  },
                  {
                    key: "price",
                    label: "Price",
                    render: (r) => ngn(r.price),
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
