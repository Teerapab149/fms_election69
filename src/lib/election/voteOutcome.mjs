// What a student is told after pressing confirm — pure, no imports, so node:test
// can load it directly (scripts/smoke/voteOutcome.test.mjs). The fetch, the
// timeouts and the re-check against /api/check-status live in
// src/hooks/useVoteSystem.js; this file only decides.
//
// The one rule every branch below serves: never tell a student "your vote was not
// recorded" unless the server said so. A timeout, a dropped connection or an HTML
// error page from the proxy can arrive AFTER the transaction committed, so those
// are "unclear" and the hook re-reads the truth before saying anything.

// /api/vote puts a stable `code` next to its Thai `error`. Branch on the code,
// never on the Thai, so copy can change without breaking this.
const CLOSED_CODES = new Set(["PAUSED", "ENDED", "AUTO_CLOSED", "NOT_STARTED", "CERTIFIED"]);
// the student can never vote from this account, so the ballot is a dead end
const BLOCKED_CODES = new Set(["INELIGIBLE", "USER_NOT_FOUND"]);
// the request was refused before anything was written; the server's own sentence
// says why, and the student goes back to the ballot
const NOTICE_CODES = new Set(["RATE_LIMITED", "BAD_REQUEST", "BAD_CHOICE", "NOT_READY"]);

