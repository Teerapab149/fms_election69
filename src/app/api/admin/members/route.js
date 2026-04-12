import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const members = await db.member.findMany({
      include: {
        // ✅ ดึงข้อมูลพรรคแม่มาด้วย (เพื่อเอาเบอร์พรรค)
        candidate: {
          select: {
            number: true,
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: [
        { candidate: { number: 'asc' } }, // เรียงตามเบอร์พรรคก่อน
        { id: 'asc' } // แล้วค่อยเรียงตามลำดับการสมัคร
      ]
    });

    return NextResponse.json(members);

  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}