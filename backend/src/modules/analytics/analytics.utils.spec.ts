import { describe, expect, it } from 'bun:test';
import { roundMoney, roundRatio, safeDivide } from './analytics.utils';

describe('analytics.utils', () => {
  it('safeDivide returns 0 when denominator is 0', () => {
    expect(safeDivide(10, 0)).toBe(0);
  });

  it('safeDivide returns the correct ratio', () => {
    expect(safeDivide(25, 100)).toBe(0.25);
  });

  it('roundMoney rounds to 2 decimals', () => {
    expect(roundMoney(27.738600000000002)).toBe(27.74);
    expect(roundMoney(10)).toBe(10);
  });

  it('roundRatio rounds to 4 decimals', () => {
    expect(roundRatio(0.309123456)).toBe(0.3091);
    expect(roundRatio(0.0204999)).toBe(0.0205);
  });
});
