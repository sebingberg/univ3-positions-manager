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

import { POSITION_MANAGER_ABI, PositionInfo } from './utils/abis.js';
import { MaxUint128, NFT_POSITION_MANAGER } from './utils/constants.js';
import { withErrorHandling } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

interface WithdrawOptions {
  percentageToWithdraw?: number;
  collectFees?: boolean;
}

export async function withdrawLiquidity(
  tokenId: number,
  options: WithdrawOptions = { percentageToWithdraw: 100, collectFees: true },
): Promise<boolean> {
  return await withErrorHandling(
    async () => {
      logger.info('Withdrawing Liquidity', {
        tokenId,
        percentage: options.percentageToWithdraw,
        collectFees: options.collectFees,
      });

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        wallet,
      );

      // Check if position exists and get position info
      const position = (await positionManager.positions(
        tokenId,
      )) as PositionInfo;

      if (!position || position.liquidity === 0n) {
        throw new Error('Invalid token ID or position has no liquidity');
      }

      // Validate percentage
      if (
        options.percentageToWithdraw! <= 0 ||
        options.percentageToWithdraw! > 100
      ) {
        throw new Error('Percentage must be between 0 and 100');
      }

      // Check approval status
      const owner = await positionManager.ownerOf(tokenId);
      const isApproved =
        (await positionManager.isApprovedForAll(owner, NFT_POSITION_MANAGER)) ||
        (await positionManager.getApproved(tokenId)) === NFT_POSITION_MANAGER;

      if (!isApproved) {
        logger.info('Approving position manager...', { tokenId });
        const approveTx = await positionManager.setApprovalForAll(
          NFT_POSITION_MANAGER,
          true,
        );
        await approveTx.wait();
      }

      const liquidityToWithdraw =
        (BigInt(position.liquidity) * BigInt(options.percentageToWithdraw!)) /
        100n;

      if (liquidityToWithdraw > 0n) {
        logger.info('Withdrawing liquidity...', {
          tokenId,
          percentage: options.percentageToWithdraw,
          liquidity: liquidityToWithdraw.toString(),
        });
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

        const decreaseTx = await positionManager.decreaseLiquidity({
          tokenId,
          liquidity: liquidityToWithdraw,
          amount0Min: 0, // TODO: Add slippage protection
          amount1Min: 0,
          deadline,
        });
        await decreaseTx.wait();
      }

      if (options.collectFees) {
        logger.info('Collecting fees and withdrawn tokens...', {
          tokenId,
          maxAmount0: MaxUint128.toString(),
          maxAmount1: MaxUint128.toString(),
        });
        const collectTx = await positionManager.collect({
          tokenId,
          recipient: wallet.address,
          amount0Max: MaxUint128,
          amount1Max: MaxUint128,
        });
        const receipt = await collectTx.wait();
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
