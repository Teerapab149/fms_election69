"use client";

// SocialGlyph — เครื่องหมายของแต่ละแพลตฟอร์ม สำหรับที่ที่ไม่มีที่พอจะเขียนชื่อเต็ม
//
// สามอันแรกยืมจาก lucide (ชุดเดียวกับไอคอนอื่นทั้งเว็บ) TikTok ไม่มีใน lucide จึง
// วาดเองด้วย stroke ความหนา/หัวเส้นชุดเดียวกัน เพื่อให้ยืนเรียงกันแล้วไม่มีอันไหน
// หนาหรือบางกว่าเพื่อน · currentColor ทั้งหมด — สีมาจากที่ที่เอาไปวาง ไม่ใช่จาก
// สีประจำแบรนด์ เพราะทุกพรรค/ทุกช่องทางต้องได้น้ำหนักเท่ากันในหน้าเลือกตั้ง
//
// ⚠️ ไอคอนอย่างเดียวไม่พอสำหรับคนที่ใช้ screen reader — ที่เรียกใช้ต้องใส่
// aria-label หรือข้อความกำกับให้ลิงก์เสมอ (ที่นี่ทำ aria-hidden ไว้แล้ว)

import { Instagram, Facebook, Globe } from "lucide-react";

function TikTok({ size = 18 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const GLYPHS = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTok,
  website: Globe,
};

export default function SocialGlyph({ platform, size = 18 }) {
  const Icon = GLYPHS[platform] || Globe;
  return <Icon size={size} aria-hidden />;
}
