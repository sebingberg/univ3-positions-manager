/**
 * @file utils/price.ts
 * @description Utility functions for handling price calculations and conversions
 * in Uniswap V3 using the official SDK.
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

import { JSBI } from '@uniswap/sdk';
import { Token } from '@uniswap/sdk-core';
import { encodeSqrtRatioX96, TickMath } from '@uniswap/v3-sdk';
import { Decimal } from 'decimal.js';

import { TICK_SPACINGS } from './constants.js';
import { logger } from './logger.js';

// Helper function to get nearest usable tick
function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  const minTick = TickMath.MIN_TICK;
  const maxTick = TickMath.MAX_TICK;
  return Math.min(Math.max(rounded, minTick), maxTick);
}

/**
 * ! Critical function for converting price to corresponding pool tick
 * @param price The desired price point (e.g., 1800 for 1 ETH = 1800 USDC)
 * @param baseToken The base token in the pair (e.g., WETH in WETH/USDC)
 * @param quoteToken The quote token in the pair (e.g., USDC in WETH/USDC)
 * @param feeTier The fee tier of the pool (default is 3000 for 0.3% fee tier)
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
  feeTier: number = 3000,
): number {
  try {
    logger.debug('Converting price to tick', {
      price,
      baseToken: baseToken.symbol,
      quoteToken: quoteToken.symbol,
      feeTier,
    });

    // Convert price to Q96.96 format considering token decimals
    const decimalAdjustment = quoteToken.decimals - baseToken.decimals;
    const adjustedPrice = price * Math.pow(10, decimalAdjustment);

    // Calculate sqrt price
    const sqrtPriceX96 = encodeSqrtRatioX96(
      JSBI.BigInt(Math.floor(adjustedPrice * 1e18)),
      JSBI.BigInt(1e18),
    );

    // Get tick from sqrt price
    const tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
    const tickSpacing = getTickSpacing(feeTier);
    const roundedTick = nearestUsableTick(Number(tick), tickSpacing);

    logger.debug('Price converted to tick', {
      price,
      tick: Number(tick),
      roundedTick,
      tickSpacing,
    });

    return roundedTick;
  } catch (error) {
    if (error instanceof Error && error.message.includes('SQRT_RATIO')) {
      throw new Error(`Invalid sqrt price ratio for price ${price}`);
    }
    throw new Error(
      `Price conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * * Converts a tick value back to human-readable price
 * @param tick The tick value to convert
 * @param baseToken The base token in the pair
 * @param quoteToken The quote token in the pair
 * @returns The price as a string in quote token units per one base token
 *
 * ? Example: For WETH/USDC pair at tick corresponding to 1800 USDC per ETH:
 * ? - tick = <calculated tick>
 * ? - baseToken = WETH (18 decimals)
 * ? - quoteToken = USDC (6 decimals)
 */
export function tickToTokenPrice(
  tick: number,
  baseToken: Token,
  quoteToken: Token,
): number {
  try {
    logger.debug('Converting tick to price', { tick });

    // Get sqrt price from tick
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);

    // Calculate ratio using decimal.js for precision
    const ratio = new Decimal(sqrtRatioX96.toString())
      .div(new Decimal(2).pow(96))
      .pow(2);

    // Adjust for token decimals - note the reversed order compared to priceToTick
    const decimalAdjustment = quoteToken.decimals - baseToken.decimals;
    const price = ratio.mul(new Decimal(10).pow(decimalAdjustment));

    logger.debug('Tick converted to price', { price: price.toString() });

    // Return the price as a number
    return Number(price.toString());
  } catch (error) {
    if (error instanceof Error && error.message.includes('TICK_BOUND')) {
      throw new Error(`Tick ${tick} is outside valid bounds`);
    }
    throw new Error(
      `Failed to convert tick ${tick} to price: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * ! Important validation function for price ranges
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

// Helper function to get tick spacing based on fee tier
function getTickSpacing(feeTier: number): number {
  const tickSpacing = TICK_SPACINGS[feeTier as keyof typeof TICK_SPACINGS];
  if (!tickSpacing) {
    throw new Error(`Invalid fee tier: ${feeTier}`);
  }
  return tickSpacing;
}
