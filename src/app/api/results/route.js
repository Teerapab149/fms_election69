import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // -------------------------------------------------------
    // 1. ดึงข้อมูลผู้สมัคร (Candidates) + ✅ สมาชิกพรรค (Members)
    // -------------------------------------------------------
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        number: 'asc',
      },
      // 👇 เพิ่มตรงนี้ครับ! เพื่อดึงข้อมูลสมาชิกในพรรคมาด้วย
      include: {
        members: true, 
      }
    });

    // -------------------------------------------------------
    // 2. ดึงข้อมูลสถิติ (Stats) - เหมือนเดิม
    // -------------------------------------------------------
    const majorStats = await prisma.user.groupBy({
      by: ['major'],
      where: { isVoted: true },
      _count: { major: true },
    });

    const yearStats = await prisma.user.groupBy({
      by: ['year'],
      where: { isVoted: true },
      _count: { year: true },
    });

    const genderStats = await prisma.user.groupBy({
      by: ['gender'],
      where: { isVoted: true },
      _count: { gender: true },
    });

    const totalEligible = await prisma.user.count();

    // -------------------------------------------------------
    // 3. ส่งข้อมูลกลับ
    // -------------------------------------------------------
    return NextResponse.json({
      candidates: candidates, // ตอนนี้ในนี้จะมี members ติดไปด้วยแล้ว
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