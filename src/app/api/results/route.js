import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = await db.candidate.findMany({
      orderBy: {
        number: 'asc',
      },
      include: {
        members: true, 
      }
    });

    const majorStats = await db.user.groupBy({
      by: ['major'],
      where: { isVoted: true },
      _count: { major: true },
    });

    const yearStats = await db.user.groupBy({
      by: ['year'],
      where: { isVoted: true },
      _count: { year: true },
    });

    const genderStats = await db.user.groupBy({
      by: ['gender'],
      where: { isVoted: true },
      _count: { gender: true },
    });

    const totalEligible = await db.user.count();

    return NextResponse.json({
      candidates: candidates, 
      stats: {
        totalEligible: totalEligible,
        byMajor: majorStats.map(item => ({ name: item.major, value: item._count.major })),
        byYear: yearStats.map(item => ({ name: item.year, value: item._count.year })),
        byGender: genderStats.map(item => ({ name: item.gender, value: item._count.gender })),
      }
    });

  } catch (error) {
    console.error("🔥 Error fetching results:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}