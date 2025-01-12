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

import { config } from 'dotenv';
config();

import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { NFT_POSITION_MANAGER, SLIPPAGE_TOLERANCE } from './utils/constants';
import {
  calculateMinimumAmounts,
  calculateOptimalAmounts,
} from './utils/position';
import { priceToTick } from './utils/price';
import { validateAddLiquidityParams } from './utils/validation';
import { withErrorHandling } from './utils/errorHandler';
import { logger } from './utils/logger';

// * Interface for position parameters
interface AddLiquidityParams {
  tokenA: Token;
  tokenB: Token;
  fee: number;
  amount: string;
  priceLower: number;
  priceUpper: number;
  poolAddress: string;
}

/**
 * ! Main function to add liquidity to a Uniswap V3 pool
 * @param params Configuration parameters for the liquidity position
 */
async function addLiquidity(params: AddLiquidityParams) {
  // ! Validate all input parameters first
  validateAddLiquidityParams(params);

  return await withErrorHandling(
    async () => {
      // * Log the operation start
      logger.info('Adding Liquidity', {
        tokenA: params.tokenA.symbol,
        tokenB: params.tokenB.symbol,
        amount: params.amount,
      });

      // * Initialize provider and wallet using ethers v6 syntax
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      // * Configure pool parameters
      const tokenA = params.tokenA;
      const tokenB = params.tokenB;

      // ! Get pool contract and fetch current state
      const poolContract = new ethers.Contract(
        params.poolAddress,
        ['function slot0() view returns (uint160 sqrtPriceX96, int24 tick)'],
        provider,
      );

      const { sqrtPriceX96, tick } = await poolContract.slot0();

      // * Initialize pool instance
      const pool = new Pool(
        tokenA,
        tokenB,
        params.fee,
        sqrtPriceX96.toString(),
        0, // Initial liquidity
        tick,
      );

      // * Calculate position parameters
      const tickLower = priceToTick(params.priceLower, tokenA, tokenB);
      const tickUpper = priceToTick(params.priceUpper, tokenA, tokenB);

      // ! Calculate optimal amounts based on desired liquidity
      const { amount0, amount1 } = calculateOptimalAmounts(
        pool,
        tickLower,
        tickUpper,
        params.amount,
      );

      // * Calculate minimum amounts with slippage protection
      const { amount0Min, amount1Min } = calculateMinimumAmounts(
        amount0,
        amount1,
        SLIPPAGE_TOLERANCE,
      );

      // ! Approve tokens for position manager
      const tokenAContract = new ethers.Contract(
        tokenA.address,
        ['function approve(address, uint256)'],
        wallet,
      );
      const tokenBContract = new ethers.Contract(
        tokenB.address,
        ['function approve(address, uint256)'],
        wallet,
      );

      console.log('Approving tokens...');
      await tokenAContract.approve(NFT_POSITION_MANAGER, ethers.MaxUint256);
      await tokenBContract.approve(NFT_POSITION_MANAGER, ethers.MaxUint256);

      // ! Create position using NonFungiblePositionManager
      const positionManager = new ethers.Contract(
        NFT_POSITION_MANAGER,
        [
          'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint256 amount0, uint256 amount1)',
        ],
        wallet,
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes

      console.log('Adding liquidity...');
      const tx = await positionManager.mint({
        token0: tokenA.address,
        token1: tokenB.address,
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

// * Export for use in other files
export { addLiquidity, AddLiquidityParams };
