// "Original" — the hand-crafted SAMO classic design, restored from the gold
// version at commit ee059dc (before the web-editor extraction stripped its
// hover/transition/gradient polish). It is a SELF-CONTAINED layout family (like
// verdure/gumroad), rendered by OriginalHome etc. — NOT token-driven, so it does
// not go through the editor's element/config system. Purple-white only for now;
// theme variants can be added later by tokenising colours (keeping the polish).
export const originalTemplate = {
  slug: "original",
  name: "ออริจินัล",
  description: "ดีไซน์ต้นฉบับ SAMO (ม่วง-ขาว) — เวอร์ชันที่ทำไว้ดีที่สุด ก่อนถูกตัดทอนตอนทำ editor",
  layoutFamily: "original",
  isLocked: true,
  colorSwatch: { primary: "#8A2680", secondary: "#9333EA" },
  // hardcoded design — no editor element/token surface
  elements: {},
  pages: { home: {}, candidates: {}, party: {}, vote: {}, results: {}, success: {}, closed: {} },
};
