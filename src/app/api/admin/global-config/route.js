import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard, requireAdmin } from "../../../../lib/auth/adminCheck";
import { bustResultsSnap } from "../../../../lib/election/resultsCache.mjs";
import { checkScheduleChange } from "../../../../lib/election/adminGuards.mjs";
import { parseBangkok, resolveElectionDates } from "../../../../utils/electionConfig";

// A refused schedule change, thrown out of the transaction so it rolls back
// (same shape as the one in api/admin/dashboard, which is not exported).
class GuardError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}

// The voting window as stored. campaignStartAt is left out on purpose: it only
// decides when the candidate list goes public, never whether the box is open.
const SCHEDULE_KEYS = ["electionStartAt", "electionEndAt"];

// 📋 Audit trail for schedule changes, like the dashboard's mode/reveal rows —
// moving the dates under AUTO opens or closes the box, so who did it and
// whether it went through is worth the same record. Best-effort: a failed log
// never fails or changes the save.
async function logScheduleChange(auth, change, result, error) {
  if (!change) return;
  try {
    await db.adminAuditLog.create({
      data: {
        action: "SET_SCHEDULE",
        actor: auth.user?.studentId || (auth.user?.id != null ? String(auth.user.id) : null),
        detail: JSON.stringify({ ...change, result, ...(error ? { error } : {}) }),
      },
    });
  } catch (e) {
    console.error("[audit] failed to log schedule change:", e.message);
  }
}

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

