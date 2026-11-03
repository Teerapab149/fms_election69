import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";

const ICONS = { right: ArrowRight, left: ArrowLeft, down: ArrowDown, up: ArrowUp, "up-right": ArrowUpRight };

// ไอคอน Lucide แทนอีโมจิในหัวข้อและป้ายสติกเกอร์ ขนาดตามตัวอักษร (1em)
export function Ico({ icon: Icon, size = "1em", strokeWidth = 2.25 }) {
  return (
    <Icon
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      style={{ display: "inline-block", verticalAlign: "-0.15em", flex: "none" }}
    />
  );
}

// ไอคอนลูกศรแทนตัวอักษร → ← ↓ ↑ ↗ บนปุ่มและลิงก์ ขนาดตามตัวอักษรรอบข้าง (1em)
// เพื่อให้ตำแหน่งและจังหวะเหมือนเดิมกับตอนที่ยังเป็นตัวอักษร
export default function Arrow({ dir = "right", size = "1em", strokeWidth = 2.25 }) {
  return <Ico icon={ICONS[dir] || ArrowRight} size={size} strokeWidth={strokeWidth} />;
}
