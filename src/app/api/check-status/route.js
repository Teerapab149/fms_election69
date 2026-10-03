import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { readElectionState } from "../../../lib/election/liveStatus";
import { normalizeFormUrl } from "../../../lib/forms/formUrl.mjs";

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Check System Config First
    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = await db.systemConfig.create({ data: { id: 1, isVoteOpen: true, showResult: false } });
    }

    // Mode + schedule → verdict, decided in one place (lib/election/systemStatus.mjs)
    const { systemMode: sysMode, isSystemOpen, electionStatus } = readElectionState(config);

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
      // only a valid Google Forms link leaves the server; a legacy bad value reads as no form
      googleFormUrl: normalizeFormUrl(config.googleFormUrl) || "",
      ...(voter ? { voter } : {})
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
