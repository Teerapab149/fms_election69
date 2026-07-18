"use client";

// /compose-lab — DEV SANDBOX for the Layer-2 Composition Editor (Canva-like, v1).
// Standalone surface to prove the 3-layer model is manipulable (render descriptor →
// select node → edit props live). Not auth-gated on purpose (dev). Integration into
// the admin PageDesignTab comes in a later step.

import CompositionEditor from "../../components/admin/compose/CompositionEditor";

// A SELF-CONTAINED sample descriptor: frames styled via inline layout/style (no
// external CSS classes) + Layer-1 atoms. Demonstrates that an editor-built component
// is fully self-describing through the descriptor.
const SAMPLE = {
  kind: "frame",
  layout: { direction: "column", gap: 14 },
  style: {
    background: "#FFFDFA", border: "2.5px solid #26271c", borderRadius: "22px",
    boxShadow: "5px 5px 0 #26271c", padding: "26px", width: "100%", maxWidth: "380px",
    "--pop": "#B6E6FF",
  },
  children: [
    { kind: "atom", type: "text-meta", props: { children: "★ NEW · ELEMENT" } },
    { kind: "atom", type: "text-title", props: { children: "การ์ดทดสอบ Composition", as: "h2" } },
    { kind: "atom", type: "text-body", props: { children: "ลองคลิกแต่ละชิ้นบน canvas (หรือใน Layers ทางซ้าย) แล้วแก้ข้อความทางขวา — ทุกชิ้นคือ Layer-1 atom ที่ประกอบกันเป็น component" } },
    {
      kind: "frame", layout: { direction: "row", gap: 8, wrap: "wrap" },
      children: [
        { kind: "atom", type: "chip", props: { children: "ชั่วโมงกิจกรรม", tone: "lime" } },
        { kind: "atom", type: "chip", props: { children: "แท็ก", tone: "pink" } },
      ],
    },
    { kind: "atom", type: "button-primary", props: { children: "ปุ่มหลัก", as: "span" }, style: { alignSelf: "flex-start" } },
  ],
};

export default function ComposeLabPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] p-5 sm:p-7">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 tracking-tight">Composition Editor</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Layer-2 visual editor · sandbox — ยังไม่เชื่อมหน้าจริง</p>
          </div>
          <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200/80 rounded-md px-2 py-1">/compose-lab</span>
        </div>
        <CompositionEditor initialNode={SAMPLE} />
      </div>
    </div>
  );
}
