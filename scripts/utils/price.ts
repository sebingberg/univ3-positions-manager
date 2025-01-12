/**
 * @file utils/price.ts
 * @description Utility functions for handling price calculations and conversions
 * in Uniswap V3. Provides tools for:
 * - Converting between human-readable prices and Uniswap ticks
 * - Validating price ranges for positions
 * - Converting between different price representations
 *
 * @example
 * ```typescript
 * const tick = priceToTick(1800, WETH, USDC)
 * const price = tickToTokenPrice(tick, WETH, USDC)
 * validatePriceRange(1750, 1850)
 * ```
 *
 * ! Important: All prices should be in quote token units per one base token
 * * Note: Tick spacing varies by fee tier (1% = 200, 0.3% = 60, 0.05% = 10)
 *
 */

import { Token } from '@uniswap/sdk-core';
import { encodeSqrtRatioX96, TickMath, tickToPrice } from '@uniswap/v3-sdk';

/**
 * ! Critical function for converting price to corresponding pool tick
 * @param price The desired price point (e.g., 1800 for 1 ETH = 1800 USDC)
 * @param baseToken The base token in the pair (e.g., WETH in WETH/USDC)
 * @param quoteToken The quote token in the pair (e.g., USDC in WETH/USDC)
 * @returns The closest tick that corresponds to the given price
 *
 * ? Example: For WETH/USDC pair at 1800 USDC per ETH:
 * ? - price = 1800
 * ? - baseToken = WETH (18 decimals)
 * ? - quoteToken = USDC (6 decimals)
 */
export function priceToTick(
  price: number,
  baseToken: Token,
  quoteToken: Token,
): number {
  // * First encode the price into the Q64.96 format required by Uniswap V3
  const sqrtRatioX96 = encodeSqrtRatioX96(
    price * 10 ** quoteToken.decimals,
    10 ** baseToken.decimals,
  );

  // ! Convert the Q64.96 price to its corresponding tick
  return TickMath.getTickAtSqrtRatio(sqrtRatioX96);
}

/**
 * * Converts a tick value back to human-readable price
 * @param tick The tick value to convert
 * @param baseToken The base token in the pair
 * @param quoteToken The quote token in the pair
 * @returns The price in quote token units per one base token
 *
 * ! Important: This is the inverse operation of priceToTick
 * ? Example: A tick of 202641 might return 1800 for WETH/USDC
 */
export function tickToTokenPrice(
  tick: number,
  baseToken: Token,
  quoteToken: Token,
): number {
  const priceObject = tickToPrice(baseToken, quoteToken, tick);
  return parseFloat(priceObject.toSignificant(8));
}

/**
 * ! Important validation function for price ranges
 * @param currentMarketPrice Current price of the token pair
 * @param desiredLowerPrice Lower bound of the price range
 * @param desiredUpperPrice Upper bound of the price range
 * @returns true if the range is valid, throws error otherwise
 *
 * * Provides basic validation that:
 * * 1. Lower price is less than upper price
 * * 2. Both prices are positive
 */
export function validatePriceRange(
  desiredLowerPrice: number,
  desiredUpperPrice: number,
): boolean {
  if (desiredLowerPrice >= desiredUpperPrice) {
    throw new Error('Lower price must be less than upper price');
  }
  if (desiredLowerPrice <= 0 || desiredUpperPrice <= 0) {
    throw new Error('Prices must be greater than 0');
  }
  return true;
}
