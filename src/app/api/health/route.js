import { db } from "../../../lib/db";
import { NextResponse } from "next/server";

// Liveness probe for election-day monitoring (uptime checker / cron / curl).
// Public on purpose — it must work when everything else is broken — so it
// reveals nothing beyond up/down: no counts, no config, no error details.
//   200 {"ok":true,"db":true}   app + DB reachable
//   503 {"ok":false,"db":false} app up, DB unreachable
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (err) {
    console.error("[health] DB check failed:", err?.message || err);
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
