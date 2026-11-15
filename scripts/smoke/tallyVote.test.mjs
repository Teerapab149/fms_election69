// tallyVoteTx (src/lib/ballotChain.js): one vote is added to the chosen
// candidate, and every Candidate row is written in the same statement so that
// a row's xmin cannot name the last voter of a candidate (SECURITY-AUDIT F5,
// line B). The real-database proof is scripts/audit/repro-db-01-voter-linkage.cjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { tallyVoteTx } = require('../../src/lib/ballotChain.js');

// A fake transaction that runs the tagged-template UPDATE against an in-memory
// table and records the SQL it was given.
function fakeTx(candidates) {
  const calls = [];
  return {
    calls,
    async $queryRaw(strings, ...values) {
      const sql = strings.join('?');
      calls.push({ sql, values });
      const chosenId = values[0];
      return candidates.map((c) => {
        if (c.id === chosenId) c.score += 1;
        return { chosen: c.id === chosenId };
      });
    },
  };
}

test('adds one to the chosen candidate only', async () => {
  const rows = [{ id: 1, score: 5 }, { id: 2, score: 7 }, { id: 3, score: 0 }];
  await tallyVoteTx(fakeTx(rows), 2);
  assert.deepEqual(rows.map((r) => r.score), [5, 8, 0]);
});

test('the UPDATE has no WHERE clause, so every Candidate row is written', async () => {
  const tx = fakeTx([{ id: 1, score: 0 }, { id: 2, score: 0 }]);
  await tallyVoteTx(tx, 1);
  assert.equal(tx.calls.length, 1);
  assert.match(tx.calls[0].sql, /UPDATE\s+"Candidate"/);
  assert.doesNotMatch(tx.calls[0].sql, /\bWHERE\b/i);
});

test('throws when the chosen candidate does not exist, so the vote rolls back', async () => {
  const tx = fakeTx([{ id: 1, score: 0 }, { id: 2, score: 0 }]);
  await assert.rejects(() => tallyVoteTx(tx, 99), /ต้องเป็น 1/);
});

test('the vote route and the seed use tallyVoteTx, not a one-row increment', async () => {
  const fs = await import('node:fs');
  for (const f of ['src/app/api/vote/route.js', 'prisma/seed.js', 'scripts/audit/lib/auditDb.cjs']) {
    const src = fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    assert.match(src, /tallyVoteTx\(tx,/, `${f} calls tallyVoteTx`);
    assert.doesNotMatch(src, /score:\s*\{\s*increment:\s*1\s*\}/, `${f} has no one-row score increment`);
  }
});
