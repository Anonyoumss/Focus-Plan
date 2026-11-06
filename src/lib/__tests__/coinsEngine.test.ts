import { describe, it, expect } from 'vitest';
import {
  canPurchaseItem,
  processPurchase,
  awardPoints,
  STORE_ITEMS,
} from '../coinsEngine';

describe('coinsEngine unit tests', () => {
  it('correctly checks purchase eligibility', () => {
    expect(canPurchaseItem(15, 10)).toBe(true);
    expect(canPurchaseItem(10, 10)).toBe(true);
    expect(canPurchaseItem(9, 10)).toBe(false);
  });

  it('processes purchase and creates valid audit transaction', () => {
    const item = STORE_ITEMS[0];
    const inventory = {};
    const result = processPurchase(25, inventory, item);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.newCoins).toBe(15);
      expect(result.newInventory['streak_freeze']).toBe(1);
      expect(result.transaction.amount).toBe(-10);
      expect(result.transaction.type).toBe('spend');
    }
  });

  it('rejects purchase if coins are insufficient', () => {
    const item = STORE_ITEMS[1];
    const result = processPurchase(20, {}, item);
    expect(result).toBeNull();
  });

  it('awards points and records earn transaction', () => {
    const { newCoins, transaction } = awardPoints(50, 7, 'Weekly study champion');
    expect(newCoins).toBe(57);
    expect(transaction.amount).toBe(7);
    expect(transaction.type).toBe('earn');
  });
});
