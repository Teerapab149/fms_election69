import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSpecialOptionPlan } from '../../src/lib/candidates/specialOptions.mjs';

test('empty database prepares abstain but not single-party disapprove', () => {
  assert.deepEqual(getSpecialOptionPlan([]), {
    realPartyCount: 0,
    createAbstain: true,
    createDisapprove: false,
    removeDisapprove: false,
  });
});

test('one real party prepares both abstain and disapprove', () => {
  assert.deepEqual(getSpecialOptionPlan([1]), {
    realPartyCount: 1,
    createAbstain: true,
    createDisapprove: true,
    removeDisapprove: false,
  });
});

test('second real party removes the single-party-only disapprove option', () => {
  assert.deepEqual(getSpecialOptionPlan([0, -1, 1, 2]), {
    realPartyCount: 2,
    createAbstain: false,
    createDisapprove: false,
    removeDisapprove: true,
  });
});

test('returning from two real parties to one recreates disapprove', () => {
  assert.deepEqual(getSpecialOptionPlan([0, 1]), {
    realPartyCount: 1,
    createAbstain: false,
    createDisapprove: true,
    removeDisapprove: false,
  });
});
