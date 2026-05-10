// templatePresets.js — Pre-designed page themes for admin "ออกแบบหน้าเว็บ" tab
// Admin สามารถเลือก template → config ทั้งหน้าถูกแทนที่ทันที
// Templates เป็น read-only masters — การ apply จะ copy config ลงใน pageLayout ที่ active
// หลัง apply แล้ว admin ยังสามารถปรับแต่งรายละเอียดเพิ่มเติมได้ตามปกติ

export const TEMPLATE_PRESETS = [
  {
    id: "classic",
    name: "Classic",
    nameTh: "คลาสสิก",
    description: "แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป",
    thumbnail: "classic",
    theme: {
      primaryColor: "#8A2680",
      accentColor: "#9333EA",
      borderRadius: "rounded",
      backgroundStyle: "gradient-light",
    },
    home: [
      { type: "hero",           visible: true, order: 1, column: "left",  config: { style: "gradient", showCountdown: true, showStatusBadge: true } },
      { type: "voteCTA",        visible: true, order: 2, column: "left",  config: {} },
      { type: "meetCandidates", visible: true, order: 3, column: "left",  config: { style: "card" } },
      { type: "stats",          visible: true, order: 1, column: "right", config: { style: "gradient", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } },
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: true, abstainStyle: "auto" } },
  },
  {
    id: "modern-dark",
    name: "Modern Dark",
    nameTh: "โมเดิร์นดาร์ก",
    description: "พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย",
    thumbnail: "dark",
    theme: {
      primaryColor: "#7C3AED",
      accentColor: "#06B6D4",
      borderRadius: "rounded",
      backgroundStyle: "dark",
    },
    home: [
      { type: "hero",           visible: true, order: 1, column: "left",  config: { style: "dark", showCountdown: true, showStatusBadge: true } },
      { type: "voteCTA",        visible: true, order: 2, column: "left",  config: {} },
      { type: "meetCandidates", visible: true, order: 3, column: "left",  config: { style: "card" } },
      { type: "stats",          visible: true, order: 1, column: "right", config: { style: "dark", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } },
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: true, abstainStyle: "auto" } },
  },
  {
    id: "playful",
    name: "Playful",
    nameTh: "สนุกสนาน",
    description: "สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun",
    thumbnail: "playful",
    theme: {
      primaryColor: "#EC4899",
      accentColor: "#F59E0B",
      borderRadius: "pill",
      backgroundStyle: "gradient-warm",
    },
    home: [
      { type: "hero",           visible: true, order: 1, column: "left",  config: { style: "gradient", showCountdown: true, showStatusBadge: true } },
      { type: "meetCandidates", visible: true, order: 2, column: "left",  config: { style: "card" } },
      { type: "voteCTA",        visible: true, order: 3, column: "left",  config: {} },
      { type: "stats",          visible: true, order: 1, column: "right", config: { style: "gradient", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: true, order: 2, column: "right", config: { style: "image" } },
    ],
    vote: { multiParty: { gridCols: "auto", cardVariant: "auto", showDivider: false, abstainStyle: "compact" } },
  },
  {
    id: "minimal",
    name: "Minimal",
    nameTh: "มินิมอล",
    description: "ขาวสะอาด typography เด่น เรียบหรู ดูเป็นมืออาชีพ",
    thumbnail: "minimal",
    theme: {
      primaryColor: "#1E293B",
      accentColor: "#8A2680",
      borderRadius: "sharp",
      backgroundStyle: "white",
    },
    home: [
      { type: "hero",           visible: true,  order: 1, column: "left",  config: { style: "minimal", showCountdown: true, showStatusBadge: false } },
      { type: "voteCTA",        visible: true,  order: 2, column: "left",  config: {} },
      { type: "meetCandidates", visible: true,  order: 3, column: "left",  config: { style: "card" } },
      { type: "stats",          visible: true,  order: 1, column: "right", config: { style: "card", showPercentage: true, showTotalEligible: true } },
      { type: "electionBanner", visible: false, order: 2, column: "right", config: {} },
    ],
    vote: { multiParty: { gridCols: "2", cardVariant: "grid", showDivider: true, abstainStyle: "minimal" } },
  },
];

export const getPresetById = (id) => TEMPLATE_PRESETS.find((p) => p.id === id);
export const DEFAULT_PRESET_ID = "classic";

// หา preset ที่ theme.primaryColor ตรงกับ theme ปัจจุบัน (detect active template)
// ถ้าไม่ตรง → return null (แปลว่า custom)
export const detectActivePreset = (theme) => {
  if (!theme?.primaryColor) return null;
  return TEMPLATE_PRESETS.find(
    (p) => p.theme.primaryColor.toLowerCase() === theme.primaryColor.toLowerCase()
  ) || null;
};
