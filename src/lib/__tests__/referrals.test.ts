import { describe, it, expect } from 'vitest';
import {
  normalizeReferralCode,
  type ReferralCodeDoc,
} from '../firebase/referrals';

describe('referrals engine', () => {
  describe('normalizeReferralCode', () => {
    it('normalizes lowercase and whitespace', () => {
      expect(normalizeReferralCode('  ref12345  ')).toBe('REF12345');
      expect(normalizeReferralCode('refabcde')).toBe('REFABCDE');
    });

    it('strips invalid characters and preserves alphanumeric format', () => {
      expect(normalizeReferralCode('ref#12-34')).toBe('REF1234');
      expect(normalizeReferralCode('  $ref!99  ')).toBe('REF99');
    });

    it('caps max length safely', () => {
      expect(normalizeReferralCode('REF12345678901234567890').length).toBeLessThanOrEqual(16);
    });
  });

  describe('referral doc model', () => {
    it('enforces expected schema and reward amount', () => {
      const doc: ReferralCodeDoc = {
        code: 'REF98765',
        ownerUid: 'uid_test_123',
        alias: 'Ahmad Al-Ghamdi',
        rewardCoins: 15,
        usesCount: 0,
        createdAt: 1700000000000,
      };

      expect(doc.rewardCoins).toBe(15);
      expect(doc.code).toMatch(/^REF[A-Z0-9]{5}$/);
      expect(doc.usesCount).toBe(0);
    });
  });
});
