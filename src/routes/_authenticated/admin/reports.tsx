import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout, Panel, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, naira, startOfDay, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Page });

const PERIODS = { daily: 1, weekly: 7, monthly: 30, annual: 365 } as const;

function toCsv(rows: Row[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
}

function Page() {
  const { rows: bookings } = useTable("bookings", { realtime: false });
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });
  const { rows: profiles } = useTable("profiles", { order: "created_at", realtime: false });
  const [period, setPeriod] = useState<keyof typeof PERIODS>("weekly");

  const from = new Date(startOfDay().getTime() - (PERIODS[period] - 1) * 86400000);
  const scoped = bookings.filter((b) => new Date(b.created_at) >= from);
  const revenue = scoped.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0);

  const download = async (name: string, rows: Row[]) => {
    const csv = toCsv(rows);
    if (!csv) return toast.error("Nothing to export for this period.");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `biluxs-${name}-${period}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    await logAudit("export_report", "report", undefined, `${name} · ${period}`);
    toast.success("Report exported");
  };

  return (
    <AdminLayout title="Reports" subtitle="Export operational data for finance, board packs and regulators. CSV opens directly in Excel; use print-to-PDF for signed copies.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Period" value={period} />
        <Stat label="Trips" value={scoped.length.toString()} />
        <Stat label="Revenue" value={naira(revenue)} accent />
        <Stat label="Customers" value={profiles.length.toString()} />
      </div>
      <Panel title="Generate Export" action={
        <select value={period} onChange={(e) => setPeriod(e.target.value as keyof typeof PERIODS)}
          className="h-8 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
          {Object.keys(PERIODS).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      }>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([["bookings", scoped], ["revenue", scoped.filter((b) => b.payment_status === "paid")], ["drivers", drivers], ["customers", profiles]] as const).map(([name, rows]) => (
            <button key={name} onClick={() => download(name, rows as Row[])}
              className="p-4 border border-gold/30 hover:border-gold text-left transition-colors">
              <Download className="h-4 w-4 text-gold" />
              <div className="font-display mt-2 capitalize">{name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{(rows as Row[]).length} rows · CSV</div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={() => window.print()} className="h-9 px-4 border border-border text-[10px] uppercase tracking-widest hover:border-gold">Print / Save as PDF</button>
        </div>
      </Panel>
    </AdminLayout>
  );
}
