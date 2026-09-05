import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

/**
 * ข้อมูลพรรคสำหรับหน้าสาธารณะ (/party, /candidates, ขั้นตอนเลือกในหน้าโหวต)
 *
 * ⚠️ ต้องเป็น select แบบระบุชื่อฟิลด์เท่านั้น ห้ามกลับไปใช้ findMany เปล่า ๆ
 *
 * ของเดิมเรียก `findMany({ include: { members } })` ซึ่ง Prisma ตีความว่า
 * "เอาทุกคอลัมน์" — `score` จึงติดออกไปด้วย และไฟล์นี้ไม่เคยเช็ค `showResult` เลย
 * ผลคือใครก็ได้ที่ยิง GET /api/party (ไม่ต้องล็อกอิน ไม่ต้องเป็นแอดมิน) นั่งรีเฟรช
 * ดูคะแนนสดได้ตลอดวันเลือกตั้ง ทั้งที่หน้า /results ปิดผลอยู่
 * พิสูจน์แล้วบน container: showResult = false แต่ endpoint นี้คืน score = 137
 *
 * ไม่ได้แก้ด้วยการเช็ค `showResult` แล้วค่อยส่ง score เพราะหน้าเว็บฝั่งนี้
 * **ไม่มีที่ไหนใช้ score เลยสักจุด** (ไล่ดูครบทั้ง party/page.js, candidates/page.js,
 * useVoteSystem.js, FmsOfficialCandidates.js) คะแนนมีทางออกทางเดียวคือ /api/results
 * ซึ่งมีด่าน showResult ของมันเองอยู่แล้ว — ตัดออกจาก endpoint นี้ถาวรจึงตรงกว่า
 * และไม่ทิ้งสวิตช์ให้ใครเผลอเปิด
 *
 * ฟิลด์ด้านล่างคือทุกคอลัมน์ของ Candidate ยกเว้น score — พฤติกรรมอื่นเหมือนเดิมทุกอย่าง
 */
export async function GET() {
  try {
    const teams = await db.candidate.findMany({
      orderBy: { number: 'asc' },
      select: {
        id: true,
        name: true,
        number: true,
        slogan: true,
        logoUrl: true,
        color: true,
        groupImageUrls: true,
        officialImageUrl: true,
        mobileHeroImage: true,
        logoMeaning: true,
        missions: true,
        policies: true,
        socials: true,
        // score: ตั้งใจไม่เอา — ดูหมายเหตุด้านบน
        members: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return NextResponse.json(teams);

  } catch (error) {
    console.error("🔥 Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
