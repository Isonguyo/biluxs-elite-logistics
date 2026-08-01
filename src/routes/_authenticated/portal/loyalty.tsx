import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/loyalty")({
  head: () => ({ meta: [
    { title: "Loyalty — BiLUXS Member Portal" },
    { name: "description", content: "Your BiLUXS tier, points balance and member benefits." },
    { property: "og:title", content: "Loyalty — BiLUXS" },
    { property: "og:description", content: "Your BiLUXS tier, points balance and member benefits." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Loyalty" subtitle="Your BiLUXS tier, points balance and member benefits.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Loyalty request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
