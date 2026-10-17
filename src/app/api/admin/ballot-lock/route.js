import { NextResponse } from "next/server";
import { adminGuard } from "../../../../lib/auth/adminCheck";
import { getBallotLock } from "../candidates/ballotLock";

// อ่านอย่างเดียว: บอกหน้าฟอร์มพรรคว่าโครงสร้างบัตรถูกล็อกหรือยัง
// เงื่อนไขมาจาก getBallotLock ตัวเดียวกับที่ ballotBoxGuard ใช้ปฏิเสธตอนบันทึก
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  try {
    const lock = await getBallotLock();
    return NextResponse.json(lock, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ballot-lock check failed:", error);
    return NextResponse.json({ error: "ตรวจสถานะบัตรไม่สำเร็จ" }, { status: 500 });
  }
}
