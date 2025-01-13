import { Pool } from '@uniswap/v3-sdk';
import { describe, expect, it } from 'vitest';

import { FEE_TIERS, USDC, WETH } from '../../../scripts/utils/constants.js';
import {
  calculateMinimumAmounts,
  calculateOptimalAmounts,
} from '../../../scripts/utils/position.js';

describe('Position Utilities [scripts/utils/position.ts]', () => {
  describe('calculateOptimalAmounts()', () => {
    it('should calculate amounts for a given liquidity', () => {
      // * Create a mock pool instance
      const pool = new Pool(
        WETH,
        USDC,
        FEE_TIERS.MEDIUM,
        '2437312313659959819381354528', // sqrtPriceX96
        '10000', // liquidity
        202641, // tick at ~1800 USDC/ETH
      );

      const amounts = calculateOptimalAmounts(
        pool,
        202641 - 1000, // Lower tick
        202641 + 1000, // Upper tick
        '1.0', // 1 ETH worth of liquidity
      );

      // * Verify returned amounts
      expect(amounts.amount0).toBeTypeOf('bigint');
      expect(amounts.amount1).toBeTypeOf('bigint');
      expect(amounts.amount0).toBeGreaterThan(0n);
      expect(amounts.amount1).toBeGreaterThan(0n);
    });
  });

  describe('calculateMinimumAmounts()', () => {
    it('should calculate minimum amounts with slippage', () => {
      const amount0 = 1000000n;
      const amount1 = 2000000n;

      const minAmounts = calculateMinimumAmounts(amount0, amount1);

      // * Verify slippage calculations
      expect(minAmounts.amount0Min).toBeLessThan(amount0);
      expect(minAmounts.amount1Min).toBeLessThan(amount1);
      expect(minAmounts.amount0Min).toBeGreaterThan(0n);
      expect(minAmounts.amount1Min).toBeGreaterThan(0n);
    });

    it('should respect custom slippage tolerance', () => {
      const amount = 1000000n;
      const customSlippage = 0.01; // 1%

      const minAmounts = calculateMinimumAmounts(
        amount,
        amount,
        customSlippage,
      );
      const expectedMin = (amount * 99n) / 100n; // 1% less

      expect(minAmounts.amount0Min).toBe(expectedMin);
      expect(minAmounts.amount1Min).toBe(expectedMin);
    });
  });
});
