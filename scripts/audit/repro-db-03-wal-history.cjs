// scripts/audit/repro-db-03-wal-history.cjs
//
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/repro-db-03-wal-history.cjs
//
// Needs a SUPERUSER connection and the pg_walinspect extension (ships with
// PostgreSQL 15+). Question: can a database superuser rebuild who chose what
// for EVERY voter, with no private key, from Postgres's own write-ahead log?
//
// Every vote updates one Candidate row (score + 1) in the same transaction that
// flags the voter. The WAL keeps one record per such update, stamped with the
// transaction id and the row slot that was updated. Following the Candidate
// rows from slot to slot gives  transaction id → candidate  for every vote;
// User.xmin gives  voter → transaction id  until certification re-stamps it.
const { db, reset, castVote, shuffle } = require("./lib/auditDb.cjs");

(async () => {
  const c = db();
  const { candidates, users } = await reset({ voters: Number(process.env.AUDIT_ROSTER || 600) });
  const TURNOUT = Number(process.env.AUDIT_TURNOUT || 250);
  try { await c.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_walinspect`); }
  catch (e) { console.log("pg_walinspect not available on this server — cannot run:", e.message.split("\n").pop()); process.exit(1); }

  // where each candidate row lives before the first vote
  const slot = new Map((await c.$queryRawUnsafe(`SELECT id, (ctid::text::point)[1]::int AS off FROM "Candidate"`)).map((r) => [r.off, r.id]));
  const [{ lsn: startLsn, node }] = await c.$queryRawUnsafe(`SELECT pg_current_wal_lsn()::text AS lsn, pg_relation_filenode('"Candidate"')::int AS node`);

  const voters = shuffle(users, 99).slice(0, TURNOUT);
  const truth = new Map();
  for (let i = 0; i < voters.length; i++) {
    const cand = candidates[(i * 5 + (i % 4)) % candidates.length].id;
    await castVote(voters[i].id, cand);
    truth.set(voters[i].id, cand);
  }

  // ── the attacker: WAL records that touched the Candidate table ──
  const recs = await c.$queryRawUnsafe(`
    SELECT xid::text AS xid, record_type, description
    FROM pg_get_wal_records_info('${startLsn}'::pg_lsn, pg_current_wal_lsn())
    WHERE resource_manager = 'Heap' AND record_type LIKE '%UPDATE%' AND block_ref LIKE '%/${node} %'
    ORDER BY start_lsn`);
  const choiceOfXid = new Map();
  let unparsed = 0;
  for (const r of recs) {
    const m = /old_off: (\d+).*new_off: (\d+)/.exec(r.description);
    if (!m) { unparsed++; continue; }
    const id = slot.get(Number(m[1]));
    if (id === undefined) { unparsed++; continue; }
    slot.delete(Number(m[1])); slot.set(Number(m[2]), id);
    choiceOfXid.set(r.xid, id);
  }
  const rows = await c.$queryRawUnsafe(`SELECT id, xmin::text AS xid FROM "User" WHERE "isVoted"`);
  let named = 0, right = 0;
  for (const u of rows) {
    const guess = choiceOfXid.get(u.xid);
    if (guess === undefined) continue;
    named++;
    if (guess === truth.get(u.id)) right++;
  }
  const names = new Map(candidates.map((x) => [x.id, x.name]));
  const sample = rows.slice(0, 3).map((u) => `user ${u.id} → ${names.get(choiceOfXid.get(u.xid))}`).join("; ");
  console.log(`votes cast: ${truth.size}; WAL update records on "Candidate": ${recs.length} (unparsed ${unparsed})`);
  console.log(`voters whose choice was read from WAL + User.xmin, no private key: ${named}/${truth.size}, correct: ${right}/${truth.size}`);
  console.log(`e.g. ${sample}`);

  // after the certification re-stamp the User side changes, the WAL does not
  await c.$executeRawUnsafe(`UPDATE "User" SET "votedAt" = "votedAt" WHERE "isVoted"`);
  const after = await c.$queryRawUnsafe(`SELECT id, xmin::text AS xid FROM "User" WHERE "isVoted"`);
  const stillNamed = after.filter((u) => choiceOfXid.has(u.xid)).length;
  const [{ n: userRecs }] = await c.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM pg_get_wal_records_info('${startLsn}'::pg_lsn, pg_current_wal_lsn())
    WHERE resource_manager = 'Heap' AND record_type LIKE '%UPDATE%' AND block_ref LIKE '%/' || pg_relation_filenode('"User"') || ' %'`);
  console.log(`after re-stamping the voters' rows (what certification does): ${stillNamed}/${truth.size} still named through User.xmin;`);
  console.log(`  the WAL still holds ${recs.length} per-vote Candidate records and ${userRecs} User-row update records (the voter side of each transaction).`);
  console.log(`  Rebuilding voter identity from those User records was NOT attempted here.`);
  await c.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
