import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/concierge")({
  head: () => ({ meta: [
    { title: "Concierge Services — BiLUXS Member Portal" },
    { name: "description", content: "Personal assistant, restaurant reservations, airport assistance, VIP lounge and private security." },
    { property: "og:title", content: "Concierge Services — BiLUXS" },
    { property: "og:description", content: "Your BiLUXS personal concierge — anything, arranged." },
  ] }),
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
    const { data } = await supabase.from("concierge_requests").select("*")
      .eq("user_id", user.id).in("service", SERVICES).order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  return (
    <PortalLayout title="Concierge" subtitle="Need anything? Your BiLUXS concierge arranges it — day or night.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {SERVICES.map((s) => (
          <div key={s} className="bg-card border border-border p-5 capitalize text-sm">{s.replace(/_/g, " ")}</div>
        ))}
      </div>
      <RequestForm title="New concierge request" table="concierge_requests" submitLabel="Send to concierge" onDone={load}
        fields={[
          { name: "service", label: "Service", required: true, placeholder: "restaurant_reservation" },
          { name: "preferred_date", label: "Preferred date & time", type: "datetime-local" },
          { name: "details", label: "What do you need?", type: "textarea", required: true },
        ]} />
      <SectionTitle>Your requests</SectionTitle>
      <RequestList rows={rows} empty="No concierge requests yet."
        columns={[
          { key: "service", label: "Service" },
          { key: "details", label: "Details" },
          { key: "preferred_date", label: "When", render: (r) => dt(r.preferred_date) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]} />
    </PortalLayout>
  );
}
