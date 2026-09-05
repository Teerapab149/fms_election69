// ESLint flat config — ตัวที่ `npm run lint` ใช้จริง
//
// ทำไมต้องมีไฟล์นี้ (2026-09-05): เดิม `npm run lint` เรียก `next lint` ซึ่งไม่เจอ
// config ใด ๆ ในโปรเจกต์ มันจึงเปิด **wizard ถามว่าจะตั้งค่าแบบไหน** แล้วรอคำตอบ
// ผลคือ:
//   • ใน CI หรือ cron มันค้างรอ input ที่ไม่มีวันมา
//   • รันแบบไม่มี stdin แล้ว **จบด้วย exit 0** ทั้งที่ไม่ได้ตรวจไฟล์สักไฟล์ —
//     gate ที่ผ่านตลอดโดยไม่ทำอะไรเลย แย่กว่าไม่มี gate เพราะมันให้ความมั่นใจปลอม ๆ
//   • `next lint` ประกาศ deprecated แล้วและจะถูกถอดออกใน Next 16 — เราอยู่ 15.5.25
//     ซึ่งแปลว่ามันมีอายุถึงแค่การอัปเกรดครั้งหน้า
//
// eslint 9 ใช้ flat config เป็นค่าเริ่มต้น ส่วน eslint-config-next 15 ยังส่งออกเป็น
// รูปแบบ eslintrc เดิม (ดู exports ใน package.json ของมัน) จึงต้องแปลงผ่าน FlatCompat
// ซึ่งติดมากับ eslint อยู่แล้ว ไม่ต้องลง dependency เพิ่ม
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  {
    // ไม่ตรวจของที่ไม่ใช่ซอร์สของเรา · `.next*` ครอบ dist dir ของ QA/e2e ที่ตั้งชื่อ
    // ต่างกัน (.next-qa3021 ฯลฯ ดู next.config.mjs) ไม่งั้น lint จะไปไล่โค้ดที่ build แล้ว
    ignores: [
      "node_modules/**",
      ".next*/**",
      "archive/**",
      "public/**",
      ".specs/**",
      "prisma/migrations/**",
      "**/*.min.js",
      // .claude/worktrees มี worktree เก่าค้างอยู่ (สำเนาทั้งรีโปในสภาพเก่า) ถ้าไม่กัน
      // ไว้ lint จะรายงาน error ของโค้ดที่ไม่มีใครใช้แล้วปนมากับของจริง จนแยกไม่ออกว่า
      // อันไหนต้องแก้ — รอบแรกที่รัน 24 จาก 39 error มาจากที่นี่
      ".claude/**",
      // ไฟล์ debug ที่วางไว้ชั่วคราวที่ราก ไม่ได้ถูก import จากที่ไหน
      "navbar_debug.js",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];
