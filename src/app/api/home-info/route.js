import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { readElectionState } from "../../../lib/election/liveStatus";

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

    // Mode + schedule → verdict, decided in one place (lib/election/systemStatus.mjs).
    // Computed here, inside the snapshot, so it lags by the same ≤8 s as turnout.
    const { systemMode: sysMode, isSystemOpen, electionStatus } = readElectionState(config);

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