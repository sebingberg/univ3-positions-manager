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

import { logger } from './logger.js';

const MIN_TICK = -887272;
const MAX_TICK = 887272;

const TICK_SPACINGS = {
  500: 10, // 0.05% fee tier
  3000: 60, // 0.3% fee tier
  10000: 200, // 1% fee tier
};

/**
 * ! Critical function for converting price to corresponding pool tick
 * @param price The desired price point (e.g., 1800 for 1 ETH = 1800 USDC)
 * @param baseToken The base token in the pair (e.g., WETH in WETH/USDC)
 * @param quoteToken The quote token in the pair (e.g., USDC in WETH/USDC)
 * @param feeTier The fee tier of the pool (default is 500 for 0.05% fee tier)
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
  feeTier: number = 500,
): number {
  // Validate price is positive
  if (price <= 0) {
    throw new Error('Price must be greater than 0');
  }

  logger.debug('Converting price to tick', {
    price,
    baseToken: baseToken.symbol,
    quoteToken: quoteToken.symbol,
    feeTier,
  });

  try {
    // Convert price to Q64.96 format
    const priceInQuoteDecimals = BigInt(
      Math.floor(price * 10 ** quoteToken.decimals),
    );
    const baseDecimals = BigInt(10 ** baseToken.decimals);

    const sqrtRatioX96 = encodeSqrtRatioX96(
      priceInQuoteDecimals.toString(),
      baseDecimals.toString(),
    );

    const tick = TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    const tickSpacing = TICK_SPACINGS[feeTier as keyof typeof TICK_SPACINGS];

    if (!tickSpacing) {
      throw new Error(`Invalid fee tier: ${feeTier}`);
    }

    // Round to the nearest valid tick based on tick spacing
    const roundedTick = Math.round(tick / tickSpacing) * tickSpacing;

    // Validate tick is within bounds
    if (roundedTick < MIN_TICK || roundedTick > MAX_TICK) {
      throw new Error(
        `Calculated tick ${roundedTick} is out of bounds. Must be between ${MIN_TICK} and ${MAX_TICK}`,
      );
    }

    logger.debug('Price converted to tick', {
      price,
      rawTick: tick,
      roundedTick,
      tickSpacing,
    });

    return roundedTick;
  } catch (error) {
    throw new Error(
      `Failed to convert price ${price} to tick: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
  tick: number | bigint,
  baseToken: Token,
  quoteToken: Token,
): number {
  const tickNumber = typeof tick === 'bigint' ? Number(tick) : tick;
  const roundedTick = Math.round(tickNumber);

  if (roundedTick < MIN_TICK || roundedTick > MAX_TICK) {
    throw new Error(
      `Tick out of range: ${roundedTick} (must be between ${MIN_TICK} and ${MAX_TICK})`,
    );
  }

  try {
    const priceObject = tickToPrice(baseToken, quoteToken, roundedTick);
    const priceString = priceObject.toFixed(8);
    return parseFloat(priceString);
  } catch (error) {
    throw new Error(
      `Failed to convert tick ${roundedTick} to price: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
