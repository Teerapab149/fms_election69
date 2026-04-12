import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ✅ เปลี่ยน prisma. เป็น db.
    let teams = await db.candidate.findMany({
      orderBy: {
        number: 'asc',
      },
      include: {
        members: {
          orderBy: {
            id: 'asc'
          }
        },
      }
    });

    // teams = teams.filter(e => e.number != 0); // Allow all candidates including Abstain

    return NextResponse.json(teams);

  } catch (error) {
    console.error("🔥 Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}