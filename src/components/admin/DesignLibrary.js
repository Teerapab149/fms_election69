"use client";

// DesignLibrary — a READ-ONLY showcase of the design language each template
// owns. Owner ask: "อยากเห็นว่าระบบมีปุ่ม/design แบบไหนบ้าง แยกตาม template" — so
// instead of presenting voteCTA as swappable variants, this catalogs each
// template's button rendered in ITS OWN palette, side by side, labelled with
// which template uses it. (Step 1 of the per-template-design direction; the
// editor lock-in / element coverage come later.)
//
// Each card renders the REAL variant component inside a self-contained token
// scope built from that template's tokens (builtIn/<slug>.js), so the preview is
// faithful regardless of the admin page's ancestry. Extend BUTTON_DESIGNS (and
// add new sections) as more element families adopt distinct per-template designs.

import { LayoutGrid, MousePointerClick } from "lucide-react";
import { getVoteCTAVariant } from "../elements/voteCTA-button";

// Mock that resolves voteCTA to its resting "notVoted" state (logged-in, open).
const MOCK_DATA = {
  session: { user: { name: "preview" } },
  isVotedReal: false,
  isCheckingVoted: false,
  initialData: { systemMode: "AUTO", electionStatus: "ONGOING", isSystemOpen: true },
};

// Shared button sizing so the three designs are visually comparable; only the
// identity tokens (colours, radius, shadow) differ per template.
const SIZING = {
  "--btn-padding-x": "30px",
  "--btn-padding-y": "15px",
  "--btn-font-size": "16px",
  "--btn-font-weight": "600",
  "--btn-letter-spacing": "normal",
  "--btn-text-transform": "none",
  "--btn-icon-color": "var(--btn-text)",
};

const BUTTON_DESIGNS = [
  {
    slug: "classic",
    template: "คลาสสิก",
    variant: "default",
    variantLabel: "Default",
    desc: "ปุ่ม pill ไล่เฉดสี เงานุ่ม โค้งมน — โทนทางการ เรียบหรู",
    cardBg: "#F8F9FD",
    onDark: false,
    scope: {
      "--color-primary": "#8A2680", "--color-accent": "#9333EA",
      "--color-surface": "#ffffff", "--color-text": "#1a1a2e",
      "--btn-bg": "var(--color-primary)", "--btn-text": "var(--color-surface)",
      "--btn-border-color": "transparent", "--btn-radius": "9999px",
      "--btn-shadow": "0 4px 12px rgba(138,38,128,.25)", "--btn-hover-bg": "var(--btn-bg)",
      ...SIZING,
    },
  },
  {
    slug: "gumroad",
    template: "กัมโรด (Active Pulse)",
    variant: "chunky-stamp",
    variantLabel: "Chunky Stamp",
    desc: "ขอบหมึกหนา เงาแข็งแบบปั๊มตรา — สนุก หนักแน่น",
    cardBg: "#FFF1E5",
    onDark: false,
    scope: {
      "--color-primary": "#B6FF6E", "--color-accent": "#FF90E8",
      "--color-surface": "#1A1A1A", "--color-text": "#1A1A1A",
      "--btn-bg": "var(--color-primary)", "--btn-text": "#1A1A1A",
      "--btn-border-color": "#1A1A1A", "--btn-radius": "14px",
      "--btn-shadow": "5px 5px 0 #1A1A1A", "--btn-hover-bg": "var(--btn-bg)",
      ...SIZING,
    },
  },
  {
    slug: "studio-dark",
    template: "สตูดิโอ ดาร์ก",
    variant: "minimal-pill",
    variantLabel: "Minimal Pill",
    desc: "เส้นขอบไลม์บางบนพื้นโปร่ง เติมสีตอน hover — มินิมอล",
    cardBg: "#14140F",
    onDark: true,
    scope: {
      "--color-primary": "#D5FF3F", "--color-accent": "#C7E866",
      "--color-surface": "#14140F", "--color-text": "#F2EDDF",
      "--btn-bg": "transparent", "--btn-text": "#14140F",
      "--btn-border-color": "var(--color-primary)", "--btn-radius": "9999px",
      "--btn-shadow": "none", "--btn-hover-bg": "var(--color-primary)",
      ...SIZING,
    },
  },
];

export default function DesignLibrary() {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
      {/* header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="bg-purple-50 text-[#8A2680] p-2.5 rounded-xl shrink-0">
          <LayoutGrid className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">คลัง Design</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            รวม design ที่แต่ละ template เป็นเจ้าของ — ดูได้ว่าในระบบมีปุ่ม/องค์ประกอบแบบไหนบ้าง (อ่านอย่างเดียว)
          </p>
        </div>
      </div>

      {/* === voteCTA buttons === */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <MousePointerClick className="w-4 h-4 text-slate-400" />
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
            ปุ่มลงคะแนน · voteCTA
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">แต่ละ template มีปุ่มเป็นของตัวเอง — แสดงในสีจริงของ template นั้น</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUTTON_DESIGNS.map((d) => {
            const Btn = getVoteCTAVariant(d.variant);
            return (
              <div key={d.slug} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* live preview on the template's own background */}
                <div
                  className="h-32 flex items-center justify-center px-4"
                  style={{ background: d.cardBg }}
                >
                  <div style={d.scope}>
                    <Btn config={{}} data={MOCK_DATA} resolvedConfig={null} resolvedTemplate={null} elementConfigs={null} />
                  </div>
                </div>
                {/* label */}
                <div className="p-3.5 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800">{d.variantLabel}</span>
                    <span className="text-[10px] font-mono font-semibold text-[#8A2680] bg-purple-50 px-2 py-0.5 rounded-full">{d.slug}</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{d.desc}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">ใช้ใน template <strong className="text-slate-600">{d.template}</strong></p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-slate-400 mt-8 border-t border-slate-100 pt-4">
        หมายเหตุ: นี่คือคลังแสดง design (read-only) — การเลือก/แก้ design ทำที่แท็บ “ออกแบบหน้าเว็บ”.
        องค์ประกอบอื่น (การ์ดพรรค, หัวข้อ, ฯลฯ) จะทยอยเพิ่มเข้าคลังนี้ต่อไป.
      </p>
    </div>
  );
}
