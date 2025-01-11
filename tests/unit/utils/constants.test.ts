import { describe, it, expect } from 'vitest';
import {
  NETWORK,
  NFT_POSITION_MANAGER,
  SWAP_ROUTER,
  WETH,
  USDC,
  FEE_TIERS,
  SLIPPAGE_TOLERANCE,
  MaxUint128,
} from '../../../scripts/utils/constants';

describe('Constants [scripts/utils/constants.ts]', () => {
  describe('Network Configuration', () => {
    it('should use Sepolia testnet', () => {
      expect(NETWORK).toBe('sepolia');
    });
  });

  describe('Contract Addresses', () => {
    it('should have valid contract addresses', () => {
      // * Test address format
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      expect(NFT_POSITION_MANAGER).toMatch(addressRegex);
      expect(SWAP_ROUTER).toMatch(addressRegex);
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
