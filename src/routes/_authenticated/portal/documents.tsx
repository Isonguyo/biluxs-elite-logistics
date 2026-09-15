import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, QrCode, Receipt, FolderArchive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { dt, ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/documents")({
  head: () => ({
    meta: [
      { title: "Digital Documents — BiLUXS Member Portal" },
      { name: "description", content: "Boarding passes, receipts, travel insurance, vouchers and trip documents." },
      { property: "og:title", content: "Digital Documents — BiLUXS" },
      { property: "og:description", content: "Boarding passes, receipts, travel insurance and vouchers in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Doc = { id: string; title: string; kind: string; file_url: string | null; created_at: string };
type Trip = { id: string; waybill_code: string; total_price: number; paid_at: string | null; payment_status: string; qr_status: string };

function Page() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_documents")
      .select("id,title,kind,file_url,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setDocs((data as Doc[]) ?? []));
    supabase
      .from("bookings")
      .select("id,waybill_code,total_price,paid_at,payment_status,qr_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setTrips((data as Trip[]) ?? []));
  }, [user]);

  const receipts = trips.filter((t) => t.payment_status === "paid");
  const passes = trips.filter((t) => t.payment_status === "paid" && t.qr_status === "valid");

  const printReceipt = (t: Trip) => {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.write(`<html><head><title>BiLUXS Receipt ${t.waybill_code}</title></head>
      <body style="font-family:Georgia,serif;padding:48px;color:#111">
      <h1 style="letter-spacing:.3em;font-size:20px">BiLUXS</h1>
      <p style="letter-spacing:.2em;font-size:11px;text-transform:uppercase;color:#888">Official receipt</p>
      <hr/>
      <p><strong>Waybill:</strong> ${t.waybill_code}</p>
      <p><strong>Paid:</strong> ${t.paid_at ? new Date(t.paid_at).toLocaleString() : "—"}</p>
      <p><strong>Amount:</strong> NGN ${Number(t.total_price).toLocaleString()}</p>
      <hr/><p style="font-size:11px;color:#888">A Brightflow Conglomerate company.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <PortalLayout
      title="Digital Documents"
      subtitle="Boarding passes, digital receipts, vouchers, and travel documentation — all available for instant download."
    >
      <div className="space-y-8">
        {/* Boarding Passes Section */}
        <div className="space-y-4">
          <SectionTitle>Boarding Passes</SectionTitle>
          {passes.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No active boarding passes currently available." />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {passes.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Link to="/portal/trips/$id" params={{ id: t.id }} className="block h-full">
                    <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold transition-all p-5 h-full flex flex-col justify-between">
                      <div>
                        <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                          <QrCode className="h-4 w-4 text-gold" />
                        </div>
                        <div className="font-display text-xl text-white tracking-widest">{t.waybill_code}</div>
                        <div className="text-[11px] text-white/50 mt-1">Boarding pass · Single use secure token</div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] uppercase tracking-widest text-gold font-medium flex items-center justify-between">
                        <span>Open pass</span>
                        <span>→</span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Receipts & Invoices Section */}
        <div className="space-y-4">
          <SectionTitle>Receipts & Invoices</SectionTitle>
          {receipts.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="No digital receipts available yet." />
            </Card>
          ) : (
            <Card className="p-0 overflow-x-auto border-white/10 bg-[#0a0511]/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="text-left p-4">Waybill</th>
                    <th className="text-left p-4">Settled Date</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-right p-4">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {receipts.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-display tracking-widest text-white/90">{t.waybill_code}</td>
                      <td className="p-4 text-white/50 whitespace-nowrap text-xs">{dt(t.paid_at)}</td>
                      <td className="p-4 text-right text-white/90">{ngn(t.total_price)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => printReceipt(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 bg-white/[0.02] hover:border-gold text-white text-[10px] uppercase tracking-widest rounded-sm transition-all"
                        >
                          <Receipt className="h-3.5 w-3.5 text-gold" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Travel Documents Section */}
        <div className="space-y-4">
          <SectionTitle>Travel Documents & Vouchers</SectionTitle>
          {docs.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center flex flex-col items-center justify-center">
              <FolderArchive className="h-8 w-8 text-white/20 mb-3" />
              <Empty text="Vouchers, insurance certificates, and visa documents issued by BiLUXS will appear here." />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {docs.map((d, index) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card className="border-white/10 bg-[#0a0511]/60 hover:border-gold/60 transition-colors p-5 h-full flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{d.title}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                          {d.kind} · {dt(d.created_at)}
                        </div>
                      </div>
                    </div>
                    {d.file_url && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gold hover:underline font-medium"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Document</span>
                        </a>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
