import { CalendarDays, Hourglass, Power, Zap } from "lucide-react";

// Single source for the four system modes: the buttons in the control center
// and the explanation cards in the settings tab both read this, so the two
// can never drift apart. Descriptions follow what SET_MODE really does:
// it writes SystemConfig.systemMode and the status ladder reads it.
export const SYSTEM_MODES = [
  {
    id: "AUTO",
    short: "AUTO",
    thai: "อัตโนมัติ",
    Icon: CalendarDays,
    hint: "เปิดและปิดหีบตามวันเวลาที่ตั้งไว้",
    when: "ใช้เมื่อกำหนดการแน่นอนแล้ว ระบบดูวันเวลาใน “ตั้งค่าทั่วไป” แล้วเปิดและปิดหีบเอง (โหมดปกติ)",
    students: "หน้านับถอยหลังก่อนถึงเวลา แล้วโหวตได้เองเมื่อถึงเวลาเปิดหีบ",
  },
  {
    id: "MANUAL_OPEN",
    short: "OPEN",
    thai: "เปิดระบบ",
    Icon: Zap,
    hint: "บังคับเปิดรับคะแนนทันที ไม่สนเวลา",
    when: "ใช้เมื่อตั้ง AUTO ไว้แล้วระบบไม่เปิดหีบตามเวลาที่กำหนด จึงต้องเปิดเอง หรือต้องการเปิดก่อนกำหนดหรือทดสอบระบบ บังคับเปิดรับคะแนนทันที ไม่สนวันเวลาที่ตั้งไว้",
    students: "หน้าลงคะแนนทันที แม้ยังไม่ถึงเวลาเปิดหีบตามกำหนด",
    // owner 2026-10-01: OPEN stays open on purpose, say so wherever it is chosen
    note: "OPEN จะไม่เปลี่ยนเป็น ENDED เอง แม้เลยเวลาปิดหีบแล้ว เมื่อหมดเวลาเลือกตั้ง ต้องกลับมากด ENDED ด้วยตัวเอง",
  },
  {
    id: "PAUSE",
    short: "PAUSE",
    thai: "ระงับ",
    Icon: Hourglass,
    hint: "หยุดรับคะแนนชั่วคราว (ซ่อมระบบ)",
    when: "ใช้เมื่อต้องแก้ข้อมูลกลางคันหรือระบบมีปัญหา แล้วจะกลับมาเปิดต่อ หยุดรับคะแนนชั่วคราว",
    students: "หน้าพักระบบ โหวตไม่ได้จนกว่าจะเปลี่ยนโหมดกลับ",
  },
  {
    id: "ENDED",
    short: "ENDED",
    thai: "ปิดระบบ",
    Icon: Power,
    hint: "ปิดหีบอย่างเป็นทางการ ไม่รับคะแนนอีก",
    when: "ใช้เมื่อการเลือกตั้งจบแล้ว หรือตั้ง AUTO ไว้แล้วระบบไม่ปิดหีบตามเวลาที่กำหนด จึงต้องปิดเอง ปิดหีบอย่างเป็นทางการ ไม่รับคะแนนอีก",
    students: "หน้าปิดหีบ และดูผลคะแนนได้เมื่อเปิดการแสดงผล",
  },
];
