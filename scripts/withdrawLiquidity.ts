/**
 * @file withdrawLiquidity.ts
 * @description Script for withdrawing liquidity from Uniswap V3 positions.
 * It provides functionality to:
 * - Remove liquidity from an existing position
 * - Collect accumulated fees
 * - Handle partial or complete withdrawals
 * - Ensure safe token transfers
 *
 * @example
 * ```typescript
 * // Withdraw all liquidity
 * await withdrawLiquidity(tokenId)
 *
 * // Partial withdrawal
 * await withdrawLiquidity(tokenId, {
 *   percentageToWithdraw: 50,  // withdraw 50% of position
 *   collectFees: true
 * })
 * ```
 *
 * ! Important: Only position owner can withdraw
 * * Note: Collecting fees does not affect the position's liquidity
 * * Note: Partial withdrawals maintain the same price range
 */

import { ethers } from 'ethers';
import { MaxUint128, NFT_POSITION_MANAGER } from './utils/constants';
import { withErrorHandling } from './utils/errorHandler';
import { logger } from './utils/logger';

// * Configuration options for withdrawal process
interface WithdrawOptions {
  percentageToWithdraw?: number; // * Percentage of liquidity to withdraw from position (1-100)
  collectFees?: boolean; // * Whether to collect accumulated fees
}

/**
 * ! Main function to withdraw liquidity from a position
 * @param tokenId The NFT token ID of the position
 * @param options Configuration for the withdrawal process
 */
async function withdrawLiquidity(
  tokenId: number,
  options: WithdrawOptions = { percentageToWithdraw: 100, collectFees: true },
) {
  return await withErrorHandling(
    async () => {
      // * Log withdrawal start
      logger.info('Withdrawing Liquidity', {
        tokenId,
        percentage: options.percentageToWithdraw,
        collectFees: options.collectFees,
      });

      // * Initialize provider and signer
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      // ! Initialize position manager contract with required method signatures
      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        [
          // * Contract function to query position details
          'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
          // * Contract function to remove liquidity
          'function decreaseLiquidity(uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline) external returns (uint256 amount0, uint256 amount1)',
          // * Contract function to collect fees and withdrawn tokens
          'function collect(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max) external returns (uint128 amount0, uint128 amount1)',
        ],
        wallet,
      ) as ethers.Contract & {
        positions: (tokenId: number) => Promise<any>;
        decreaseLiquidity: (tokenId: number, liquidity: bigint, amount0Min: number, amount1Min: number, deadline: bigint) => Promise<any>;
        collect: (tokenId: number, recipient: string, amount0Max: bigint, amount1Max: bigint) => Promise<any>;
      };

      // * Fetch current position state
      const position = await positionManager.positions(tokenId);

      // * Calculate amount of liquidity to withdraw based on percentage
      const liquidityToWithdraw =
        (BigInt(position.liquidity) * BigInt(options.percentageToWithdraw!)) / 100n;

      // ! Step 1: Decrease liquidity if requested
      if (liquidityToWithdraw > 0n) {
        console.log(`Withdrawing ${options.percentageToWithdraw}% of liquidity...`);
        // * Set deadline 10 minutes in the future
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

        // TODO: Add slippage protection by calculating amount0Min and amount1Min
        const tx = await positionManager.decreaseLiquidity(
          tokenId,
          liquidityToWithdraw,
          0, // amount0Min
          0, // amount1Min
          deadline,
        );
        await tx.wait();
      }

      // ! Step 2: Collect fees and withdrawn tokens
      if (options.collectFees) {
        console.log('Collecting fees and withdrawn tokens...');
        const tx = await positionManager.collect(
          tokenId,
          wallet.address,
          MaxUint128, // * Collect all available token0
          MaxUint128, // * Collect all available token1
        );
        const receipt = await tx.wait();
        await logger.logTransaction('Liquidity Withdrawn', receipt, {
          tokenId,
          percentage: options.percentageToWithdraw,
        });
      }

      return true;
    },
    {
      operation: 'withdrawLiquidity',
      params: { tokenId, options },
      contractAddress: NFT_POSITION_MANAGER,
    },
  );
}

export { withdrawLiquidity, WithdrawOptions };
