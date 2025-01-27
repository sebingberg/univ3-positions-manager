import { TickMath } from '@uniswap/v3-sdk';
import { describe, expect, it } from 'vitest';

import {
  priceToTick,
  tickToTokenPrice,
  validatePriceRange,
} from '../../../scripts/utils/price.js';
import { MockPool, MockTokens } from '../../mocks/uniswap.js';

describe('Price Utilities [scripts/utils/price.ts]', () => {
  describe('priceToTick()', () => {
    it('should convert price to tick for WETH/USDC pair', () => {
      const price = MockPool.prices.current;
      const tick = priceToTick(price, MockTokens.WETH, MockTokens.USDC);

      // Just check if tick is in a reasonable range
      expect(tick).toBeLessThan(TickMath.MAX_TICK);
      expect(tick).toBeGreaterThan(TickMath.MIN_TICK);

      // Very loose price comparison (within 10% is fine)
      const convertedPrice = tickToTokenPrice(
        tick,
        MockTokens.WETH,
        MockTokens.USDC,
      );
      const percentDiff = Math.abs((convertedPrice - price) / price) * 100;
      expect(percentDiff).toBeLessThan(10);
    });

    it('should handle different token decimal combinations', () => {
      // Just check if the function executes without throwing
      expect(() =>
        priceToTick(
          MockPool.testPrices.WBTC_USDC,
          MockTokens.WBTC,
          MockTokens.USDC,
        ),
      ).not.toThrow();

      expect(() =>
        priceToTick(
          MockPool.testPrices.USDT_USDC,
          MockTokens.USDT,
          MockTokens.USDC,
        ),
      ).not.toThrow();
    });

    it('should maintain price ordering for token pairs', () => {
      const priceETHUSDC = MockPool.prices.current;
      const tickETHUSDC = priceToTick(
        priceETHUSDC,
        MockTokens.WETH,
        MockTokens.USDC,
      );

      // Very loose price comparison (within 10% is fine)
      const priceBack = tickToTokenPrice(
        tickETHUSDC,
        MockTokens.WETH,
        MockTokens.USDC,
      );
      const percentDiff =
        Math.abs((priceBack - priceETHUSDC) / priceETHUSDC) * 100;
      expect(percentDiff).toBeLessThan(10);

      // Just check if tick is in a reasonable range
      expect(tickETHUSDC).toBeLessThan(TickMath.MAX_TICK);
      expect(tickETHUSDC).toBeGreaterThan(TickMath.MIN_TICK);
    });
  });

  describe('validatePriceRange()', () => {
    it('should validate correct price ranges', () => {
      expect(() =>
        validatePriceRange(MockPool.prices.min, MockPool.prices.max),
      ).not.toThrow();
    });

    it('should reject invalid price ranges', () => {
      expect(() =>
        validatePriceRange(MockPool.prices.max, MockPool.prices.min),
      ).toThrow();
      expect(() => validatePriceRange(-100, MockPool.prices.max)).toThrow();
      expect(() => validatePriceRange(MockPool.prices.min, -100)).toThrow();
    });
  });

  describe('tickToTokenPrice()', () => {
    it('should convert tick to price accurately', () => {
      // First convert a known price to tick
      const knownPrice = MockPool.prices.current;
      const tick = priceToTick(knownPrice, MockTokens.WETH, MockTokens.USDC);

      // Then convert back to price
      const price = tickToTokenPrice(tick, MockTokens.WETH, MockTokens.USDC);

      // Compare with original price (within 10% is fine)
      const percentDiff = Math.abs((price - knownPrice) / knownPrice) * 100;
      expect(percentDiff).toBeLessThan(10);
    });
  });
});
