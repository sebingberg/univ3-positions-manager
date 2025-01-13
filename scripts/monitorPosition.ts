/**
 * @file monitorPosition.ts
 * @description This script provides functionality to monitor Uniswap V3 liquidity positions.
 * It allows users to:
 * - Query the current status of a position using its NFT token ID
 * - Check uncollected fees for both tokens
 * - Get the current price and position's price range
 * - View token distribution percentages within range
 * - Monitor liquidity concentration and activity status
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
 * * Note: Liquidity value represents the virtual L = √(x * y) where x and y are token amounts
 */

import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

import { NFT_POSITION_MANAGER, POOL_ADDRESS } from './utils/constants.js';
import { withErrorHandling } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { tickToTokenPrice } from './utils/price.js';

/**
 * ! Interface for position monitoring results
 */
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

/**
 * ! Main function to monitor a liquidity position
 * @param tokenId The NFT token ID of the position
 * @param baseToken Token0 in the pair
 * @param quoteToken Token1 in the pair
 */
async function monitorPosition(
  tokenId: number,
  baseToken: Token,
  quoteToken: Token,
): Promise<PositionStatus> {
  return await withErrorHandling(
    async () => {
      logger.info('Monitoring Position', { tokenId });

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

      // Get position manager contract
      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        [
          'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
        ],
        provider,
      );

      // Get pool contract
      const poolContract = new ethers.Contract(
        POOL_ADDRESS,
        [
          'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
        ],
        provider,
      );

      const [position, slot0] = await Promise.all([
        positionManager.positions(tokenId),
        poolContract.slot0(),
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

      logger.debug('Position Details', {
        tick: slot0.tick,
        currentPrice,
        lowerPrice,
        upperPrice,
        liquidity: position.liquidity.toString(),
      });

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
    },
    { operation: 'monitorPosition', params: { tokenId } },
  );
}

function calculateTokenPercentages(
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number,
): { baseTokenPercent: number; quoteTokenPercent: number } {
  // Ensure prices are in ascending order
  const minPrice = Math.min(lowerPrice, upperPrice);
  const maxPrice = Math.max(lowerPrice, upperPrice);

  if (currentPrice <= minPrice) {
    return { baseTokenPercent: 100, quoteTokenPercent: 0 };
  }
  if (currentPrice >= maxPrice) {
    return { baseTokenPercent: 0, quoteTokenPercent: 100 };
  }

  // Calculate percentages based on price position within range
  const priceRange = maxPrice - minPrice;
  const quoteTokenPercent = ((currentPrice - minPrice) / priceRange) * 100;
  const baseTokenPercent = 100 - quoteTokenPercent;

  return { baseTokenPercent, quoteTokenPercent };
}

/**
 * * Helper function to format position status for display
 */
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

  return `
Position Status for Token ID: ${status.tokenId}
----------------------------------------
Current Pool Price: ${status.currentPrice.toLocaleString()} ${quoteToken.symbol} per ${baseToken.symbol}

Your Position:
- Price Range: ${Math.min(status.lowerPrice, status.upperPrice).toLocaleString()} to ${Math.max(status.lowerPrice, status.upperPrice).toLocaleString()} ${quoteToken.symbol} per ${baseToken.symbol}
- Token Distribution: ${baseTokenPercent.toFixed(2)}% ${baseToken.symbol}, ${quoteTokenPercent.toFixed(2)}% ${quoteToken.symbol}
- Active: ${
    status.currentPrice >= Math.min(status.lowerPrice, status.upperPrice) &&
    status.currentPrice <= Math.max(status.lowerPrice, status.upperPrice)
      ? 'Yes ✅'
      : 'No ❌'
  }

Your Uncollected Fees:
- ${baseToken.symbol}: ${ethers.formatUnits(status.tokensOwed0, baseToken.decimals).toLocaleString()}
- ${quoteToken.symbol}: ${ethers.formatUnits(status.tokensOwed1, quoteToken.decimals).toLocaleString()}
`;
}

export { monitorPosition, PositionStatus };
