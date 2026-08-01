import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, SectionTitle } from "@/components/portal/PortalLayout";
import { RequestForm, RequestList, StatusPill } from "@/components/portal/RequestForm";
import { dOnly, ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/tours")({
  head: () => ({ meta: [
    { title: "Tour Packages — BiLUXS Member Portal" },
    { name: "description", content: "Book curated BiLUXS tour packages across Cross River and beyond." },
    { property: "og:title", content: "Tour Packages — BiLUXS" },
    { property: "og:description", content: "Curated luxury tour packages with chauffeur transfers included." },
  ] }),
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
    const { data } = await supabase.from("tour_bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows(data ?? []);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  return (
    <PortalLayout title="Tour Packages" subtitle="Curated journeys with chauffeur transfers, lodging and guides handled end to end.">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {RECOMMENDED.map((r) => (
          <div key={r.name} className="bg-card border border-border p-5 hover:border-gold transition-colors">
            <div className="font-display text-lg">{r.name}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{r.note}</div>
          </div>
        ))}
      </div>
      <RequestForm title="Book a tour" table="tour_bookings" submitLabel="Request package" onDone={load}
        fields={[
          { name: "package_name", label: "Package", required: true, placeholder: "Obudu Mountain Escape" },
          { name: "destination", label: "Destination", required: true, placeholder: "Obudu, Cross River" },
          { name: "travellers", label: "Travellers", type: "number" },
          { name: "start_date", label: "Start date", type: "date" },
          { name: "end_date", label: "End date", type: "date" },
        ]} />
      <SectionTitle>Your tours</SectionTitle>
      <RequestList rows={rows} empty="No tours booked yet."
        columns={[
          { key: "package_name", label: "Package" },
          { key: "destination", label: "Destination" },
          { key: "start_date", label: "Departs", render: (r) => dOnly(r.start_date) },
          { key: "price", label: "Price", render: (r) => ngn(r.price) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]} />
    </PortalLayout>
  );
}
