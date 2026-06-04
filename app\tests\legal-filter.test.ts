import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkLegalCompliance } from '../src/lib/compliance/legal-filter.ts';

describe('checkLegalCompliance', () => {
  it('allows normal payment reminder language', () => {
    const result = checkLegalCompliance(
      'Could you share an update on invoice INV-2026-0147 when you have a moment?'
    );

    assert.equal(result.isClean, true);
    assert.deepEqual(result.violations, []);
  });

  it('blocks prohibited legal and threat language', () => {
    const result = checkLegalCompliance(
      'We will file a lawsuit and ruin your credit if this is not paid.'
    );

    assert.equal(result.isClean, false);
    assert.deepEqual(result.violations, ['lawsuit', 'ruin your credit']);
  });

  it('does not flag prohibited terms inside larger words', () => {
    const result = checkLegalCompliance(
      'Please issue the payment from your treasury team when approved.'
    );

    assert.equal(result.isClean, true);
  });
});
