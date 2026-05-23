import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Award, Sparkles, MapPin, Plane, Car, Package, ShoppingBag, Lock, Quote, Phone, Mail, Building2 } from "lucide-react";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { SplitText, CardCascade, CascadeItem, MagneticButton } from "@/components/biluxs/motion-fx";
import { motion } from "framer-motion";
import heroaboutImg from "@/assets/hero-about.jpg";
import founderImg from "@/assets/1779462253013.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BiLUXS — Brightflow Logistics Luxury Services, Calabar" },
      {
        name: "description",
        content:
          "BrightFlow Logistics Luxury Services (BiLUXS) — premium tourism, travel, transport, cargo and personal shopping. Headquartered on Harbour Road, Calabar.",
      },
      { property: "og:title", content: "About BiLUXS — Bringing the World to US" },
      { property: "og:image", content: heroaboutImg },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: Page,
});

const services = [
  { icon: Plane, label: "Air Travel & Stay", text: "Flight bookings and curated accommodation reservations worldwide." },
  { icon: Car, label: "Executive Transport", text: "Modern fleet hire with vetted chauffeurs and full protocol crews." },
  { icon: Package, label: "Cargo & Delivery", text: "High-value cargo handling and door-to-door logistics, fully insured." },
  { icon: Lock, label: "Travel Security", text: "Discreet security support for travelers and tourist hotspots." },
  { icon: ShoppingBag, label: "Personal Shopping", text: "Seamless sourcing from London, Dubai, New York, Paris and China." },
  { icon: Sparkles, label: "Luxury Protocol", text: "VIP airport meet-and-assist, motorcades and concierge orchestration." },
];

