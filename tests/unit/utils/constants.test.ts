import { describe, expect, it } from 'vitest';

import {
  FEE_TIERS,
  MaxUint128,
  NETWORK_NAME,
  NFT_POSITION_MANAGER,
  SLIPPAGE_TOLERANCE,
  USDC,
  WETH,
} from '../../../scripts/utils/constants.js';

describe('Constants [scripts/utils/constants.ts]', () => {
  describe('Network Configuration', () => {
    it('should use Sepolia testnet', () => {
      expect(NETWORK_NAME).toBe('sepolia');
    });
  });

  describe('Contract Addresses', () => {
    it('should have valid contract addresses', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      expect(NFT_POSITION_MANAGER).toMatch(addressRegex);
    });
  });

  describe('Token Configurations', () => {
    it('should configure WETH correctly', () => {
      expect(WETH.chainId).toBe(11155111); // Sepolia
      expect(WETH.decimals).toBe(18);
      expect(WETH.symbol).toBe('WETH');
    });

    it('should configure USDC correctly', () => {
      expect(USDC.chainId).toBe(11155111); // Sepolia
      expect(USDC.decimals).toBe(6);
      expect(USDC.symbol).toBe('USDC');
    });
  });

  describe('Fee Tiers', () => {
    it('should have correct fee values', () => {
      expect(FEE_TIERS.LOW).toBe(500); // 0.05%
      expect(FEE_TIERS.MEDIUM).toBe(3000); // 0.3%
      expect(FEE_TIERS.HIGH).toBe(10000); // 1%
    });
  });

  describe('Parameters', () => {
    it('should have reasonable slippage tolerance', () => {
      expect(SLIPPAGE_TOLERANCE).toBeGreaterThan(0);
      expect(SLIPPAGE_TOLERANCE).toBeLessThan(1);
    });

    it('should have correct MaxUint128 value', () => {
      expect(MaxUint128).toBe(2n ** 128n - 1n);
    });
  });
});
