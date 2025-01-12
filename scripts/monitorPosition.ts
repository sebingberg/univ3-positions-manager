/**
 * @file monitorPosition.ts
 * @description This script provides functionality to monitor Uniswap V3 liquidity positions.
 * It allows users to:
 * - Query the current status of a position using its NFT token ID
 * - Check uncollected fees for both tokens
 * - Get the current price of the pool
 * - View liquidity amounts and tick ranges
 *
 * @example
 * ```typescript
 * const status = await monitorPosition(
 *   tokenId: 123,
 *   baseToken: WETH,
 *   quoteToken: USDC
 * )
 * console.log(formatPositionStatus(status, WETH, USDC))
 * ```
 *
 * ! Important: This script requires the NFT token ID of an existing position
 * * Note: All fee calculations are done on-chain for accuracy
 */

import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { NFT_POSITION_MANAGER } from './utils/constants';
import { tickToTokenPrice } from './utils/price';
import { withErrorHandling } from './utils/errorHandler';
import { logger } from './utils/logger';

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
      // * Log monitoring request
      logger.info('Monitoring Position', { tokenId });
      
      // * Initialize provider and contracts
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

      // ! Get position manager contract
      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        [
          'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
          'function collect(uint256 tokenId) external returns (uint256 amount0, uint256 amount1)',
        ],
        provider,
      );

      // * Get position details
      const position = await positionManager.positions(tokenId);

      // * Get pool contract to fetch current price
      const poolContract = new ethers.Contract(
        position.pool,
        [
          'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick)',
        ],
        provider,
      );

      const { tick } = await poolContract.slot0();
      const currentPrice = tickToTokenPrice(tick, baseToken, quoteToken);

      return {
        tokenId,
        liquidity: position.liquidity,
        feeGrowthInside0: position.feeGrowthInside0LastX128,
        feeGrowthInside1: position.feeGrowthInside1LastX128,
        tokensOwed0: position.tokensOwed0,
        tokensOwed1: position.tokensOwed1,
        currentPrice,
      };
    },
    { operation: 'monitorPosition', params: { tokenId } },
  );
}

/**
 * * Helper function to format position status for display
 */
function formatPositionStatus(
  status: PositionStatus,
  baseToken: Token,
  quoteToken: Token,
): string {
  return `
Position Status for Token ID: ${status.tokenId}
----------------------------------------
Current Price: ${status.currentPrice} ${quoteToken.symbol} per ${baseToken.symbol}
Liquidity: ${status.liquidity.toString()}
Uncollected Fees:
  - ${baseToken.symbol}: ${ethers.formatUnits(status.tokensOwed0, baseToken.decimals)}
  - ${quoteToken.symbol}: ${ethers.formatUnits(status.tokensOwed1, quoteToken.decimals)}
  `;
}

export { formatPositionStatus, monitorPosition, PositionStatus };
