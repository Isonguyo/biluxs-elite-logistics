import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Package, Info } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/cargo")({
  head: () => ({
    meta: [
      { title: "Cargo Shipments — BiLUXS Member Portal" },
      {
        name: "description",
        content:
          "Book and track BiLUXS cargo shipments with live status, warehouse position and proof of delivery.",
      },
      { property: "og:title", content: "Cargo Shipments — BiLUXS" },
      {
        property: "og:description",
        content: "Live cargo tracking, warehouse status and proof of delivery.",
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
      .from("cargo_shipments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const ch = supabase
      .channel(rtTopic("cargo-" + user.id))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cargo_shipments",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, load]);

  return (
    <PortalLayout
      title="Cargo Desk"
      subtitle="Ship anything, anywhere — complete with real-time tracking, warehouse positioning, and proof of delivery."
    >
      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Left Column: New Shipment Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-5">
              <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">
                  New Shipment
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Secure Freight & Logistics
                </p>
              </div>
            </div>

            <RequestForm
              title=""
              table="cargo_shipments"
              submitLabel="Book Shipment"
              onDone={load}
              fields={[
                { name: "origin", label: "Origin", required: true, placeholder: "e.g., Calabar" },
                { name: "destination", label: "Destination", required: true, placeholder: "e.g., Lagos" },
                { name: "weight_kg", label: "Weight (kg)", type: "number", placeholder: "e.g., 25" },
                {
                  name: "description",
                  label: "Contents & handling notes",
                  type: "textarea",
                  placeholder: "Fragile items, specific handling instructions...",
                },
              ]}
            />
          </Card>

          <Card className="border-white/10 bg-[#0a0511]/50 p-5">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/60 leading-relaxed">
                All shipments are monitored in real-time through the BiLUXS global logistics network. Live status updates will reflect automatically as your cargo moves through secure transit hubs.
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Shipment List */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <SectionTitle>Your Shipments</SectionTitle>
          <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
            <RequestList
              rows={rows}
              empty="No active shipments. Book your first cargo transfer to begin tracking."
              columns={[
                { key: "tracking_code", label: "Tracking" },
                { key: "route", label: "Route", render: (r) => `${r.origin} → ${r.destination}` },
                { key: "current_warehouse", label: "Warehouse" },
                { key: "estimated_delivery", label: "ETA", render: (r) => dOnly(r.estimated_delivery) },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </Card>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
