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
import { TickMath } from '@uniswap/v3-sdk';
import { Decimal } from 'decimal.js';

import { TICK_SPACINGS } from './constants.js';
import { logger } from './logger.js';

// Configure Decimal.js for high precision
Decimal.set({ precision: 50, rounding: 4 });

// Helper function to get nearest usable tick
function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  return Math.min(Math.max(rounded, TickMath.MIN_TICK), TickMath.MAX_TICK);
}

/**
 * ! Critical function for converting price to corresponding pool tick
 * @param price The desired price point (e.g., 67067.10 for 1 WETH = 67067.10 USDC)
 * @param baseToken The base token in the pair (e.g., WETH in WETH/USDC)
 * @param quoteToken The quote token in the pair (e.g., USDC in WETH/USDC)
 * @param feeTier The fee tier of the pool (default is 3000 for 0.3% fee tier)
 * @returns The closest tick that corresponds to the given price
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

    // Convert price to decimal for precision
    const decimalPrice = new Decimal(price);

    // For pool math, we need the price in terms of token1/token0
    // If baseToken is token0, we need to invert the price
    const isBaseToken0 =
      baseToken.address.toLowerCase() < quoteToken.address.toLowerCase();
    const poolPrice = isBaseToken0
      ? new Decimal(1).div(decimalPrice)
      : decimalPrice;

    // Adjust for token decimals (token1/token0)
    const decimalAdjustment = isBaseToken0
      ? quoteToken.decimals - baseToken.decimals
      : baseToken.decimals - quoteToken.decimals;
    const adjustedPrice = poolPrice.mul(new Decimal(10).pow(decimalAdjustment));

    // Calculate sqrt price
    const sqrtPrice = adjustedPrice.sqrt();
    const sqrtPriceX96 = sqrtPrice.mul(new Decimal(2).pow(96));

    // Convert to JSBI for SDK compatibility
    const sqrtPriceX96Int = JSBI.BigInt(sqrtPriceX96.floor().toFixed(0));

    // Get tick from sqrt price
    const tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96Int);

    // Apply tick spacing
    const tickSpacing = getTickSpacing(feeTier);
    const roundedTick = nearestUsableTick(Number(tick), tickSpacing);

    logger.debug('Price converted to tick', {
      price,
      adjustedPrice: adjustedPrice.toString(),
      tick: Number(tick),
      roundedTick,
    });

    return roundedTick;
  } catch (error) {
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
 * @returns The price in quote token units per one base token
 */
export function tickToTokenPrice(
  tick: number,
  baseToken: Token,
  quoteToken: Token,
): number {
  try {
    logger.debug('Converting tick to price', { tick });

    // Get sqrt price from tick using SDK
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
    const sqrtPriceX96Decimal = new Decimal(sqrtRatioX96.toString());

    // Convert to decimal for precision
    const sqrtPrice = sqrtPriceX96Decimal.div(new Decimal(2).pow(96));
    const poolPrice = sqrtPrice.pow(2);

    // For pool math, price is in terms of token1/token0
    // If baseToken is token0, we need to invert the price
    const isBaseToken0 =
      baseToken.address.toLowerCase() < quoteToken.address.toLowerCase();
    const humanPrice = isBaseToken0 ? new Decimal(1).div(poolPrice) : poolPrice;

    // Adjust for token decimals (to get human-readable price)
    const decimalAdjustment = isBaseToken0
      ? baseToken.decimals - quoteToken.decimals
      : quoteToken.decimals - baseToken.decimals;
    const adjustedPrice = humanPrice.mul(
      new Decimal(10).pow(decimalAdjustment),
    );

    // Return with reasonable precision
    const result = Number(adjustedPrice.toFixed(2));
    logger.debug('Tick converted to price', {
      tick,
      sqrtRatioX96: sqrtRatioX96.toString(),
      price: result,
    });

    return result;
  } catch (error) {
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
