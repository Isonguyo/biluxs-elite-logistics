import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/places")({
  head: () => ({ meta: [
    { title: "Saved Places — BiLUXS Member Portal" },
    { name: "description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
    { property: "og:title", content: "Saved Places — BiLUXS" },
    { property: "og:description", content: "Home, office, airport and favourite pickup points saved for one-tap booking." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Saved Places" subtitle="Home, office, airport and favourite pickup points saved for one-tap booking.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Saved Places request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
