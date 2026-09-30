// deriveElectionStatus — the one source v2 templates read status, action and
// countdown from. Each case below was a real on-screen contradiction in a v1
// template (2026-09-29 audit); see the header of src/hooks/useElectionStatus.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveElectionStatus as derive } from '../../src/lib/election/electionStatus.mjs';

const start = new Date('2027-02-09T00:00:00Z');
const end = new Date('2027-02-09T15:00:00Z');
const before = start.getTime() - 3600e3;
const during = start.getTime() + 3600e3;
const after = end.getTime() + 3600e3;

const cases = [
  ['AUTO before the polls open', { systemMode: 'AUTO', isSystemOpen: false, electionStatus: 'WAITING', now: before }, 'before', 'wait', 'opens'],
  ['AUTO open, signed out', { systemMode: 'AUTO', isSystemOpen: true, electionStatus: 'ONGOING', now: during }, 'open', 'signin', 'closes'],
  ['AUTO open, already voted', { systemMode: 'AUTO', isSystemOpen: true, signedIn: true, isVoted: true, now: during }, 'open', 'voted', 'closes'],
  // v1 voteCTA resolver called this "closed" = "not open yet, come back later"
  ['AUTO after the end is ended, not "not open yet"', { systemMode: 'AUTO', isSystemOpen: false, electionStatus: 'ENDED', now: after }, 'ended', 'results', null],
  // v1 FMS Official: countdown said closed while the button said vote
  ['MANUAL_OPEN past the scheduled end stays open, no countdown', { systemMode: 'MANUAL_OPEN', isSystemOpen: true, signedIn: true, now: after }, 'open', 'vote', null],
  ['PAUSE', { systemMode: 'PAUSE', isSystemOpen: false, now: during }, 'paused', 'paused', null],
  // v1 Original counted 345 days towards next year once closed
  ['ENDED never counts towards next year', { systemMode: 'ENDED', isSystemOpen: false, now: during }, 'ended', 'results', null],
];

for (const [name, input, phase, action, kind] of cases) {
  test(name, () => {
    const r = derive({ start, end, ...input });
    assert.equal(r.phase, phase);
    assert.equal(r.action, action);
    assert.equal(r.target?.kind ?? null, kind);
  });
}

// ── voteCtaState: one ladder for the v1 button's text AND its click ──
import { voteCtaState } from '../../src/lib/election/electionStatus.mjs';
import { liveSystemStatus } from '../../src/lib/election/systemStatus.mjs';

test('voteCtaState: every case the live page can produce (fed by liveSystemStatus)', () => {
  const H = 3600e3, now = Date.UTC(2027, 1, 6, 5);
  const around = { before: [now + 5 * H, now + 10 * H], open: [now - H, now + H], after: [now - 10 * H, now - 5 * H] };
  const cases = [
    // [label, mode, window, signedIn, isVoted, expected]
    ['A AUTO before (sign-in stays, on purpose)', 'AUTO', 'before', false, false, 'login'],
    ['B AUTO open, signed out', 'AUTO', 'open', false, false, 'login'],
    ['B AUTO open, signed in', 'AUTO', 'open', true, false, 'notVoted'],
    ['B AUTO open, voted', 'AUTO', 'open', true, true, 'voted'],
    ['C AUTO after', 'AUTO', 'after', true, false, 'ended'],
    ['D forced open early', 'MANUAL_OPEN', 'before', false, false, 'login'],
    ['E forced open late', 'MANUAL_OPEN', 'after', true, false, 'notVoted'],
    ['F paused', 'PAUSE', 'open', true, false, 'paused'],
    ['G forced ended', 'ENDED', 'open', true, false, 'ended'],
  ];
  for (const [label, systemMode, w, signedIn, isVoted, want] of cases) {
    const [start, end] = around[w];
    const s = liveSystemStatus({ systemMode, start, end, now });
    assert.equal(voteCtaState({ systemMode, ...s, signedIn, isVoted }), want, label);
  }
});

test('AUTO: a page left open moves forward with the clock, never backward', () => {
  const start = new Date('2027-02-06T08:30:00+07:00'), end = new Date('2027-02-06T17:00:00+07:00');
  const m = 60e3;
  // rendered 08:25 (WAITING) — still open at 08:31: now open, counting to close
  const a = derive({ systemMode: 'AUTO', isSystemOpen: false, electionStatus: 'WAITING', start, end, now: start.getTime() + m });
  assert.equal(a.phase, 'open'); assert.equal(a.target?.kind, 'closes');
  // rendered 16:55 (open) — still open at 17:01: now ended, results
  const b = derive({ systemMode: 'AUTO', isSystemOpen: true, electionStatus: 'ONGOING', start, end, now: end.getTime() + m });
  assert.equal(b.phase, 'ended'); assert.equal(b.action, 'results');
  // server says open but this device's clock is 5 minutes slow: stays open
  const c = derive({ systemMode: 'AUTO', isSystemOpen: true, electionStatus: 'ONGOING', start, end, now: start.getTime() - 5 * m });
  assert.equal(c.phase, 'open');
  // forced modes are never second-guessed by the clock
  assert.equal(derive({ systemMode: 'MANUAL_OPEN', isSystemOpen: true, start, end, now: end.getTime() + m }).phase, 'open');
  assert.equal(derive({ systemMode: 'PAUSE', start, end, now: start.getTime() + m }).phase, 'paused');
});

test("after closing, the button waits for the announcement", async () => {
  const { isAwaitingResults } = await import("../../src/lib/election/electionStatus.mjs");
  assert.equal(isAwaitingResults("ended", false), true);
  assert.equal(isAwaitingResults("ended", true), false);
  // no systemConfig (editor / gallery): keep the configured text
  assert.equal(isAwaitingResults("ended", undefined), false);
  assert.equal(isAwaitingResults("voted", false), false);
});
