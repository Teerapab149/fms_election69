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

    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    const totalVoted = await db.user.count({
      where: { isVoted: true, year: { in: validYears } }
    });



    // Check System Status
    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = await db.systemConfig.create({ data: { id: 1, isVoteOpen: true, systemMode: "AUTO" } });
    }

    const { resolveElectionDates } = await import("../../../utils/electionConfig");
    const { ELECTION_START, ELECTION_END } = resolveElectionDates(config.globalConfig);
    const now = Date.now();
    const sysMode = config.systemMode || "AUTO";

    let isSystemOpen = false;
    let electionStatus = "WAITING";

    if (sysMode === "MANUAL_OPEN") {
      isSystemOpen = true;
      electionStatus = "ONGOING";
    } else if (sysMode === "PAUSE") {
      isSystemOpen = false;
      electionStatus = "CLOSED";
    } else if (sysMode === "ENDED") {
      isSystemOpen = false;
      electionStatus = "ENDED";
    } else {
      // AUTO
      if (now < ELECTION_START) {
        isSystemOpen = false;
        electionStatus = "WAITING";
      } else if (now >= ELECTION_END) {
        isSystemOpen = false;
        electionStatus = "ENDED";
      } else {
        isSystemOpen = true;
        electionStatus = "ONGOING";
      }
    }

    return NextResponse.json({
      candidates,
      stats: { totalEligible, totalVoted },
      isSystemOpen: isSystemOpen,
      systemMode: sysMode,
      electionStatus: electionStatus
    });

  } catch (error) {
    console.error("🔥 Error fetching home info:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}