// GET — admin only (form needs auth to load current values)
export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  try {
    const config = await db.systemConfig.findFirst({ where: { id: 1 } });
    // Bridge the googleFormUrl COLUMN into the returned config object so the
    // general-settings form can render/edit it, while success/page.js,
    // check-status, readiness + dashboard keep reading the column directly.
    const globalConfig = {
      ...(config?.globalConfig ?? {}),
      googleFormUrl: config?.googleFormUrl ?? "",
    };
    return NextResponse.json({ globalConfig });
  } catch (error) {
    console.error("global-config GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT — admin only
export async function PUT(request) {
  // requireAdmin rather than adminGuard: the audit row needs to know who. A
  // revoked caller still gets the stale cookie cleared, as adminGuard does.
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    const res = NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.revoked) res.cookies.delete("admin_token");
    return res;
  }

  try {
    const body = await request.json();
    const { globalConfig } = body;

    if (typeof globalConfig !== "object" || globalConfig === null) {
      return NextResponse.json({ error: "globalConfig must be an object" }, { status: 400 });
    }

    // googleFormUrl lives in its own COLUMN (readers depend on it there); split
    // it out of the JSON blob. Only write the column when the client actually
    // sent the key, so an older client that omits it never wipes the value.
    const { googleFormUrl, ...rest } = globalConfig;

    // คีย์การรับรองผลไม่ใช่ของ endpoint นี้ — ปฏิเสธทิ้งไปเลย
    //
    // การรับรองผลถูกออกแบบไว้ว่าทำได้เฉพาะบัญชีเจ้าหน้าที่คณะ (role === "STAFF")
    // และทำได้หลังปิดหีบ+ประกาศผลแล้วเท่านั้น แล้วห้ามย้อน — ทั้งหมดอยู่ใน
    // /api/admin/dashboard (route.js:165-196) แต่ endpoint นี้ผ่านแค่ adminGuard
    // คือกรรมการสโมฯ คนไหนก็เรียกได้ ถ้าปล่อยให้เขียนคีย์พวกนี้ได้ กรรมการจะ
    // เซ็นรับรองผลของตัวเองได้โดยไม่ต้องเป็นเจ้าหน้าที่ ซึ่งคือ conflict of interest
    // ที่ด่าน STAFF ตั้งขึ้นมากันพอดี
    //
    // `ballotsAnonymized` ยังเป็นด่านที่ /api/vote (route.js:59) ใช้ปฏิเสธคะแนนหลัง
    // รับรองผลแล้ว การล้างค่านี้ทิ้งจึงเท่ากับ "เปิดหีบที่ปิดไปแล้ว" กลับมาอีกครั้ง
    const CERTIFICATION_KEYS = ["ballotsAnonymized", "certifiedAt", "certifiedBy", "certifiedByUsername"];
    const attempted = CERTIFICATION_KEYS.filter((k) => k in rest);
    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `แก้ค่าการรับรองผลที่นี่ไม่ได้ (${attempted.join(", ")}) — การรับรองผลทำได้เฉพาะบัญชีเจ้าหน้าที่คณะผ่านหน้าแดชบอร์ด` },
        { status: 403 }
      );
    }

    // ผสานทับของเดิม ไม่ใช่เขียนทับทั้งก้อน
    //
    // ของเดิมเขียน `globalConfig: rest` ตรง ๆ ซึ่งแทนที่ JSON ทั้งอัน คีย์ไหนที่ client
    // ไม่ได้ส่งมาก็หายทันที ฟอร์มตั้งค่าทั่วไปส่งมาเฉพาะฟิลด์ของตัวเอง เพราะงั้นแค่กด
    // "บันทึก" ครั้งเดียวหลังรับรองผล ก็ลบลายเซ็นรับรองทิ้งทั้งชุดโดยไม่มีใครตั้งใจ
    // และปลดล็อกให้ /api/vote รับคะแนนได้อีก
    //
    // Read, check and write under the same row lock the dashboard takes for
    // SET_MODE / SET_SHOW_RESULT: the schedule is checked against the mode and
    // showResult, so "publish" pressed in another tab must not slip in between
    // this read and this write. Every save takes the lock — both admin clients
    // send the whole config each time, so "did the dates change" can only be
    // answered from the locked row.
    let change = null;   // set once the election dates are being moved; audited below
    let updated;
    try {
      updated = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "SystemConfig" WHERE id = 1 FOR UPDATE`;
        const current = await tx.systemConfig.findUnique({ where: { id: 1 } });
        const prevConfig = current?.globalConfig ?? {};
        const merged = { ...prevConfig, ...rest };

        // resolveElectionDates quietly falls back to the built-in defaults on a
        // value it cannot read, so a typo would silently move the election to
        // last year's dates. Refuse it instead — but only a value that is new,
        // or a stored bad value would block saving every other field.
        const unreadable = SCHEDULE_KEYS.filter((k) => {
          const v = merged[k];
          if (v === prevConfig[k] || v === undefined || v === null) return false;
          return typeof v !== "string" || (v.trim() !== "" && parseBangkok(v) === null);
        });
        if (unreadable.length > 0) {
          change = { raw: Object.fromEntries(unreadable.map((k) => [k, merged[k]])) };
          throw new GuardError("อ่านวันเวลาเปิดหีบหรือปิดหีบไม่ออก — เลือกวันเวลาใหม่จากช่องในฟอร์ม", 400);
        }

        // Compare the RESOLVED instants, not the raw strings: "2026-02-06T08:30"
        // and "2026-02-06T08:30:00" are the same time and must not count as a move.
        const prev = resolveElectionDates(prevConfig);
        const next = resolveElectionDates(merged);
        if (prev.ELECTION_START.getTime() !== next.ELECTION_START.getTime()
          || prev.ELECTION_END.getTime() !== next.ELECTION_END.getTime()) {
          change = {
            from: { start: prev.ELECTION_START.toISOString(), end: prev.ELECTION_END.toISOString() },
            to: { start: next.ELECTION_START.toISOString(), end: next.ELECTION_END.toISOString() },
          };
          const err = checkScheduleChange({
            systemMode: current?.systemMode || "AUTO",
            showResult: !!current?.showResult,
            certified: !!prevConfig.ballotsAnonymized,
            prevStart: prev.ELECTION_START,
            prevEnd: prev.ELECTION_END,
            nextStart: next.ELECTION_START,
            nextEnd: next.ELECTION_END,
          });
          if (err) throw new GuardError(err);
        }

        const data = { globalConfig: merged };
        if (googleFormUrl !== undefined) data.googleFormUrl = googleFormUrl;
        return tx.systemConfig.upsert({
          where: { id: 1 },
          create: { id: 1, ...data },
          update: data,
        });
      });
    } catch (e) {
      if (!(e instanceof GuardError)) throw e;
      await logScheduleChange(auth, change, `refused ${e.status}`, e.message);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }

    // The dates decide /api/results' status, and it serves a short public
    // snapshot — drop it so a schedule change shows on the next poll.
    bustResultsSnap();
    await logScheduleChange(auth, change, "ok");

    return NextResponse.json({
      success: true,
      globalConfig: {
        ...(updated.globalConfig ?? {}),
        googleFormUrl: updated.googleFormUrl ?? "",
      },
    });
  } catch (error) {
    console.error("global-config PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
