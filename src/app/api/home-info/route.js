import { NextResponse } from "next/server";
import { db } from "../../../lib/db"; 

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = await db.candidate.findMany({
      select: {
        id: true,
        number: true,
        // name: true, // ถ้าใน DB ไม่มี column 'name' ให้ comment บรรทัดนี้ออกครับ
        logoUrl: true, // ✅ แก้เป็นชื่อนี้ตามในรูป Database ของคุณ
      },
      orderBy: { number: 'asc' },
      take: 5, 
    });

    const totalEligible = await db.user.count();
    const totalVoted = await db.user.count({
      where: { isVoted: true }
    });

    return NextResponse.json({
      candidates,
      stats: { totalEligible, totalVoted }
    });

  } catch (error) {
    console.error("🔥 Error fetching home info:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}