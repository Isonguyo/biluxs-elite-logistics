import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ShoppingBag, Info } from "lucide-react";
import { PortalLayout, SectionTitle, Card } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/shopping")({
  head: () => ({
    meta: [
      { title: "Luxury Shopping — BiLUXS Member Portal" },
      { name: "description", content: "Request a personal shopper and track luxury purchases, customs and delivery." },
      { property: "og:title", content: "Luxury Shopping — BiLUXS" },
      { property: "og:description", content: "Personal shopper requests, order tracking and delivery for luxury goods." },
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
      .from("shop_orders")
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
      title="Personal Shopping Desk"
      subtitle="Our expert personal shoppers source, authenticate, clear customs, and deliver luxury items directly to your door."
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
                <ShoppingBag className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wide">
                  Request a Personal Shopper
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                  Bespoke Global Sourcing
                </p>
              </div>
            </div>

            <RequestForm
              title=""
              table="shop_orders"
              submitLabel="Submit Request"
              onDone={load}
              fields={[
                {
                  name: "item_name",
                  label: "Item name",
                  required: true,
                  placeholder: "e.g., Leather weekender bag",
                },
                { name: "brand", label: "Brand", placeholder: "e.g., Bottega Veneta" },
                { name: "quantity", label: "Quantity", type: "number", placeholder: "1" },
                { name: "budget", label: "Budget (₦)", type: "number", placeholder: "e.g., 1500000" },
                {
                  name: "notes",
                  label: "Specifications, size, colour",
                  type: "textarea",
                  placeholder: "Specify dimensions, preferred colours, or special editions...",
                },
              ]}
            />
          </Card>

          <Card className="border-white/10 bg-[#0a0511]/50 p-5">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div className="text-[12px] text-white/60 leading-relaxed">
                Your personal shopper will verify item availability, provide cost estimates inclusive of duties, and update you directly via the Messages tab once sourcing begins.
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Orders List */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <SectionTitle>Your Orders</SectionTitle>
          <Card className="p-0 overflow-hidden border-white/10 bg-[#0a0511]/50 min-h-[400px]">
            <RequestList
              rows={rows}
              empty="No shopping orders yet. Submit a sourcing request to begin."
              columns={[
                { key: "order_code", label: "Order" },
                { key: "item_name", label: "Item" },
                { key: "brand", label: "Brand" },
                {
                  key: "budget",
                  label: "Budget",
                  render: (r) => ngn(r.budget),
                },
                { key: "tracking_code", label: "Tracking" },
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
