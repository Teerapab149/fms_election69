import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;
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