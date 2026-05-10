---
name: architect-critical-mindset
description: Universal core rules for architecture, debugging, and code generation. Enforces strict type-safety, clean UI/UX, and logical verification before any code changes.
---

# 1. The Core Mindset (System-Level Thinking)
- **Zero Guesswork:** ห้ามเดา Root Cause หรือเขียน/แก้โค้ดโดยพลการเด็ดขาด ต้องรันสคริปต์หรือใช้ Bash ตรวจสอบสมมติฐาน (Verify) เสมอ
- **Data Integrity First:** ทุกครั้งที่แตะ Database Schema (Prisma) หรือ API Logic ต้องคิดถึงผลกระทบต่อระบบโดยรวม ห้ามทำให้ข้อมูลสูญหายหรือเกิดช่องโหว่
- **Premium Aesthetics:** งาน Frontend ต้องคลีน ทันสมัย มินิมอล (Awwwards-winning style) ไม่รก และใช้ Animation เท่าที่จำเป็นเพื่อเพิ่ม UX
- **Strictly Typed:** บังคับใช้ TypeScript ขั้นสุด ห้ามใช้ `any` หรือ `@ts-ignore` เด็ดขาด

# 2. Universal Debugging & Execution Flow
เมื่อได้รับโจทย์ ให้ทำตามลำดับนี้แบบ Step-by-Step:

1. **Context Initialization (Read Phase):**
   - ค้นหาและอ่านไฟล์ที่เกี่ยวข้องผ่าน Bash
   - ตรวจสอบ `references/` สำหรับกฎเฉพาะโปรเจกต์ หรือโครงสร้าง Database Schema
2. **Analysis & Hypothesis (Think Phase):**
   - วิเคราะห์ปัญหาจากกว้างไปแคบ (Database -> Backend/API -> Client Component)
   - ลิสต์สมมติฐานที่สั้นและตรงประเด็น 1-3 ข้อ
3. **Verification (Prove Phase):**
   - รันคำสั่งตรวจสอบ (เช่น ตรวจ log, รัน test, หรือตรวจสอบ type) เพื่อยืนยันว่าสมมติฐานถูกต้องก่อนเริ่มแก้โค้ด
4. **Precision Execution (Act Phase):**
   - แก้ไขโค้ดให้ตรงจุดที่สุด ห้ามปรับโครงสร้างไฟล์อื่นที่ไม่เกี่ยวข้องโดยไม่จำเป็น
   - โค้ดที่ออกมาต้องสั้น กระชับ อ่านง่าย (No boilerplate)

# 3. Code Generation Standards
- **Next.js (App Router):** แยก Server Components และ Client Components อย่างชัดเจน
- **Prisma & DB:** การ Query ต้อง Optimize เสมอ ห้ามดึงข้อมูลที่ไม่จำเป็นมาที่ Client
- **Refactoring:** โค้ดใหม่ต้องมีคุณภาพดีกว่าโค้ดเดิมเสมอ กำจัดโค้ดขยะทิ้ง

# 4. Memory & Evolution
- หากแก้ปัญหายากๆ หรือสร้าง Workflow ใหม่ที่ทำงานได้ดี ให้สรุปความรู้แบบสั้นๆ (Bullet points) ลงใน `references/knowledge-base.md` เพื่อใช้เป็นบรรทัดฐานในอนาคต