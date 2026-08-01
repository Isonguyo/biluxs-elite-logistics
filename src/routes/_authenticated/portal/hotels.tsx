import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/hotels")({
  head: () => ({
    meta: [
      { title: "Hotel Reservations — BiLUXS Member Portal" },
      { name: "description", content: "Reserve luxury hotels and serviced apartments through the BiLUXS travel desk." },
      { property: "og:title", content: "Hotel Reservations — BiLUXS" },
      { property: "og:description", content: "Luxury hotel and suite reservations arranged by BiLUXS." },
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
      .eq("user_id", user.id).eq("service", "hotel").order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  return (
    <PortalLayout title="Hotels" subtitle="Suites, villas and serviced apartments reserved on your behalf, with chauffeur transfers included.">
      <RequestForm
        title="New hotel reservation"
        table="concierge_requests"
        fixed={{ service: "hotel" }}
        submitLabel="Request reservation"
        onDone={load}
        fields={[
          { name: "preferred_date", label: "Check-in", type: "datetime-local", required: true },
          { name: "details", label: "City, hotel preference, nights, guests", type: "textarea", required: true, placeholder: "Calabar, Transcorp — 3 nights, executive suite, 2 guests" },
        ]}
      />
      <SectionTitle>Your reservations</SectionTitle>
      <RequestList
        rows={rows}
        empty="No hotel reservations yet."
        columns={[
          { key: "details", label: "Reservation" },
          { key: "preferred_date", label: "Check-in", render: (r) => dOnly(r.preferred_date) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]}
      />
    </PortalLayout>
  );
}
