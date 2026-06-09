// presets — built-in Layer-2 starter components for the palette ("คลังสำเร็จรูป").
// Self-contained descriptors (frames styled via inline layout/style + atoms) so they
// drop in and render without external CSS. Good-looking starting points the admin
// can then restyle freely — the "ready-made" half of each layer's library.

export const PRESETS = [
  {
    id: "preset-stat",
    name: "การ์ดสถิติ",
    node: {
      kind: "frame", layout: { direction: "column", gap: 2 },
      style: { background: "#FFFDFA", border: "2.5px solid #26271c", borderRadius: "16px", boxShadow: "4px 4px 0 #26271c", padding: "18px 20px", minWidth: "170px", "--pop": "#C2F47E" },
      children: [
        { kind: "atom", type: "text-meta", props: { children: "ผู้มาใช้สิทธิ์ · TURNOUT" }, style: { display: "block" } },
        { kind: "atom", type: "text-stat", props: { children: "1,240" }, style: { marginTop: 8, display: "block" } },
        { kind: "atom", type: "text-plain", props: { children: "อัปเดตล่าสุดเมื่อสักครู่" }, style: { marginTop: 4 } },
      ],
    },
  },
  {
    id: "preset-cta",
    name: "บล็อก CTA",
    node: {
      kind: "frame", layout: { direction: "column", gap: 12, align: "center" },
      style: { background: "#FFF6EC", border: "2.5px solid #26271c", borderRadius: "20px", boxShadow: "5px 5px 0 #26271c", padding: "28px 24px", textAlign: "center", "--pop": "#FF9CE9", maxWidth: "360px" },
      children: [
        { kind: "atom", type: "text-title", props: { children: "พร้อมโหวตหรือยัง?", as: "h3" } },
        { kind: "atom", type: "text-body", props: { children: "ร่วมเป็นส่วนหนึ่งในการกำหนดอนาคตของสโมสร" } },
        { kind: "atom", type: "button-primary", props: { children: "ไปลงคะแนน", as: "span" } },
      ],
    },
  },
  {
    id: "preset-badge-row",
    name: "หัวข้อ + เลข",
    node: {
      kind: "frame", layout: { direction: "row", gap: 12, align: "center" },
      style: { "--pop": "#B6E6FF" },
      children: [
        { kind: "atom", type: "badge", props: { children: "1" } },
        { kind: "atom", type: "text-title", props: { children: "ชื่อพรรค", as: "h3" } },
      ],
    },
  },
];
