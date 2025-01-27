/**
 * @file adjustRange.ts
 * @description Script for adjusting Uniswap V3 position price ranges.
 * It provides functionality to:
 * - Modify existing position's price range
 * - Efficiently migrate liquidity to new range
 * - Handle the entire process in a single transaction
 * - Maintain same liquidity amount in new range
 *
 * @example
 * ```typescript
 * await adjustRange(tokenId, {
 *   newPriceLower: 1750,
 *   newPriceUpper: 1850,
 *   slippageTolerance: 0.5  // 0.5%
 * })
 * ```
 *
 * ! Important: This is a complex operation that involves removing and re-adding liquidity
 * * Note: Fees are collected automatically during adjustment
 * * Note: New range can be wider or narrower than original
 */

import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

import { POSITION_MANAGER_ABI, PositionInfo } from './utils/abis.js';
import { MaxUint128, NFT_POSITION_MANAGER } from './utils/constants.js';
import { withErrorHandling } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { priceToTick } from './utils/price.js';
import { validateAdjustRangeParams } from './utils/validation.js';

export interface AdjustRangeParams {
  newPriceLower: number;
  newPriceUpper: number;
  slippageTolerance?: number;
}

export async function adjustRange(
  tokenId: number,
  baseToken: Token,
  quoteToken: Token,
  params: AdjustRangeParams,
): Promise<ethers.ContractTransactionReceipt | null> {
  validateAdjustRangeParams(params);

  return await withErrorHandling(
    async () => {
      logger.info('Adjusting Position Range', {
        tokenId,
        newRange: `${params.newPriceLower}-${params.newPriceUpper}`,
      });

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        wallet,
      );

      // Get current position
      const position = (await positionManager.positions(
        tokenId,
      )) as PositionInfo;

      // Calculate new ticks
      const newTickLower = priceToTick(
        params.newPriceLower,
        baseToken,
        quoteToken,
        position.fee,
      );
      const newTickUpper = priceToTick(
        params.newPriceUpper,
        baseToken,
        quoteToken,
        position.fee,
      );

      // Step 1: Remove all liquidity from current position
      logger.info('Removing liquidity from current position...', {
        tokenId,
        liquidity: position.liquidity.toString(),
      });
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

      const removeTx = await positionManager.decreaseLiquidity({
        tokenId,
        liquidity: position.liquidity,
        amount0Min: 0, // TODO: Add slippage protection
        amount1Min: 0,
        deadline,
      });
      await removeTx.wait();

      // Step 2: Collect all tokens
      logger.info('Collecting withdrawn tokens...', {
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
      await collectTx.wait();

      // Step 3: Create new position with collected tokens
      logger.info('Creating new position with adjusted range...', {
        newTickLower,
        newTickUpper,
      });

      const mintTx = await positionManager.mint({
        token0: position.token0,
        token1: position.token1,
        fee: position.fee,
        tickLower: newTickLower,
        tickUpper: newTickUpper,
        amount0Desired: position.tokensOwed0,
        amount1Desired: position.tokensOwed1,
        amount0Min: 0, // TODO: Add slippage protection
        amount1Min: 0,
        recipient: wallet.address,
        deadline,
      });

      const receipt = await mintTx.wait();
      await logger.logTransaction('Range Adjusted', receipt, {
        tokenId,
        newTickLower,
        newTickUpper,
      });

      return receipt;
    },
    {
      operation: 'adjustRange',
      params: { tokenId, ...params },
      contractAddress: NFT_POSITION_MANAGER,
    },
  );
}
