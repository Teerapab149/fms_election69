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
// ⚠️ หน้านี้ต้องไม่พึ่งฐานข้อมูลและไม่พึ่งธีมที่แอดมินเลือกไว้ โดยตั้งใจ
// เหตุผล: หน้า error ที่ต้อง query DB ก่อนถึงจะ render ได้ จะพังซ้ำตอนที่ DB นั่นแหละมีปัญหา
// ซึ่งเป็นเวลาที่เราต้องการมันที่สุด สีที่ใช้จึงเป็นสีแบรนด์ FMS ฮาร์ดโค้ดไว้ตรง ๆ
// (#8A2680) ไม่ได้อ่านจาก token ของธีม

import Link from "next/link";

export const metadata = {
  title: "ไม่พบหน้าที่ต้องการ · ระบบเลือกตั้งออนไลน์ FMS",
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
        background: "#F8F9FD",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#fff",
          border: "1px solid #F0F0F4",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(138, 38, 128, 0.08)",
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
            background: "linear-gradient(135deg, #8A2680, #601A59)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "16px",
          }}
        >
          404
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1F2937", margin: "0 0 12px" }}>
          ไม่พบหน้าที่ต้องการ
        </h1>

        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#6B7280", margin: "0 0 8px" }}>
          หน้านี้อาจถูกย้ายหรือลิงก์ที่ใช้เป็นลิงก์เก่า
        </p>
        {/* บอกสาเหตุที่พบบ่อยที่สุดตรง ๆ ดีกว่าปล่อยให้เดา — คนส่วนใหญ่ที่มาถึงหน้านี้
            มาจากลิงก์ยุค /fms-ovs ที่ยังค้างอยู่ในบุ๊กมาร์กหรือในกลุ่มไลน์ */}
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#9CA3AF", margin: "0 0 28px" }}>
          ถ้าคุณเข้ามาจากลิงก์เก่าที่มี <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: "4px" }}>/fms-ovs</code> อยู่ในที่อยู่เว็บ
          ระบบได้ย้ายมาอยู่ที่หน้าแรกแล้ว กดปุ่มด้านล่างได้เลย
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "13px 30px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #8A2680, #601A59)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            textDecoration: "none",
          }}
        >
          กลับสู่หน้าแรก
        </Link>

        <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "28px 0 0" }}>
          ระบบเลือกตั้งออนไลน์ · สโมสรนักศึกษาคณะวิทยาการจัดการ ม.อ.
        </p>
      </div>
    </main>
  );
}
