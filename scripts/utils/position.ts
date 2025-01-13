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
  // * Create a new position instance to calculate amounts
  const position = new Position({
    pool,
    liquidity: ethers.parseEther(liquidityAmount).toString(),
    tickLower: lowerTick,
    tickUpper: upperTick,
  });

  // * Convert amounts to bigint
  const amounts = position.mintAmounts;
  return {
    amount0: BigInt(amounts.amount0.toString()),
    amount1: BigInt(amounts.amount1.toString()),
  };
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
