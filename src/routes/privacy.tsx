import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { motion } from "framer-motion";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BiLUXS Calabar" },
      { name: "description", content: "How BiLUXS collects, uses and protects your personal data across our transport, cargo and procurement services." },
    ],
  }),
  component: Page,
});

const SECTIONS = [
  { h: "1. Data We Collect", p: "Account details (name, email, phone), trip data (pickup/dropoff, GPS pings during your booking), and procurement preferences. Corporate accounts also submit company information." },
  { h: "2. How We Use Your Data", p: "To deliver bookings, dispatch chauffeurs, process payments, provide live tracking, fulfil procurement, and improve our service. We never sell personal data." },
  { h: "3. GPS & Live Tracking", p: "When you have an active booking we record vehicle location to power the Track Waybill module. Logs are retained for 90 days then anonymised for analytics." },
  { h: "4. Reference Images", p: "Reference images uploaded for procurement are stored privately. Only the uploader and assigned BiLUXS concierge staff can access them." },
  { h: "5. Sharing", p: "Operational data is shared only with our dispatch staff, partner gateways for payment, and authorities when legally required." },
  { h: "6. Your Rights", p: "You may request access, correction or deletion of your data at any time by emailing privacy@biluxs.ng. We respond within 14 days." },
  { h: "7. Cookies", p: "We use essential cookies for authentication and analytics cookies (aggregated, anonymised) to improve UX. You can opt out via your browser." },
  { h: "8. Security", p: "All data is encrypted in transit. Sensitive credentials are stored using industry-standard salted hashes. Role-based access controls limit staff exposure." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title={<>Privacy <span className="gradient-text">Policy</span></>}
        subtitle="Your trust powers our service. This policy explains exactly what data we hold and how we safeguard it."
      />
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {SECTIONS.map((s, i) => (
            <motion.div key={s.h}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="border-l-2 border-gold pl-6">
              <h2 className="font-display text-2xl text-white mb-2">{s.h}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.p}</p>
            </motion.div>
          ))}
          <div className="pt-8 text-xs text-muted-foreground">
            Data Protection Officer: <span className="text-gold">privacy@biluxs.ng</span>.
          </div>
        </div>
      </section>
    </PageShell>
  );
}
