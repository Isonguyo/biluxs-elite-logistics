import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — BiLUXS Calabar" },
      { name: "description", content: "BiLUXS Terms of Service governing the use of our luxury transport, cargo and procurement services." },
    ],
  }),
  component: Page,
});

const SECTIONS = [
  { h: "1. Acceptance of Terms", p: "By booking, browsing or otherwise using any BiLUXS service, you confirm that you have read, understood and agree to be bound by these Terms of Service in full." },
  { h: "2. Service Description", p: "BiLUXS, a division of Brightflow Conglomerate, offers chauffeured luxury transport, cargo & door-to-door logistics, personal procurement, and curated tourism within Nigeria and partner cities globally." },
  { h: "3. Booking & Payments", p: "All bookings generate a waybill code and a fare breakdown including Base Rate, Distance Charge and an optional Luxury Protocol fee (+20%). Payment confirms the reservation and is processed via our secured partner gateway." },
  { h: "4. Cancellations", p: "Cancellations made more than 12 hours before pickup receive a full refund. Within 12 hours, a 25% protocol fee applies. No-shows are non-refundable." },
  { h: "5. Conduct & Liability", p: "Clients agree to behave with mutual respect toward our chauffeurs. BiLUXS reserves the right to terminate any trip that endangers staff, vehicles or third parties. Damage caused by guests is billable." },
  { h: "6. Luggage & Cargo", p: "High-value items shipped through BiLUXS Cargo are insured to declared value. Declared value above ₦5,000,000 requires written agreement." },
  { h: "7. Procurement Service", p: "Personal Procurement orders are subject to product availability at the source city. Estimates are non-binding until confirmation of in-store price plus 12% concierge fee." },
  { h: "8. Modifications", p: "BiLUXS may amend these terms at any time. Continued use of the service constitutes acceptance of the revised terms." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title={<>Terms of <span className="gradient-text">Service</span></>}
        subtitle="Last updated May 2026. These terms govern every BiLUXS booking, cargo waybill and procurement request."
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
            For inquiries, contact <span className="text-gold">legal@biluxs.ng</span>.
          </div>
        </div>
      </section>
    </PageShell>
  );
}
