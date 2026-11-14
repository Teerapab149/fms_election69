// scripts/audit/repro-db-02-real-tools-on-tampered-db.cjs
//
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/repro-db-02-real-tools-on-tampered-db.cjs
//
// repro-01 showed the verifier LOGIC misses three kinds of change. This runs the
// project's real command-line tools — the ones the checklist tells IT staff to
// run before results are announced and certified — against a real Postgres that
// has been altered, and records their exit codes:
//
//   scripts/verify-ballot-chain.js   scripts/reconcile-scores.js   (expected 0 = "PASS")
//   scripts/decrypt-recount.js       (needs the offline private key)
//
// Also checks concurrency on a real database: 25 simultaneous vote transactions
// for ONE voter, and 120 voters at once.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { db, reset, castVote, shuffle, loadState, auditUrl } = require("./lib/auditDb.cjs");

const state = loadState();
const keyFile = path.join(os.tmpdir(), `fms-audit-private-${process.pid}.pem`);
fs.writeFileSync(keyFile, state.privateKey, { mode: 0o600 });
const headsFile = path.join(os.tmpdir(), `fms-audit-chain-head-${process.pid}.log`);

function tool(script, args = []) {
  const r = spawnSync(process.execPath, [path.join("scripts", script), ...args], {
    env: { ...process.env, DATABASE_URL: auditUrl(), BALLOT_CHAIN_SECRET: state.chainSecret },
    encoding: "utf8",
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function runTools(label) {
  const v = tool("verify-ballot-chain.js");
  const r = tool("reconcile-scores.js");
  const d = tool("decrypt-recount.js", ["--key", keyFile]);
  console.log(`\n── ${label}`);
  console.log(`  verify-ballot-chain.js  exit=${v.code}   ${v.out.split("\n").filter((l) => /CHAIN OK|VERIFICATION FAILED/.test(l)).join(" ").trim()}`);
  console.log(`  reconcile-scores.js     exit=${r.code}   ${r.out.split("\n").filter((l) => /reconciled|mismatch/.test(l)).join(" ").trim()}`);
  console.log(`  decrypt-recount.js      exit=${d.code}   ${d.out.split("\n").filter((l) => /recount matches|drifted/.test(l)).join(" ").trim()}`);
  for (const l of d.out.split("\n").filter((x) => /\|\s*(ok|DRIFT)\s*$/.test(x))) console.log(`      ${l.trim()}`);
  // the same verifier, given the chain head that was exported while the box was honest
  let h = null;
  if (fs.existsSync(headsFile)) {
    const vh = tool("verify-ballot-chain.js", ["--heads", headsFile]);
    h = vh.code;
    console.log(`  verify --heads <exported>  exit=${vh.code}   ${vh.out.split("\n").filter((l) => /ปลายโซ่ที่ export|หายไป|เขียนใหม่/.test(l)).map((l) => l.trim()).join(" | ")}`);
  }
  return { v: v.code, r: r.code, d: d.code, h };
}

async function honest() {
  const { candidates, users } = await reset({ voters: 100 });
  const [abst, A, B] = candidates;       // ordered by number: 0, 1, 2
  const plan = shuffle([...Array(35).fill(A.id), ...Array(20).fill(B.id), ...Array(5).fill(abst.id)], 7);
  for (let i = 0; i < plan.length; i++) await castVote(users[i].id, plan[i]);
  // what the cron job on the real server does: export the chain head off the box
  fs.writeFileSync(headsFile, tool("export-chain-head.js").out);
  return { A, B, abst, users };
}

(async () => {
  const c = db();
  const res = {};

  // ── concurrency on a real database ─────────────────────────────────────────
  {
    const { candidates, users } = await reset({ voters: 130 });
    const cid = candidates[1].id;
    const same = await Promise.all(Array.from({ length: 25 }, () => castVote(users[0].id, cid).catch((e) => `ERR ${e.code || e.message}`)));
    const ok = same.filter((x) => x === "OK").length;
    console.log(`one voter, 25 simultaneous vote transactions → OK=${ok}  ALREADY_VOTED=${same.filter((x) => x === "ALREADY_VOTED").length}  errors=${same.filter((x) => String(x).startsWith("ERR")).length}`);
    const many = await Promise.all(users.slice(1, 121).map((u, i) => castVote(u.id, candidates[i % 3].id).catch((e) => `ERR ${e.code || e.message}`)));
    console.log(`120 voters at once → OK=${many.filter((x) => x === "OK").length}  errors=${many.filter((x) => String(x).startsWith("ERR")).length}`);
    const counts = { ballots: await c.ballot.count(), voted: await c.user.count({ where: { isVoted: true } }), score: (await c.candidate.aggregate({ _sum: { score: true } }))._sum.score };
    console.log(`  ballots=${counts.ballots} voted=${counts.voted} sum(score)=${counts.score}`);
    res.conc = runTools("after the concurrency run (expected: everything passes)");
    res.concOk = ok === 1;
  }

  // ── 0 honest ───────────────────────────────────────────────────────────────
  await honest();
  res.honest = runTools("0 honest election: A=35 B=20 abstain=5");

  // ── 1 move 20 votes A→B with two UPDATEs ───────────────────────────────────
  {
    const { A, B } = await honest();
    await c.$executeRaw`UPDATE "Candidate" SET score = score - 20 WHERE id = ${A.id}`;
    await c.$executeRaw`UPDATE "Candidate" SET score = score + 20 WHERE id = ${B.id}`;
    res.shift = runTools("1 UPDATE Candidate: A-20, B+20  (announced winner flips to B, 40 to 15)");
  }

  // ── 2 tail truncation, no chain secret ─────────────────────────────────────
  {
    const { A } = await honest();
    await c.$transaction([
      c.$executeRaw`DELETE FROM "Ballot" WHERE seq > 50`,
      c.$executeRaw`UPDATE "ChainHead" SET head = (SELECT "rowHash" FROM "Ballot" WHERE seq = 50), seq = 50 WHERE id = 1`,
      c.$executeRaw`UPDATE "Candidate" SET score = score - 10 WHERE id = ${A.id}`,
      c.$executeRaw`UPDATE "User" SET "isVoted" = false, "votedAt" = NULL WHERE id IN (SELECT id FROM "User" WHERE "isVoted" ORDER BY id DESC LIMIT 10)`,
    ]);
    res.trunc = runTools("2 DELETE last 10 ballots + reset ChainHead to ballot #50 + A-10 + un-flag 10 voters (no secret used)");
  }

  console.log("\nsummary (exit code 0 = the tool reports nothing wrong)");
  console.log(`  double-vote blocked at DB level : ${res.concOk}`);
  console.log(`  honest          verify=${res.honest.v} reconcile=${res.honest.r} recount=${res.honest.d}`);
  console.log(`  score shift     verify=${res.shift.v} reconcile=${res.shift.r} recount=${res.shift.d}`);
  console.log(`  tail truncation verify=${res.trunc.v} reconcile=${res.trunc.r} recount=${res.trunc.d}`);
  console.log(`  with --heads    honest=${res.honest.h} score shift=${res.shift.h} tail truncation=${res.trunc.h}`);
  fs.unlinkSync(keyFile);
  try { fs.unlinkSync(headsFile); } catch {}
  await c.$disconnect();
})().catch((e) => { console.error(e); try { fs.unlinkSync(keyFile); } catch {} process.exit(1); });
