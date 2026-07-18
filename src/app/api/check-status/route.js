import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET(request) {
  try {
    // Check System Config First
    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = await db.systemConfig.create({ data: { id: 1, isVoteOpen: true, showResult: false } });
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
        isSystemOpen = false; // Voting page will redirect for now, which is expected behavior for 'restricted' pages
        electionStatus = "WAITING";
      } else if (now >= ELECTION_END) {
        isSystemOpen = false;
        electionStatus = "ENDED";
      } else {
        isSystemOpen = true;
        electionStatus = "ONGOING";
      }
    }

    // 🔐 isVoted + voter identity are personal — read them for the VERIFIED session
    // user only, never from a query param (which let anyone probe any student's
    // vote status). `voter` (v2-R4a success identity receipt) carries ONLY the
    // session user's own profile fields (name / studentId / major / year) plus
    // their own votedAt (their personal cast time — not ballot data). It NEVER
    // contains any vote choice: post v2-SEC there is no user→candidate link in
    // the schema at all. Unauthenticated requests get the public election status
    // with NO voter block (this endpoint is shared by pre-login pages).
    let isVoted = false;
    let voter = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.studentId) {
      const user = await db.user.findUnique({
        where: { studentId: String(session.user.studentId) },
        select: { isVoted: true, name: true, studentId: true, major: true, year: true, votedAt: true },
      });
      if (user) {
        isVoted = user.isVoted;
        voter = {
          name: user.name,
          studentId: user.studentId,
          major: user.major,
          year: user.year,
          votedAt: user.votedAt,
        };
      }
    }

    return NextResponse.json({
      isVoted: isVoted,
      isSystemOpen: isSystemOpen,
      showResult: config.showResult,
      systemMode: sysMode,
      electionStatus: electionStatus,
      googleFormUrl: config.googleFormUrl || "",
      ...(voter ? { voter } : {})
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
