import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/shopping")({
  head: () => ({ meta: [
    { title: "Luxury Shopping — BiLUXS Member Portal" },
    { name: "description", content: "Request a personal shopper and track luxury purchases, customs and delivery." },
    { property: "og:title", content: "Luxury Shopping — BiLUXS" },
    { property: "og:description", content: "Personal shopper requests, order tracking and delivery for luxury goods." },
  ] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("shop_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  return (
    <PortalLayout title="Luxury Shopping" subtitle="Our personal shoppers source, verify, clear customs and deliver to your door.">
      <RequestForm title="Request a personal shopper" table="shop_orders" submitLabel="Submit request" onDone={load}
        fields={[
          { name: "item_name", label: "Item", required: true, placeholder: "Leather weekender bag" },
          { name: "brand", label: "Brand", placeholder: "Bottega Veneta" },
          { name: "quantity", label: "Quantity", type: "number" },
          { name: "budget", label: "Budget (₦)", type: "number" },
          { name: "notes", label: "Specifications, size, colour", type: "textarea" },
        ]} />
      <SectionTitle>Your orders</SectionTitle>
      <RequestList rows={rows} empty="No orders yet."
        columns={[
          { key: "order_code", label: "Order" },
          { key: "item_name", label: "Item" },
          { key: "brand", label: "Brand" },
          { key: "budget", label: "Budget", render: (r) => ngn(r.budget) },
          { key: "tracking_code", label: "Tracking" },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]} />
    </PortalLayout>
  );
}
