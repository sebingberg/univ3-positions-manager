/**
 * @file utils/position.ts
 * @description Utility functions for managing Uniswap V3 positions.
 * Provides functionality for:
 * - Calculating optimal token amounts for positions
 * - Computing minimum amounts with slippage protection
 * - Managing position metadata and state
 *
 * @example
 * ```typescript
 * const amounts = calculateOptimalAmounts(pool, lowerTick, upperTick, "1.5")
 * const minAmounts = calculateMinimumAmounts(amounts.amount0, amounts.amount1)
 * ```
 *
 * ! Important: All bigint conversions must be handled carefully
 * * Note: Slippage calculations use basis points (1 bp = 0.01%)
 * * Note: Liquidity amounts are always in ETH units for consistency
 */

import { Pool, Position } from '@uniswap/v3-sdk';
import { Decimal } from 'decimal.js';

import { SLIPPAGE_TOLERANCE } from './constants.js';

// Configure Decimal.js for high precision
Decimal.set({ precision: 50, rounding: 4 });

// * Interface representing position details from the blockchain
export interface PositionInfo {
  tokenId: number;
  operator: string;
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

/**
 * ! Critical function for calculating optimal token amounts for position
 * @param pool The Uniswap V3 pool instance
 * @param lowerTick The lower tick of the position range
 * @param upperTick The upper tick of the position range
 * @param liquidityAmount The amount of liquidity to provide (in terms of token0)
 * @returns The optimal amounts of token0 and token1 to provide
 */
export function calculateOptimalAmounts(
  pool: Pool,
  lowerTick: number,
  upperTick: number,
  liquidityAmount: string,
): { amount0: bigint; amount1: bigint } {
  // Validate ticks are within bounds
  if (lowerTick >= upperTick) {
    throw new Error('Lower tick must be less than upper tick');
  }

  // Validate ticks are within pool bounds
  const tickSpacing = pool.tickSpacing;
  if (lowerTick % tickSpacing !== 0 || upperTick % tickSpacing !== 0) {
    throw new Error(`Ticks must be multiples of ${tickSpacing}`);
  }

  try {
    // Convert input amount to proper decimals
    const decimalAmount = new Decimal(liquidityAmount);
    const decimalScale = new Decimal(10).pow(pool.token1.decimals); // Use token1 (USDC) decimals
    const scaledAmount = decimalAmount.mul(decimalScale);

    // Create a position with the specified liquidity
    const position = new Position({
      pool,
      tickLower: lowerTick,
      tickUpper: upperTick,
      liquidity: Math.floor(Number(scaledAmount.toString()) / 1e12).toString(), // Scale down liquidity to match real position
    });

    // Get mint amounts
    const amounts = position.mintAmounts;
    const amount0 = BigInt(amounts.amount0.toString());
    const amount1 = BigInt(amounts.amount1.toString());

    // Validate amounts
    if (amount0 === BigInt(0) && amount1 === BigInt(0)) {
      throw new Error('Invalid position: both token amounts are 0');
    }

    return { amount0, amount1 };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('PRICE_BOUNDS')) {
        throw new Error('Price is out of valid bounds for the pool');
      }
      if (error.message.includes('TICK')) {
        throw new Error(
          `Invalid tick range: lower=${lowerTick}, upper=${upperTick}`,
        );
      }
    }
    throw error;
  }
}

/**
 * * Calculates minimum amounts accounting for slippage
 * ! Critical for preventing sandwich attacks
 * @param desiredAmount0 The desired amount of token0
 * @param desiredAmount1 The desired amount of token1
 * @param slippageTolerance The slippage tolerance in decimal form (e.g., 0.005 for 0.5%)
 * @returns The minimum amounts accounting for slippage
 */
export function calculateMinimumAmounts(
  desiredAmount0: bigint,
  desiredAmount1: bigint,
  slippageTolerance: number = SLIPPAGE_TOLERANCE,
): { amount0Min: bigint; amount1Min: bigint } {
  // Validate slippage tolerance (input is in decimal form, e.g., 0.005 for 0.5%)
  if (slippageTolerance < 0 || slippageTolerance > 1) {
    throw new Error('Slippage tolerance must be between 0 and 1');
  }

  // Convert decimal to multiplier (e.g., 0.005 -> 0.995)
  const slippageMultiplier = BigInt(Math.floor((1 - slippageTolerance) * 1000));
  const BASE = BigInt(1000);

  return {
    amount0Min: (desiredAmount0 * slippageMultiplier) / BASE,
    amount1Min: (desiredAmount1 * slippageMultiplier) / BASE,
  };
}
