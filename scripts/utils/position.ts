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
import { ethers } from 'ethers';

import { SLIPPAGE_TOLERANCE } from './constants.js';

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

  // Validate liquidity amount
  const liquidityBigInt = ethers.parseEther(liquidityAmount);
  if (liquidityBigInt <= BigInt(0)) {
    throw new Error('Liquidity amount must be greater than 0');
  }

  try {
    // Create a new position instance to calculate amounts
    const position = new Position({
      pool,
      liquidity: liquidityBigInt.toString(),
      tickLower: lowerTick,
      tickUpper: upperTick,
    });

    // Get mint amounts and ensure they are valid
    const amounts = position.mintAmounts;
    const amount0 = BigInt(amounts.amount0.toString());
    const amount1 = BigInt(amounts.amount1.toString());

    if (amount0 <= BigInt(0) && amount1 <= BigInt(0)) {
      throw new Error('Invalid position: both token amounts are 0');
    }

    return { amount0, amount1 };
  } catch (error) {
    if (error instanceof Error && error.message.includes('PRICE_BOUNDS')) {
      throw new Error('Price is out of valid bounds for the pool');
    }
    throw error;
  }
}

/**
 * * Calculates minimum amounts accounting for slippage
 * ! Critical for preventing sandwich attacks
 */
export function calculateMinimumAmounts(
  desiredAmount0: bigint,
  desiredAmount1: bigint,
  slippageTolerance: number = SLIPPAGE_TOLERANCE,
): { amount0Min: bigint; amount1Min: bigint } {
  const slippageMultiplier = BigInt(
    Math.floor((1 - slippageTolerance) * 10000),
  );
  const BASE = BigInt(10000);

  return {
    amount0Min: (desiredAmount0 * slippageMultiplier) / BASE,
    amount1Min: (desiredAmount1 * slippageMultiplier) / BASE,
  };
}
