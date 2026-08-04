import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "@/components/super/SuperLayout";
import { useCP, cpInsert, cpUpdate, cpDelete } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/cms")({ component: Page });

function Page() {
  const { rows, reload } = useCP("cms_blocks", "section");
  const [form, setForm] = useState<Row>({ section: "homepage", key: "", title: "", body: "", image_url: "" });
  const field = "h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full";
  const SECTIONS = ["homepage", "hero", "services", "destinations", "hotels", "flights", "shopping", "blog", "faq", "testimonials", "banners"];
  const add = async () => {
    if (!form.key) return toast.error("Block key required");
    const err = await cpInsert("cms_blocks", form, `${form.section}/${form.key}`);
    if (err) return toast.error(err.message);
    toast.success("Block published"); setForm({ section: "homepage", key: "", title: "", body: "", image_url: "" }); reload();
  };
  return (
    <SuperLayout title="Content Manager" subtitle="Edit marketing copy, hero text, banners, FAQs and testimonials without a deployment.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Blocks" value={rows.length.toString()} />
        <CStat label="Published" value={rows.filter((r) => r.published).length.toString()} tone="good" />
        <CStat label="Drafts" value={rows.filter((r) => !r.published).length.toString()} tone="warn" />
        <CStat label="Sections" value={new Set(rows.map((r) => r.section)).size.toString()} />
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <CPanel title="Content Blocks">
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {rows.map((r: Row) => (
              <div key={r.id} className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-widest text-crimson">{r.section}/{r.key}</span>
                  <span className="flex-1" />
                  <Toggle on={!!r.published} onChange={async (v) => { await cpUpdate("cms_blocks", { id: r.id }, { published: v }, r.key); reload(); }} />
                  <button onClick={async () => { await cpDelete("cms_blocks", { id: r.id }, r.key); reload(); }} className="text-muted-foreground hover:text-crimson">✕</button>
                </div>
                <input defaultValue={r.title ?? ""} placeholder="Title" onBlur={(e) => cpUpdate("cms_blocks", { id: r.id }, { title: e.target.value }, r.key)}
                  className="h-9 px-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full" />
                <textarea defaultValue={r.body ?? ""} placeholder="Body" rows={2} onBlur={(e) => cpUpdate("cms_blocks", { id: r.id }, { body: e.target.value }, r.key)}
                  className="p-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full" />
              </div>
            ))}
            {!rows.length && <CEmpty>No content blocks yet.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="New Block">
          <div className="p-3 space-y-2">
            <select className={field} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className={field} placeholder="Block key e.g. hero_title" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            <input className={field} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="p-3 bg-input border border-border text-xs outline-none focus:border-crimson w-full" rows={3} placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <input className={field} placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <button onClick={add} className="w-full h-10 bg-crimson text-white text-[11px] uppercase tracking-widest">Publish block</button>
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
