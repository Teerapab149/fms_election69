// Reconcile Candidate.score against the actual ballots (User.candidateId).
//
//   node scripts/reconcile-scores.js          # report drift, change nothing
//   node scripts/reconcile-scores.js --fix    # write the ballot counts into score
//
// score is the tally the results API serves; ballots are the ground truth while
// they exist (User.candidateId is wiped at anonymize — after that the frozen
// score IS the record, so this script refuses to touch an anonymized DB).
//
// Run the report as part of certification, BEFORE flipping showResult on:
// drift here means a code path changed ballots without maintaining score
// (or test/seed data wrote one side only) — investigate before publishing.
//
// Counting rule matches ANONYMIZE_BALLOTS freeze (api/admin/dashboard):
// ballots from year ปี 1-4 students. Ballots held by users OUTSIDE those years
// can't be counted but also shouldn't exist (the vote API enforces eligibility)
// — they're reported as anomalies to investigate, never silently dropped.

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const VALID_YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

async function main() {
  const fix = process.argv.includes("--fix");

  const cfg = await db.systemConfig.findFirst({ where: { id: 1 } });
  if (cfg?.globalConfig?.ballotsAnonymized === true) {
    console.error(
      "REFUSED: ballots are anonymized (candidateId wiped) — the frozen score column is the only tally left; reconciling against empty ballots would zero it."
    );
    process.exitCode = 1;
    return;
  }

  const candidates = await db.candidate.findMany({
    select: {
      id: true, name: true, number: true, score: true,
      _count: { select: { voters: { where: { year: { in: VALID_YEARS } } } } },
    },
    orderBy: { number: "asc" },
  });

  const strayBallots = await db.user.findMany({
    where: { candidateId: { not: null }, NOT: { year: { in: VALID_YEARS } } },
    select: { studentId: true, year: true, candidateId: true },
  });

  let driftCount = 0;
  console.log("number | name | score(column) | ballots | status");
  for (const c of candidates) {
    const ballots = c._count.voters;
    const drifted = c.score !== ballots;
    if (drifted) driftCount++;
    console.log(
      `${String(c.number).padStart(6)} | ${c.name} | ${c.score} | ${ballots} | ${drifted ? "DRIFT" : "ok"}`
    );
    if (drifted && fix) {
      await db.candidate.update({ where: { id: c.id }, data: { score: ballots } });
      console.log(`         → fixed: score ${c.score} → ${ballots}`);
    }
  }

  if (strayBallots.length > 0) {
    console.warn(`\n⚠️ ANOMALY: ${strayBallots.length} ballot(s) held by non-ปี1-4 users (not counted, not touched — investigate):`);
    for (const u of strayBallots) console.warn(`   studentId=${u.studentId} year=${u.year} candidateId=${u.candidateId}`);
  }

  console.log(
    driftCount === 0
      ? "\n✅ no drift — score column matches ballots."
      : fix
        ? `\n✅ ${driftCount} candidate(s) reconciled.`
        : `\n❌ ${driftCount} candidate(s) drifted. Re-run with --fix to write ballot counts into score.`
  );
  if (driftCount > 0 && !fix) process.exitCode = 2;
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
