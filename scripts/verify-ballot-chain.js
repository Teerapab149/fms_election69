// scripts/verify-ballot-chain.js, tamper-evidence audit for the ballot box.
//
//   node scripts/verify-ballot-chain.js
//
// Recomputes the whole HMAC chain (GENESIS to head), cross-checks the stored
// ChainHead, and reconciles ballot count against sum(Candidate.score) and the
// isVoted turnout flag. Prints PASS/FAIL per check.
//
// After the result is certified it also compares the live database with the
// numbers pinned at certification (per-party score, ballot count, chain head,
// SystemConfig.globalConfig.certifiedTally and friends) and says plainly which
// of them no longer match. Compare the pinned numbers with the copy staff kept
// outside the system as well: a database edited by hand could be edited to agree
// with itself, but not with a copy on paper.
//
// Exit code 0 = all pass, 2 = something drifted, was tampered, or changed after
// certification, 1 = the script could not run. Run it as part of certification,
// BEFORE flipping showResult on, and again any time later.
//
// With --heads <file> (or CHAIN_HEAD_LOG=<file>) it also checks the box against
// the chain heads exported earlier by scripts/export-chain-head.js and kept off
// the database server: every exported (seq, head) must still be in the chain.
// That is the only check that notices ballots removed from the END of the box,
// or an older backup restored over a newer box (audit finding F3). Give it the
// copy that was kept on the other machine, not a file on this one.
//
//   node scripts/verify-ballot-chain.js --heads /path/to/chain-head.log
//
// Requires BALLOT_CHAIN_SECRET (server secret) in env / .env.

const { loadEnv } = require("./lib/loadEnv");
loadEnv();

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const { verifyChain, checkExportedHeads } = require("./lib/chainVerify");
const { compareToCertified } = require("../src/lib/certificationRecord");

const db = new PrismaClient();

async function main() {
  const secret = process.env.BALLOT_CHAIN_SECRET;
  if (!secret) {
    console.error("REFUSED: BALLOT_CHAIN_SECRET not set, cannot verify the chain.");
    process.exitCode = 1;
    return;
  }

  const { checks, ok, counts, head } = await verifyChain(db, secret);

  console.log("Ballot chain verification");
  console.log("-------------------------");
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name.padEnd(16)} ${c.detail}`);
  }
  console.log("-------------------------");
  console.log(`ballots=${counts.ballots}  sum(score)=${counts.scoreSum}  voted=${counts.voted}`);

  // Certified record: live database against the numbers pinned at certification.
  const cfg = await db.systemConfig.findUnique({ where: { id: 1 }, select: { globalConfig: true } });
  const candidates = await db.candidate.findMany({
    select: { number: true, name: true, score: true },
    orderBy: { number: "asc" },
  });
  const cert = compareToCertified(cfg?.globalConfig, { candidates, ballots: counts.ballots, head: head.head });

  console.log("\nCertified record");
  console.log("----------------");
  let certOk = true;
  if (cert.state === "none") {
    console.log("ยังไม่ได้รับรองผล จึงยังไม่มีค่าให้เทียบ");
  } else if (cert.state === "legacy") {
    console.log("รับรองผลไว้ก่อนที่ระบบจะบันทึกตัวเลขตอนรับรอง จึงไม่มีค่าให้เทียบ ตรวจได้เฉพาะความสอดคล้องภายในด้านบน");
  } else if (cert.state === "match") {
    console.log("PASS  ตัวเลขปัจจุบันตรงกับที่รับรองไว้ทุกค่า (คะแนนรายพรรค จำนวนบัตร ปลายโซ่)");
  } else {
    certOk = false;
    console.log("FAIL  ตัวเลขปัจจุบันไม่ตรงกับที่รับรองไว้ ผลในฐานข้อมูลถูกแก้หลังรับรอง หรือค่าที่รับรองไว้ถูกแก้");
    for (const line of cert.differences) console.log(`      ${line}`);
  }

  // Exported heads: the box against the copy kept outside the database.
  const argv = process.argv.slice(2);
  const hi = argv.indexOf("--heads");
  const headsFile = (hi !== -1 && argv[hi + 1]) || process.env.CHAIN_HEAD_LOG || null;
  let headsOk = true;
  console.log("");
  console.log("Exported chain heads");
  console.log("--------------------");
  if (!headsFile) {
    console.log("ไม่ได้ระบุไฟล์ปลายโซ่ที่ export ไว้ (--heads <ไฟล์>) จึงไม่ได้ตรวจว่าบัตรท้ายหีบหายหรือไม่");
  } else {
    let text = null;
    try { text = fs.readFileSync(headsFile, "utf8"); } catch (e) {
      headsOk = false;
      console.log(`FAIL  อ่านไฟล์ ${headsFile} ไม่ได้: ${e.message}`);
    }
    if (text !== null) {
      const ballots = await db.ballot.findMany({ select: { seq: true, rowHash: true } });
      const r = checkExportedHeads(text, ballots);
      headsOk = r.ok && r.checked > 0;
      if (r.checked === 0) console.log("FAIL  ไฟล์ไม่มีบรรทัดปลายโซ่ที่อ่านได้เลย");
      else if (r.ok) console.log(`PASS  ปลายโซ่ที่ export ไว้ ${r.checked} บรรทัดยังอยู่ในโซ่ปัจจุบันครบ (ล่าสุด ${r.latest.at} ลำดับที่ ${r.latest.seq})`);
      else console.log(`FAIL  ปลายโซ่ที่ export ไว้ไม่ตรงกับหีบปัจจุบัน ${r.problems.length} จุด`);
      for (const p of r.problems.slice(0, 20)) console.log(`      ${p}`);
    }
  }

  const allOk = ok && certOk && headsOk;
  console.log(allOk
    ? "\nCHAIN OK: no tampering or drift detected."
    : "\nVERIFICATION FAILED: see the FAIL line(s) above.");

  if (!allOk) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
