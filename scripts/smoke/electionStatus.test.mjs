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
