import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, QrCode, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { dt, ngn } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/documents")({
  head: () => ({ meta: [
    { title: "Digital Documents — BiLUXS Member Portal" },
    { name: "description", content: "Boarding passes, receipts, travel insurance, vouchers and trip documents." },
    { property: "og:title", content: "Digital Documents — BiLUXS" },
    { property: "og:description", content: "Boarding passes, receipts, travel insurance and vouchers in one place." },
  ] }),
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
    supabase.from("user_documents").select("id,title,kind,file_url,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setDocs((data as Doc[]) ?? []));
    supabase.from("bookings").select("id,waybill_code,total_price,paid_at,payment_status,qr_status")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30)
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
      <hr/><p style="font-size:11px;color:#888">Thank you for travelling with BiLUXS.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <PortalLayout title="Digital Documents" subtitle="Boarding passes, receipts, vouchers and travel documents — all downloadable.">
      <SectionTitle>Boarding passes</SectionTitle>
      {passes.length === 0 ? <Empty text="No active boarding passes." /> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {passes.map((t) => (
            <Link key={t.id} to="/portal/trips/$id" params={{ id: t.id }} className="block">
              <Card className="hover:border-gold transition-colors">
                <QrCode className="h-5 w-5 text-gold" />
                <div className="font-display text-xl mt-3 tracking-widest">{t.waybill_code}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Boarding pass · single use</div>
                <div className="mt-3 text-[10px] uppercase tracking-widest text-gold">Open pass →</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SectionTitle>Receipts & invoices</SectionTitle>
      {receipts.length === 0 ? <Empty text="No receipts yet." /> : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left p-4">Waybill</th><th className="text-left p-4">Date</th>
              <th className="text-right p-4">Amount</th><th className="text-right p-4">Document</th>
            </tr></thead>
            <tbody>
              {receipts.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-4 font-display tracking-widest">{t.waybill_code}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{dt(t.paid_at)}</td>
                  <td className="p-4 text-right">{ngn(t.total_price)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => printReceipt(t)} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
                      <Receipt className="h-3 w-3" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SectionTitle>Travel documents</SectionTitle>
      {docs.length === 0 ? <Empty text="Vouchers, insurance and visa documents issued by BiLUXS will appear here." /> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-start gap-4 hover:border-gold/60 transition-colors">
              <FileText className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{d.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{d.kind} · {dt(d.created_at)}</div>
                {d.file_url && (
                  <a href={d.file_url} target="_blank" rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
                    <Download className="h-3 w-3" /> Download
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
