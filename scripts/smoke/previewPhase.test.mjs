// previewPhaseFor — the one phase a /template-preview render stands in (T8).
// The gallery slides and the full-screen preview must never judge from the
// real schedule: every page+variant maps to a phase, and results map by the
// props the family renders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewPhaseFor as phase, resultsPhaseOf } from '../../src/lib/election/previewPhase.mjs';

const PHASE_KEYS = ['before', 'far', 'open', 'after', 'early', 'overtime', 'paused', 'ended'];

test('home: the variant names the phase; absent/unknown → open; closed → paused', () => {
  assert.equal(phase({ page: 'home' }), 'open');
  assert.equal(phase({ page: 'home', variant: 'nonsense' }), 'open');
  for (const k of PHASE_KEYS) assert.equal(phase({ page: 'home', variant: k }), k);
  assert.equal(phase({ page: 'home', variant: 'closed' }), 'paused');
});

test('closed: its own names, never the home table (absent → before, ended → after)', () => {
  // the gallery's closed slide sends no variant
  assert.equal(phase({ page: 'closed' }), 'before');
  assert.equal(phase({ page: 'closed', variant: 'waiting' }), 'before');
  assert.equal(phase({ page: 'closed', variant: 'ended' }), 'after');
  assert.equal(phase({ page: 'closed', variant: 'closed' }), 'paused');
  assert.equal(phase({ page: 'closed', variant: 'paused' }), 'paused');
  // a home-only name is not a closed case
  assert.equal(phase({ page: 'closed', variant: 'overtime' }), 'before');
});

test('pages reached only while the polls are open → open, whatever the variant', () => {
  for (const page of ['candidates', 'party', 'vote', 'success', 'login', 'unknown-page']) {
    for (const variant of ['', 'multi', 'single', 'locked', 'unlocked', 'noform', 'ended']) {
      assert.equal(phase({ page, variant }), 'open', `${page}/${variant}`);
    }
  }
});

test('results: by the props rendered, not the variant name', () => {
  // static Verdure/StudioDark/Gumroad ?variant=locked: not-started card
  assert.equal(phase({ page: 'results', variant: 'locked', results: { isNotStarted: true, finalStatus: 'WAITING', isRevealed: false } }), 'before');
  // Blossom/Receipt/FmsOfficial ?variant=locked: embargo band while polls are open
  assert.equal(phase({ page: 'results', variant: 'locked', results: { isNotStarted: false, finalStatus: 'ONGOING', isRevealed: false } }), 'open');
  // ?variant=after: closed, not revealed yet
  assert.equal(phase({ page: 'results', variant: 'after', results: { isNotStarted: false, finalStatus: 'ENDED', isRevealed: false } }), 'after');
  // revealed → after the close
  assert.equal(phase({ page: 'results', variant: 'revealed', results: { isNotStarted: false, finalStatus: 'ENDED', isRevealed: true } }), 'after');
  // isNotStarted wins over everything
  assert.equal(resultsPhaseOf({ isNotStarted: true, finalStatus: 'ENDED', isRevealed: true }), 'before');
  // WAITING without the flag is still "not open yet"
  assert.equal(resultsPhaseOf({ finalStatus: 'WAITING' }), 'before');
});

test('results without props → null (caller must say what it renders)', () => {
  assert.equal(phase({ page: 'results', variant: 'revealed' }), null);
});

test('every non-null answer is a PHASES key', () => {
  const pages = ['home', 'candidates', 'party', 'vote', 'results', 'success', 'closed', 'login'];
  const variants = ['', 'multi', 'single', 'locked', 'revealed', 'counting', 'before', 'after', 'waiting', 'ended', 'closed', 'paused', 'far', 'early', 'overtime', 'open'];
  for (const page of pages) for (const variant of variants) {
    const r = phase({ page, variant, results: page === 'results' ? { isRevealed: variant === 'revealed' } : null });
    assert.ok(PHASE_KEYS.includes(r), `${page}/${variant} → ${r}`);
  }
});
