import { describe, expect, it } from 'vitest';

import {
  calculateMinimumAmounts,
  calculateOptimalAmounts,
} from '../../../scripts/utils/position.js';
import { MockPool, MockTokens } from '../../mocks/uniswap.js';

describe('Position Utilities [scripts/utils/position.ts]', () => {
  describe('calculateOptimalAmounts()', () => {
    it('should calculate amounts for a given liquidity', () => {
      // Use the mock pool instance directly
      const pool = MockPool.instance;

      // Use real position ticks from Sepolia
      const lowerTick = 163420; // Min tick from real position
      const upperTick = 170320; // Max tick from real position

      // Test with actual amounts from Sepolia position
      const amounts = calculateOptimalAmounts(
        pool,
        lowerTick,
        upperTick,
        '3.00', // 3.00 USDC based on real position
      );

      // Basic type and value checks
      expect(amounts.amount0).toBeTypeOf('bigint');
      expect(amounts.amount1).toBeTypeOf('bigint');
      expect(amounts.amount0).toBeGreaterThan(0n);
      expect(amounts.amount1).toBeGreaterThan(0n);

      // For concentrated liquidity positions, amounts can vary based on price
      // Using wider bounds since actual amounts depend on current price vs range
      expect(amounts.amount0).toBeGreaterThan(0n);
      expect(amounts.amount0).toBeLessThan(BigInt('1' + '0'.repeat(16))); // Max 0.01 ETH
      expect(amounts.amount1).toBeGreaterThan(BigInt('1' + '0'.repeat(6))); // Min 1 USDC
      expect(amounts.amount1).toBeLessThan(BigInt('10' + '0'.repeat(6))); // Max 10 USDC
    });
  });

  describe('calculateMinimumAmounts()', () => {
    it('should calculate minimum amounts with default slippage', () => {
      // Use realistic amounts based on mock data
      const amount0 = BigInt('1' + '0'.repeat(MockTokens.WETH.decimals)); // 1 WETH
      const amount1 = BigInt(Math.floor(MockPool.prices.current * 1e6)); // Current price in USDC

      const minAmounts = calculateMinimumAmounts(amount0, amount1);

      // Default slippage is 0.5% (0.005), so minimum amounts should be 99.5% of input
      const expectedMin0 = (amount0 * 995n) / 1000n;
      const expectedMin1 = (amount1 * 995n) / 1000n;

      expect(minAmounts.amount0Min).toBe(expectedMin0);
      expect(minAmounts.amount1Min).toBe(expectedMin1);
    });

    it('should respect custom slippage tolerance', () => {
      // Use realistic amounts from mock data
      const amount0 = BigInt('1' + '0'.repeat(MockTokens.WETH.decimals)); // 1 WETH
      const amount1 = BigInt(Math.floor(MockPool.prices.current * 1e6)); // Current price in USDC
      const customSlippage = 0.01; // 1%

      const minAmounts = calculateMinimumAmounts(
        amount0,
        amount1,
        customSlippage,
      );

      // With 1% slippage, minimum amounts should be 99% of input
      const expectedMin0 = (amount0 * 99n) / 100n;
      const expectedMin1 = (amount1 * 99n) / 100n;

      expect(minAmounts.amount0Min).toBe(expectedMin0);
      expect(minAmounts.amount1Min).toBe(expectedMin1);
    });
  });
});
