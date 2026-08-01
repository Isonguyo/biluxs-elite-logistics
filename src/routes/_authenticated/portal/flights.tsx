import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/flights")({
  head: () => ({
    meta: [
      { title: "Flight Desk — BiLUXS Member Portal" },
      { name: "description", content: "Request business and first-class flight reservations through the BiLUXS travel desk." },
      { property: "og:title", content: "Flight Desk — BiLUXS" },
      { property: "og:description", content: "Premium flight reservations arranged by your BiLUXS travel consultant." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("concierge_requests").select("*")
      .eq("user_id", user.id).eq("service", "flight").order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  return (
    <PortalLayout title="Flights" subtitle="Tell us where you're flying and your BiLUXS travel consultant handles fares, seating and airport protocol.">
      <RequestForm
        title="New flight request"
        table="concierge_requests"
        fixed={{ service: "flight" }}
        submitLabel="Request flight"
        onDone={load}
        fields={[
          { name: "preferred_date", label: "Departure date", type: "datetime-local", required: true },
          { name: "details", label: "Route, cabin class, passengers & preferences", type: "textarea", required: true, placeholder: "Lagos → London Heathrow, business class, 2 passengers, aisle seats" },
        ]}
      />
      <SectionTitle>Your flight requests</SectionTitle>
      <RequestList
        rows={rows}
        empty="No flight requests yet."
        columns={[
          { key: "details", label: "Itinerary" },
          { key: "preferred_date", label: "Departure", render: (r) => dOnly(r.preferred_date) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]}
      />
    </PortalLayout>
  );
}
