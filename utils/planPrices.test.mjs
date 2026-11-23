import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { resolvePlanAmount } from './planPrices.ts';

test('missing prices are not replaced with amounts from another currency', () => {
  assert.equal(resolvePlanAmount('BASIC', 'MONTHLY', []), null);
  assert.equal(resolvePlanAmount('PLUS', 'ANNUAL', [
    { planTier: 'PLUS', billingCycle: 'MONTHLY', amount: 10 }
  ]), null);
});

test('free and catalog prices preserve their amounts', () => {
  assert.equal(resolvePlanAmount('FREE', null, []), 0);
  assert.equal(resolvePlanAmount('BASIC', 'MONTHLY', [
    { planTier: 'BASIC', billingCycle: 'MONTHLY', amount: 0 }
  ]), 0);
});
