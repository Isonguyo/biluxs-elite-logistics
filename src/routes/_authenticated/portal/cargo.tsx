import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/cargo")({
  head: () => ({ meta: [
    { title: "Cargo Shipments — BiLUXS Member Portal" },
    { name: "description", content: "Book and track BiLUXS cargo shipments with live status, warehouse position and proof of delivery." },
    { property: "og:title", content: "Cargo Shipments — BiLUXS" },
    { property: "og:description", content: "Live cargo tracking, warehouse status and proof of delivery." },
  ] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("cargo_shipments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => {
    void load();
    if (!user) return;
    const ch = supabase.channel(rtTopic("cargo-" + user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "cargo_shipments", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, load]);

  return (
    <PortalLayout title="Cargo" subtitle="Ship anything, anywhere — with live status, warehouse position and proof of delivery.">
      <RequestForm title="New shipment" table="cargo_shipments" submitLabel="Book shipment" onDone={load}
        fields={[
          { name: "origin", label: "Origin", required: true, placeholder: "Calabar" },
          { name: "destination", label: "Destination", required: true, placeholder: "Lagos" },
          { name: "weight_kg", label: "Weight (kg)", type: "number" },
          { name: "description", label: "Contents & handling notes", type: "textarea" },
        ]} />
      <SectionTitle>Your shipments</SectionTitle>
      <RequestList rows={rows} empty="No shipments yet."
        columns={[
          { key: "tracking_code", label: "Tracking" },
          { key: "route", label: "Route", render: (r) => `${r.origin} → ${r.destination}` },
          { key: "current_warehouse", label: "Warehouse" },
          { key: "estimated_delivery", label: "ETA", render: (r) => dOnly(r.estimated_delivery) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]} />
    </PortalLayout>
  );
}
