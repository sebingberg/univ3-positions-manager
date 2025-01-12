import { Token } from '@uniswap/sdk-core';
import { describe, expect, it } from 'vitest';
import { USDC, WETH } from '../../../scripts/utils/constants';
import {
  priceToTick,
  tickToTokenPrice,
  validatePriceRange,
} from '../../../scripts/utils/price';

describe('Price Utilities [scripts/utils/price.ts]', () => {
  describe('priceToTick()', () => {
    it('should convert price to tick for WETH/USDC pair', () => {
      // * Test with common ETH price points
      const price = 1800;
      const tick = priceToTick(price, WETH, USDC);

      // ! Ticks should be within the valid range (-887272, 887272)
      expect(tick).toBeLessThan(887272);
      expect(tick).toBeGreaterThan(-887272);

      // * Converting back should give approximately the same price
      const convertedPrice = tickToTokenPrice(tick, WETH, USDC);
      expect(convertedPrice).toBeCloseTo(price, 0); // Within $1 precision
    });

    it('should handle different token decimal combinations', () => {
      // * Test with tokens having different decimals
      const USDT = new Token(1, '0x...', 6, 'USDT', 'Tether USD');
      const WBTC = new Token(1, '0x...', 8, 'WBTC', 'Wrapped BTC');

      expect(() => priceToTick(30000, WBTC, USDC)).not.toThrow();
      expect(() => priceToTick(1, USDT, USDC)).not.toThrow();
    });

    it('should maintain price ordering for token pairs', () => {
      // * Test price consistency when swapping tokens
      const priceETHUSDC = 1800;
      const tickETHUSDC = priceToTick(priceETHUSDC, WETH, USDC);
      const priceUSDCETH = 1 / priceETHUSDC;
      const tickUSDCETH = priceToTick(priceUSDCETH, USDC, WETH);

      // * Ticks should be opposites
      expect(tickETHUSDC).toBe(-tickUSDCETH);
    });
  });

  describe('validatePriceRange()', () => {
    it('should validate correct price ranges', () => {
      expect(() => validatePriceRange(1700, 1900)).not.toThrow();
    });

    it('should reject invalid price ranges', () => {
      // * Lower price higher than upper price
      expect(() => validatePriceRange(2000, 1900)).toThrow();
      // * Negative prices
      expect(() => validatePriceRange(-100, 1900)).toThrow();
      expect(() => validatePriceRange(1700, -100)).toThrow();
    });
  });

  describe('tickToTokenPrice()', () => {
    it('should convert tick to price accurately', () => {
      // * Test with a known tick value
      const knownTick = 202641; // Approximately $1800 ETH/USDC
      const price = tickToTokenPrice(knownTick, WETH, USDC);
      expect(price).toBeCloseTo(1800, 0); // Within $1 precision
    });
  });
});
