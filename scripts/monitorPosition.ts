/**
 * @file monitorPosition.ts
 * @description This script provides functionality to monitor Uniswap V3 liquidity positions.
 * It allows users to:
 * - Query the current status of a position using its NFT token ID
 * - Check uncollected fees for both tokens
 * - Get the current price and position's price range
 * - View token distribution percentages within range
 *
 * @example
 * ```typescript
 * const status = await monitorPosition(
 *   tokenId: 36468,
 *   baseToken: WETH,
 *   quoteToken: USDC
 * )
 * console.log(formatPositionStatus(status, WETH, USDC))
 * ```
 *
 * ! Important: This script requires the NFT token ID of an existing position
 * * Note: All fee calculations are done on-chain for accuracy
 * * Note: Price is denominated in quote token (e.g., USDC) per base token (e.g., WETH)
 * * Note: Token distribution shows how your liquidity is currently split between tokens
 */

import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

import { POOL_ABI, POSITION_MANAGER_ABI } from './utils/abis.js';
import {
  NFT_POSITION_MANAGER,
  POOL_ADDRESS,
  RPC_URL,
} from './utils/constants.js';
import { logger } from './utils/logger.js';
import { tickToTokenPrice } from './utils/price.js';

interface PositionStatus {
  tokenId: number;
  liquidity: bigint;
  feeGrowthInside0: bigint;
  feeGrowthInside1: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
  currentPrice: number;
  lowerPrice: number;
  upperPrice: number;
}

export async function monitorPosition(
  tokenId: number,
  baseToken: Token,
  quoteToken: Token,
): Promise<PositionStatus> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const positionManager = new ethers.Contract(
    NFT_POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    provider,
  );
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

  try {
    // Fetch position and pool data
    const [position, slot0] = await Promise.all([
      positionManager.positions(tokenId),
      pool.slot0(),
    ]);

    // Convert ticks to prices
    const currentPrice = tickToTokenPrice(
      Number(slot0.tick),
      baseToken,
      quoteToken,
    );
    const lowerPrice = tickToTokenPrice(
      Number(position.tickLower),
      baseToken,
      quoteToken,
    );
    const upperPrice = tickToTokenPrice(
      Number(position.tickUpper),
      baseToken,
      quoteToken,
    );

    return {
      tokenId,
      liquidity: position.liquidity,
      feeGrowthInside0: position.feeGrowthInside0LastX128,
      feeGrowthInside1: position.feeGrowthInside1LastX128,
      tokensOwed0: position.tokensOwed0,
      tokensOwed1: position.tokensOwed1,
      currentPrice,
      lowerPrice,
      upperPrice,
    };
  } catch (error) {
    logger.error('Failed to monitor position', {
      tokenId,
      error: String(error),
    });
    throw error;
  }
}

function calculateTokenPercentages(
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number,
): { baseTokenPercent: number; quoteTokenPercent: number } {
  const minPrice = Math.min(lowerPrice, upperPrice);
  const maxPrice = Math.max(lowerPrice, upperPrice);

  if (currentPrice <= minPrice)
    return { baseTokenPercent: 100, quoteTokenPercent: 0 };
  if (currentPrice >= maxPrice)
    return { baseTokenPercent: 0, quoteTokenPercent: 100 };

  const priceRange = maxPrice - minPrice;
  const quoteTokenPercent = ((currentPrice - minPrice) / priceRange) * 100;
  const baseTokenPercent = 100 - quoteTokenPercent;

  return { baseTokenPercent, quoteTokenPercent };
}

export function formatPositionStatus(
  status: PositionStatus,
  baseToken: Token,
  quoteToken: Token,
): string {
  const { baseTokenPercent, quoteTokenPercent } = calculateTokenPercentages(
    status.currentPrice,
    status.lowerPrice,
    status.upperPrice,
  );

  const isActive =
    status.currentPrice >= Math.min(status.lowerPrice, status.upperPrice) &&
    status.currentPrice <= Math.max(status.lowerPrice, status.upperPrice);

  return `
Position Status for Token ID: ${status.tokenId}
----------------------------------------
Current Pool Price: ${status.currentPrice.toLocaleString()} ${quoteToken.symbol} per ${baseToken.symbol}

Your Position:
- Price Range: ${Math.min(status.lowerPrice, status.upperPrice).toLocaleString()} to ${Math.max(status.lowerPrice, status.upperPrice).toLocaleString()} ${quoteToken.symbol} per ${baseToken.symbol}
- Token Distribution: ${baseTokenPercent.toFixed(2)}% ${baseToken.symbol}, ${quoteTokenPercent.toFixed(2)}% ${quoteToken.symbol}
- Active: ${isActive ? 'Yes ✅' : 'No ❌'}

Your Uncollected Fees:
- ${baseToken.symbol}: ${ethers.formatUnits(status.tokensOwed0, baseToken.decimals).toLocaleString()}
- ${quoteToken.symbol}: ${ethers.formatUnits(status.tokensOwed1, quoteToken.decimals).toLocaleString()}
`;
}
