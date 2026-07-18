import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

// v2-R10 micro-cache — home-info is the read every visitor hammers at poll
// opening (load test 2026-07-18: 300 concurrent → home SSR p95 4.3s with this
// route on its critical path). One in-process snapshot, TTL 8s: turnout/status
// may lag ≤8s, which the UI already tolerates — the client countdown runs
// locally and the actual vote gate is /api/check-status + /api/vote (uncached).
const SNAP_TTL_MS = 8000;
let snap = { at: 0, body: null };

export async function GET() {
  try {
    if (snap.body && Date.now() - snap.at < SNAP_TTL_MS) {
      return NextResponse.json(snap.body);
    }
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

    const body = {
      candidates,
      stats: { totalEligible, totalVoted },
      isSystemOpen: isSystemOpen,
      systemMode: sysMode,
      electionStatus: electionStatus
    };
    snap = { at: Date.now(), body };
    return NextResponse.json(body);

  } catch (error) {
    console.error("🔥 Error fetching home info:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}