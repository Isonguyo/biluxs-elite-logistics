import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout, Card } from "@/components/portal/PortalLayout";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({ meta: [
    { title: "Profile — BiLUXS Member Portal" },
    { name: "description", content: "Your personal details, travel documents and contact preferences." },
    { property: "og:title", content: "Profile — BiLUXS" },
    { property: "og:description", content: "Your personal details, travel documents and contact preferences." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <PortalLayout title="Profile" subtitle="Your personal details, travel documents and contact preferences.">
      <Card>
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-3">Coming online</div>
        <p className="text-sm text-muted-foreground max-w-xl">
          This module is being provisioned for your account. Your BiLUXS consultant can action any Profile request in the meantime — reach them from the Concierge desk.
        </p>
      </Card>
    </PortalLayout>
  );
}
