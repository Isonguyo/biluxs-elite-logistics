import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/analytics")({
  head: () => ({ meta: [
    { title: "Analytics — BiLUXS Member Portal" },
    { name: "description", content: "Total trips, distance travelled and lifetime spend across BiLUXS services." },
    { property: "og:title", content: "Analytics — BiLUXS" },
    { property: "og:description", content: "Total trips, distance travelled and lifetime spend across BiLUXS services." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Analytics" subtitle="Total trips, distance travelled and lifetime spend across BiLUXS services.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Analytics request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
