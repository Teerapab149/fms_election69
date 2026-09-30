// หน้า 404 — URL ที่ไม่มีอยู่จริง
//
// ก่อนหน้านี้ไม่มีไฟล์นี้ ผู้ใช้จึงได้หน้า default ของ Next: ข้อความอังกฤษสองบรรทัด
// "404 / This page could not be found." บนพื้นขาวเปล่า ไม่มีชื่อระบบ ไม่มีทางกลับ
// ไม่มีภาษาไทยสักตัว — คนที่กดลิงก์ผิดไม่มีทางรู้ว่ายังอยู่ในเว็บเลือกตั้งของคณะอยู่ไหม
//
// เรื่องที่ทำให้หน้านี้จำเป็นกว่าปกติ: ระบบเพิ่งย้ายจาก cvs.fms.psu.ac.th/fms-ovs มาอยู่
// root ของโดเมนตัวเอง ลิงก์เก่าทุกอันที่นักศึกษาบุ๊กมาร์กไว้ ที่แชร์ในกลุ่มไลน์ หรือที่
// ค้างอยู่ใน Google จะมาลงที่หน้านี้ทั้งหมด
//
// ⚠️ หน้านี้ไม่ query ฐานข้อมูลเองและไม่ fetch อะไรเลย โดยตั้งใจ — หน้า error ที่ต้องถาม DB
// ก่อนถึงจะ render ได้ จะพังซ้ำตอนที่ DB นั่นแหละมีปัญหา ซึ่งเป็นเวลาที่ต้องการมันที่สุด
//
// สีและฟอนต์ตามธีมที่แอดมินเลือก โดยไม่ต้องพึ่ง DB เพิ่ม: root layout (app/layout.js)
// ใส่ token ของธีม (--color-*, --font-*, --radius-*) ไว้บน .fms-app แล้ว และหน้านี้ render
// อยู่ข้างในนั้น เราจึงแค่อ่าน var() — ทุกตัวมีค่าสำรองเป็นสีแบรนด์ FMS เดิม (#8A2680 ฯลฯ)
// ถ้า layout ดึงธีมไม่ได้ (DB ล่ม → tokenCss ว่าง) var() จะตกไปที่ค่าสำรอง ได้หน้าเดิมแบบก่อนหน้านี้
//
// เรื่อง contrast: ไม่ใช้ --color-primary เป็นสีตัวอักษรหรือพื้นปุ่มที่มีตัวอักษรขาว เพราะบางธีม
// primary สว่างมาก (gumroad ชมพู #FF9CE9, studio-dark เขียวมะนาว #D5FF3F) ขาวบนนั้นอ่านไม่ออก
// ตัวอักษรทั้งหมดจึงใช้ --color-text / --color-text-muted บนพื้น --color-surface ซึ่งธีมออกแบบ
// ให้อ่านได้อยู่แล้ว ส่วน primary ใช้เป็นขอบปุ่ม แต้มพื้นปุ่ม และไล่สีตัวเลข 404

import Link from "next/link";

export const metadata = {
  title: "ไม่พบหน้าที่ต้องการ ระบบเลือกตั้งออนไลน์ FMS",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--color-bg, #F8F9FD)",
        color: "var(--color-text, #1F2937)",
        fontFamily: "var(--font-body, inherit)",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "var(--color-surface, #fff)",
          border: "1px solid var(--color-border, #F0F0F4)",
          borderRadius: "var(--radius-card, 20px)",
          boxShadow: "0 10px 40px color-mix(in srgb, var(--color-primary, #8A2680) 8%, transparent)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display, inherit)",
            background: "linear-gradient(135deg, var(--color-primary, #8A2680), color-mix(in srgb, var(--color-primary, #8A2680) 60%, var(--color-text, #1F2937)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "16px",
          }}
        >
          404
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text, #1F2937)", fontFamily: "var(--font-display, inherit)", margin: "0 0 12px" }}>
          ไม่พบหน้าที่ต้องการ
        </h1>

        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--color-text-muted, #6B7280)", margin: "0 0 8px" }}>
          หน้านี้อาจถูกย้ายหรือลิงก์ที่ใช้เป็นลิงก์เก่า
        </p>
        {/* บอกสาเหตุที่พบบ่อยที่สุดตรง ๆ ดีกว่าปล่อยให้เดา — คนส่วนใหญ่ที่มาถึงหน้านี้
            มาจากลิงก์ยุค /fms-ovs ที่ยังค้างอยู่ในบุ๊กมาร์กหรือในกลุ่มไลน์ */}
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--color-text-muted, #9CA3AF)", margin: "0 0 28px" }}>
          ถ้าคุณเข้ามาจากลิงก์เก่าที่มี <code style={{ background: "color-mix(in srgb, var(--color-border, #E5E7EB) 30%, var(--color-surface, #fff))", color: "var(--color-text, #1F2937)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>/fms-ovs</code> อยู่ในที่อยู่เว็บ
          ระบบได้ย้ายมาอยู่ที่หน้าแรกแล้ว กดปุ่มด้านล่างได้เลย
        </p>

        {/* ปุ่มแบบขอบ primary + ตัวอักษร --color-text: อ่านออกทุกธีม (ดูหมายเหตุ contrast ด้านบน) */}
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "11px 28px",
            borderRadius: "var(--radius-button, 12px)",
            border: "2px solid var(--color-primary, #8A2680)",
            background: "color-mix(in srgb, var(--color-primary, #8A2680) 12%, var(--color-surface, #fff))",
            color: "var(--color-text, #1F2937)",
            fontWeight: 600,
            fontSize: "15px",
            textDecoration: "none",
          }}
        >
          กลับสู่หน้าแรก
        </Link>

        <p style={{ fontSize: "12px", color: "var(--color-text-muted, #9CA3AF)", margin: "28px 0 0" }}>
          ระบบเลือกตั้งออนไลน์ สโมสรนักศึกษาคณะวิทยาการจัดการ ม.อ.
        </p>
      </div>
    </main>
  );
}
