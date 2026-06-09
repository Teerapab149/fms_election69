import { db } from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId"); // Optional

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

    let isVoted = false;

    if (studentId) {
      const user = await db.user.findUnique({
        where: { studentId: String(studentId) },
        select: { isVoted: true },
      });
      if (user) isVoted = user.isVoted;
    }

    return NextResponse.json({
      isVoted: isVoted,
      isSystemOpen: isSystemOpen,
      showResult: config.showResult,
      systemMode: sysMode,
      systemMode: sysMode,
      electionStatus: electionStatus,
      googleFormUrl: config.googleFormUrl || ""
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