const values = [
  { icon: ShieldCheck, label: "Integrity", text: "Transparent pricing, verified drivers, zero compromise." },
  { icon: Award, label: "Reliability", text: "On-time guarantee with 24/7 dispatch and live tracking." },
  { icon: Sparkles, label: "Luxury", text: "First-class interiors, refreshments, and protocol crews." },
  { icon: MapPin, label: "Local Roots", text: "Born in Calabar. Built for Cross River. Trusted nationwide." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        image={heroaboutImg}
        eyebrow="About BiLUXS"
        title="Bringing The World To Us"
        subtitle="BrightFlow Logistics Luxury Services — premium tourism, travel and transport, engineered from Harbour Road, Calabar."
      />

      {/* WHO WE ARE */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">Who We Are</div>
            <SplitText
              as="h2"
              text="A premium gateway between convenience and luxury."
              className="font-display text-4xl md:text-5xl leading-[1.05] text-white"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 text-muted-foreground leading-relaxed"
            >
              BrightFlow Logistics Luxury Services (BiLUXS) is a premium tourism, travel and
              transportation company focused on delivering seamless, secure and luxurious
              experiences. We bridge convenience and luxury by combining advanced technology,
              professional service delivery, and strategic partnerships across the tourism and
              transport sectors — with an unwavering focus on customer satisfaction, safety and
              efficiency, in Nigeria and beyond.
            </motion.p>
          </div>

          <CardCascade className="grid grid-cols-2 gap-6">
            {[
              { k: "200+", v: "VIP clients served" },
              { k: "24/7", v: "Dispatch & GPS" },
              { k: "100%", v: "Insured fleet" },
              { k: "5★", v: "Concierge rating" },
            ].map((s) => (
              <CascadeItem key={s.k} className="p-6 bg-card border border-border hover:border-gold transition-colors">
                <div className="font-display text-5xl text-white">{s.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{s.v}</div>
              </CascadeItem>
            ))}
          </CardCascade>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-24 border-t border-border bg-[var(--navy-deep)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">What We Do</div>
          <SplitText
            as="h2"
            text="End-to-end travel and logistics."
            className="font-display text-4xl md:text-5xl text-white"
          />
          <CardCascade className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <CascadeItem
                key={s.label}
                className="group p-8 bg-card border border-border hover:border-gold transition-colors"
              >
                <s.icon className="h-7 w-7 text-gold transition-transform group-hover:scale-110" />
                <div className="font-display text-xl mt-5 tracking-widest">{s.label}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </CascadeItem>
            ))}
          </CardCascade>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ background: "radial-gradient(circle at 30% 20%, var(--crimson), transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">Our Mission & Vision</div>
          <SplitText
            as="h2"
            text="Where business meets lifestyle. Where style clashes with class."
            className="font-display text-4xl md:text-5xl text-white leading-[1.1]"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto"
          >
            BiLUXS connects people from door to location — driving color and language to meet
            culture, and creating ambition where humanity meets purpose. A dream world where wishes
            meet reality; where uniqueness stands the test of time, vision meets creativity, and
            people meet personalities. This is a story that carries efficiency from origin to
            destination.
          </motion.p>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            {["BiLUXS… Bringing the World to US", "BiLUXS… Together We Go Global"].map((slogan) => (
              <motion.div
                key={slogan}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 120 }}
                className="px-6 py-3 border border-gold/40 text-gold font-display tracking-widest text-sm"
              >
                {slogan}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="py-24 border-t border-border bg-[var(--navy-deep)]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -40, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2"
            style={{ perspective: 1200 }}
          >
            <div className="relative">
              <div className="absolute -inset-3 border border-gold/30" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-crimson/20 blur-2xl" />
              <img
                src={founderImg}
                alt="Dr. (Mrs.) Aniefiok Aniekan Iton — Founder & President of Brightflow Conglomerate / BiLUXS"
                width={1024}
                height={1024}
                loading="lazy"
                className="relative w-full h-auto object-cover"
              />
            </div>
          </motion.div>

          <div className="lg:col-span-3">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">Meet The Founder</div>
            <SplitText
              as="h2"
              text="Dr. (Mrs.) Aniefiok Aniekan Iton"
              className="font-display text-3xl md:text-5xl text-white leading-[1.05]"
            />
            <div className="mt-3 text-sm uppercase tracking-[0.3em] text-gold/80">
              Founder & President — Brightflow Conglomerate / BiLUXS
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mt-8 space-y-5 text-muted-foreground leading-relaxed"
            >
              <p>
                Dr. Aniefiok Iton is an award-winning visionary entrepreneur, logistics expert and
                trailblazing business leader. As President of the Brightflow Conglomerate — a
                dynamic organization spanning logistics, skill acquisition and community foundation
                work — she established BrightFlow Logistics Luxury Services (BiLUXS) to redefine
                premium tourism, travel and freight across the region.
              </p>
              <p>
                Recognized internationally for her business acumen, she was awarded the{" "}
                <span className="text-gold">Most Innovative Business Leadership CEO (Nigeria)</span>{" "}
                at the 2024 Influential Businesswoman Awards. Her leadership extends beyond
                corporate excellence: she is a recognized authority in the maritime and transport
                industries, currently serving as Chairman of the Chartered Institute of Logistics
                and Transport (CILT), Calabar Branch.
              </p>
              <p>
                Operating in a traditionally male-dominated industry, she stands as a beacon of
                empowerment and industry-wide change — championing strategic private-public
                partnerships, economic diversification, and the transition of regional commerce
                into formal, high-efficiency channels.
              </p>
            </motion.div>

            <motion.figure
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 relative p-8 border-l-2 border-gold bg-card/60"
            >
              <Quote className="absolute -top-4 -left-4 h-10 w-10 text-crimson bg-[var(--navy-deep)] p-2" />
              <blockquote className="font-display text-xl md:text-2xl text-white leading-snug">
                "Success only happens when opportunity meets preparation. At BiLUXS, we don't just
                bridge logistics gaps; we prepare business to meet lifestyle, and style to clash
                with class."
              </blockquote>
              <figcaption className="mt-4 text-xs uppercase tracking-[0.3em] text-gold/80">
                — Dr. Aniefiok Iton
              </figcaption>
            </motion.figure>

            <div className="mt-8">
              <MagneticButton>
                <a
                  href="https://youtu.be/8AkLd8i1Hog?si=a1wQtTtI5KiILjmA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-7 py-3 bg-crimson text-white font-display tracking-widest text-sm hover:bg-crimson/90 transition-colors"
                >
                  Watch: Potentials In African Waters →
                </a>
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">Core Values</div>
          <SplitText
            as="h2"
            text="Four pillars. Zero compromise."
            className="font-display text-4xl md:text-5xl text-white"
          />
          <CardCascade className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <CascadeItem
                key={v.label}
                className="p-6 bg-card border border-border hover:border-gold transition-colors"
              >
                <v.icon className="h-6 w-6 text-gold" />
                <div className="font-display text-xl mt-4 tracking-widest">{v.label}</div>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </CascadeItem>
            ))}
          </CardCascade>
        </div>
      </section>

      {/* CONTACT BLOCK */}
      <section className="py-24 border-t border-border bg-[var(--navy-deep)]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-10">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4">Get In Touch</div>
            <SplitText
              as="h2"
              text="Brightflow Logistics Luxury Services"
              className="font-display text-3xl md:text-4xl text-white leading-tight"
            />
          </div>
          <CardCascade className="lg:col-span-2 grid sm:grid-cols-3 gap-6">
            <CascadeItem className="p-6 bg-card border border-border">
              <Building2 className="h-5 w-5 text-gold" />
              <div className="font-display text-sm tracking-widest mt-4 text-white">Head Office</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                FTD Cooperative House, Mopol II, Harbour Road, Calabar, Cross River State, Nigeria.
              </p>
            </CascadeItem>
            <CascadeItem className="p-6 bg-card border border-border">
              <Phone className="h-5 w-5 text-gold" />
              <div className="font-display text-sm tracking-widest mt-4 text-white">Phone</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><a className="hover:text-gold" href="tel:+2347087957751">+234 708 795 7751</a></li>
                <li><a className="hover:text-gold" href="tel:+2348139984580">+234 813 998 4580</a></li>
                <li><a className="hover:text-gold" href="tel:+2348033877543">+234 803 387 7543</a></li>
                <li><a className="hover:text-gold" href="tel:+2348036519142">+234 803 651 9142</a></li>
              </ul>
            </CascadeItem>
            <CascadeItem className="p-6 bg-card border border-border">
              <Mail className="h-5 w-5 text-gold" />
              <div className="font-display text-sm tracking-widest mt-4 text-white">Email</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground break-all">
                <li><a className="hover:text-gold" href="mailto:brightflowlogisticsluxuryservices@outlook.com">brightflowlogisticsluxuryservices@outlook.com</a></li>
                <li><a className="hover:text-gold" href="mailto:brightflawlogistics@gmail.com">brightflawlogistics@gmail.com</a></li>
              </ul>
            </CascadeItem>
          </CardCascade>
        </div>
      </section>
    </PageShell>
  );
}
