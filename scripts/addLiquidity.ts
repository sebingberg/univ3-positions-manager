/**
 * @file addLiquidity.ts
 * @description This script handles the creation of new Uniswap V3 liquidity positions.
 * It provides functionality to:
 * - Create new positions with specified price ranges
 * - Handle token approvals automatically
 * - Calculate optimal amounts based on current pool state
 * - Apply slippage protection to transactions
 *
 * @example
 * ```typescript
 * const params: AddLiquidityParams = {
 *   tokenA: WETH,
 *   tokenB: USDC,
 *   fee: FEE_TIERS.MEDIUM,
 *   amount: "1.5",
 *   priceLower: 1750,
 *   priceUpper: 1850,
 *   poolAddress: "0x..."
 * }
 * await addLiquidity(params)
 * ```
 *
 * ! Important: Ensure sufficient token balances before calling
 * * Note: Price ranges are inclusive on both ends
 * * Note: Amount is in ETH units (e.g., "1.5" = 1.5 ETH worth of liquidity)
 */

import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';

import {
  ERC20_ABI,
  POOL_ABI,
  POSITION_MANAGER_ABI,
  Slot0Data,
} from './utils/abis.js';
import {
  FEE_TIERS,
  NFT_POSITION_MANAGER,
  POOL_ADDRESS,
  SLIPPAGE_TOLERANCE,
} from './utils/constants.js';
import { withErrorHandling } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import {
  calculateMinimumAmounts,
  calculateOptimalAmounts,
} from './utils/position.js';
import { priceToTick } from './utils/price.js';
import { validateAddLiquidityParams } from './utils/validation.js';

export interface AddLiquidityParams {
  tokenA: Token;
  tokenB: Token;
  fee: (typeof FEE_TIERS)[keyof typeof FEE_TIERS];
  amount: string;
  priceLower: number;
  priceUpper: number;
  poolAddress?: string;
}

export async function addLiquidity(
  params: AddLiquidityParams,
): Promise<ethers.ContractTransactionReceipt | null> {
  return await withErrorHandling(
    async () => {
      validateAddLiquidityParams(params);

      // Ensure token ordering matches Uniswap's requirements
      const [token0, token1] =
        params.tokenA.address.toLowerCase() <
        params.tokenB.address.toLowerCase()
          ? [params.tokenA, params.tokenB]
          : [params.tokenB, params.tokenA];

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      // Initialize pool contract
      const poolContract = new ethers.Contract(
        params.poolAddress || POOL_ADDRESS,
        POOL_ABI,
        provider,
      );

      const slot0 = (await poolContract.slot0()) as Slot0Data;

      // Convert prices to ticks
      const tickLower = priceToTick(
        params.priceLower,
        params.tokenA,
        params.tokenB,
        params.fee,
      );
      const tickUpper = priceToTick(
        params.priceUpper,
        params.tokenA,
        params.tokenB,
        params.fee,
      );

      // Calculate optimal amounts
      const pool = new Pool(
        params.tokenA,
        params.tokenB,
        params.fee,
        slot0.sqrtPriceX96.toString(),
        '0', // We don't need liquidity for amount calculation
        slot0.tick,
      );

      const { amount0, amount1 } = calculateOptimalAmounts(
        pool,
        tickLower,
        tickUpper,
        params.amount,
      );

      // Calculate minimum amounts with slippage protection
      const { amount0Min, amount1Min } = calculateMinimumAmounts(
        amount0,
        amount1,
        SLIPPAGE_TOLERANCE,
      );

      // Approve tokens
      const tokenAContract = new ethers.Contract(
        params.tokenA.address,
        ERC20_ABI,
        wallet,
      );
      const tokenBContract = new ethers.Contract(
        params.tokenB.address,
        ERC20_ABI,
        wallet,
      );

      logger.info('Approving tokens...', {
        tokenA: params.tokenA.address,
        tokenB: params.tokenB.address,
      });

      await tokenAContract.approve(NFT_POSITION_MANAGER, ethers.MaxUint256);
      await tokenBContract.approve(NFT_POSITION_MANAGER, ethers.MaxUint256);

      // Create position
      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        wallet,
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes

      logger.info('Adding liquidity...', {
        tickLower,
        tickUpper,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
      });

      const tx = await positionManager.mint({
        token0: token0.address,
        token1: token1.address,
        fee: params.fee,
        tickLower,
        tickUpper,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: amount0Min,
        amount1Min: amount1Min,
        recipient: wallet.address,
        deadline,
      });

      const receipt = await tx.wait();
      await logger.logTransaction('Liquidity Added', receipt, {
        tokenId: receipt.events?.[0]?.args?.tokenId?.toString(),
      });

      return receipt;
    },
    {
      operation: 'addLiquidity',
      params,
      contractAddress: NFT_POSITION_MANAGER,
    },
  );
}
