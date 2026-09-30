import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

// Personal data: never stored by a browser, proxy or CDN.
const NO_STORE = { "Cache-Control": "private, no-store" };

// Answers "has the SIGNED-IN voter finished the evaluation form?" and nothing else.
// It used to take ?studentId= from the query with no auth, so anyone could probe any
// student ID (404 = not on the voter roll, 200 = on it + their form status). Same class
// of leak check-status already closed: the identity comes from the verified session
// only. Any ?studentId= is IGNORED — not compared, not echoed — so a mismatched param
// cannot be used as an oracle either.
// No cache of any kind here (module-level or keyed): one student's `true` must never
// become anyone else's answer. Computed per request from the session.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    }

    const user = await db.user.findUnique({
      where: { studentId: String(studentId) },
      select: { isFormCompleted: true },
    });

    // Only ever describes the caller's own account, so it leaks nothing.
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: NO_STORE });
    }

    return NextResponse.json({ isFormCompleted: user.isFormCompleted }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: NO_STORE });
  }
}