function parseBody(bodyText) {
  if (typeof bodyText !== "string" || !bodyText.trim()) return null;
  try {
    const json = JSON.parse(bodyText);
    return json && typeof json === "object" && !Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

function serverMessage(json) {
  const m = json?.error;
  return typeof m === "string" && m.trim() ? m.trim() : null;
}

// → { kind, code, message }
//   kind: ok | unclear | voted | login | closed | blocked | notice | failed
//   message: the server's Thai sentence when it sent one, else null
export function classifyVoteResponse({ ok = false, status = 0, bodyText = "" } = {}) {
  const json = parseBody(bodyText);
  const code = typeof json?.code === "string" ? json.code : null;
  const message = serverMessage(json);

  // Success is the body saying so, not just a 2xx: a proxy or a half-read
  // response can hand back 200 with nothing we recognise.
  if (ok && json?.success === true) return { kind: "ok", code: null, message: null };

  // A known code wins over the status class: NOT_READY is a JSON 503 and SERVER
  // a JSON 500, both definite answers from our own handler, not a gateway guess.
  if (code === "ALREADY_VOTED") return { kind: "voted", code, message };
  if (code === "UNAUTHENTICATED") return { kind: "login", code, message };
  if (CLOSED_CODES.has(code)) return { kind: "closed", code, message };
  if (BLOCKED_CODES.has(code)) return { kind: "blocked", code, message };
  if (NOTICE_CODES.has(code)) return { kind: "notice", code, message };
  // The handler's catch. Usually the transaction rolled back whole, but a COMMIT
  // whose acknowledgement is lost (connection dropped at commit) throws after
  // the row is written and lands here too, so the hook re-checks this as well.
  if (code === "SERVER") return { kind: "failed", code, message };

  // No code we know. A 4xx with a JSON sentence is still a refusal from our
  // handler (an older build, say), made before any write.
  if (!ok && status === 401) return { kind: "login", code, message };
  if (!ok && status >= 400 && status < 500 && message) return { kind: "notice", code, message };

  // Everything else — 2xx without success, any 5xx without our code, HTML,
  // an empty body — could have landed. Re-check before saying anything.
  return { kind: "unclear", code, message: null };
}

// After an unclear or SERVER answer the hook re-reads /api/check-status.
//   failed        → the re-check itself did not come back (timeout, offline, 5xx)
//   statusData    → its JSON
//   serverFailed  → the vote itself was answered SERVER (not merely unclear)
// → { kind: ok | login | failed | unclear-retry | unknown }
export function classifyRecheck({ statusData = null, failed = false, serverFailed = false } = {}) {
  if (failed || !statusData || typeof statusData !== "object") return { kind: "unknown" };
  // isVoted:false means something only when it is about a signed-in student:
  // check-status answers signed-out requests too, with no `voter` block and
  // isVoted:false, which says nothing about this ballot.
  if (statusData.isVoted === true) return { kind: "ok" };
  if (!statusData.voter) return { kind: "login" };
  // "not recorded" needs both: the server said it failed AND the database now
  // says this student has not voted. Unclear + not voted stays neutral.
  return { kind: serverFailed ? "failed" : "unclear-retry" };
}

// Copy for each outcome. `resubmit` means the primary button sends the same
// ballot again (safe: the server counts one per student); `dismissLabel` is the
// only way back to the ballot without acting, and only kinds where the ballot is
// still live get one.
const COPY = {
  failed: {
    kind: "retry",
    title: "บันทึกคะแนนไม่สำเร็จ",
    message: "คะแนนของคุณยังไม่ถูกบันทึก ลองกดยืนยันอีกครั้งได้",
    actionLabel: "ยืนยันอีกครั้ง", actionHint: "Try again",
    dismissLabel: "ปิด", dismissHint: "Close",
  },
  "unclear-retry": {
    kind: "retry",
    title: "ยังไม่ได้รับการยืนยัน",
    message: "ระบบยังไม่ยืนยันการบันทึกคะแนน กดยืนยันอีกครั้งได้ ระบบนับให้เพียงครั้งเดียว",
    actionLabel: "ยืนยันอีกครั้ง", actionHint: "Try again",
    dismissLabel: "ปิด", dismissHint: "Close",
  },
  unknown: {
    kind: "unknown",
    title: "ยังตรวจสอบไม่ได้",
    message: "ยังตรวจไม่ได้ว่าบันทึกคะแนนแล้วหรือไม่ กรุณาโหลดหน้านี้ใหม่ ถ้าลงคะแนนแล้ว ระบบจะพาไปหน้ายืนยันเอง",
    actionLabel: "โหลดหน้านี้ใหม่", actionHint: "Reload",
  },
  voted: {
    kind: "voted",
    title: "คุณใช้สิทธิ์ไปแล้ว",
    message: "บัตรที่ส่งไว้ก่อนหน้านี้คือบัตรที่ถูกนับ",
    actionLabel: "ไปหน้ายืนยันการใช้สิทธิ์", actionHint: "Your confirmation",
  },
  login: {
    kind: "login",
    title: "กรุณาเข้าสู่ระบบอีกครั้ง",
    // no "not recorded" here: after an unclear answer we reach this without
    // knowing, and the vote gate sends an already-voted student to /success
    message: "การเข้าสู่ระบบหมดอายุแล้ว เข้าสู่ระบบใหม่แล้วกลับมาลงคะแนน ถ้าลงคะแนนไปแล้ว ระบบจะพาไปหน้ายืนยันเอง",
    actionLabel: "เข้าสู่ระบบอีกครั้ง", actionHint: "Sign in",
  },
  closed: {
    kind: "closed",
    title: "ลงคะแนนไม่ได้ในขณะนี้",
    message: "ระบบไม่รับลงคะแนนในขณะนี้",
    actionLabel: "ดูสถานะการเลือกตั้ง", actionHint: "Election status",
  },
  blocked: {
    kind: "blocked",
    title: "ลงคะแนนจากบัญชีนี้ไม่ได้",
    message: "บัญชีนี้ไม่มีสิทธิ์ลงคะแนน กรุณาติดต่อผู้ดูแลระบบ",
    actionLabel: "กลับหน้าแรก", actionHint: "Home",
  },
  notice: {
    kind: "notice",
    title: "ลงคะแนนไม่สำเร็จ",
    message: "ลงคะแนนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    actionLabel: "ตกลง", actionHint: "OK",
  },
};

// Outcome (from either classifier) → the object the vote page renders, or null
// for "ok". The server's own sentence replaces the default where it has a
// better one; the kinds whose copy is fixed (retry, unknown, voted, login) keep
// ours, because theirs is about the situation, not the reason.
export function voteErrorFor(outcome) {
  const key = outcome?.kind;
  if (!key || key === "ok") return null;
  // "unclear" should have been re-checked first; if not, say the careful thing
  const base = COPY[key] || (key === "unclear" ? COPY.unknown : COPY.notice);
  const useServer = ["closed", "blocked", "notice"].includes(base.kind) && outcome.message;
  return {
    kind: base.kind,
    title: base.title,
    message: useServer ? outcome.message : base.message,
    actionLabel: base.actionLabel,
    actionHint: base.actionHint,
    dismissLabel: base.dismissLabel || null,
    dismissHint: base.dismissHint || null,
  };
}
