import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/documents")({
  head: () => ({ meta: [
    { title: "Digital Documents — BiLUXS Member Portal" },
    { name: "description", content: "Boarding passes, travel insurance, vouchers and trip documents." },
    { property: "og:title", content: "Digital Documents — BiLUXS" },
    { property: "og:description", content: "Boarding passes, travel insurance, vouchers and trip documents." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Digital Documents" subtitle="Boarding passes, travel insurance, vouchers and trip documents.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Digital Documents request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
