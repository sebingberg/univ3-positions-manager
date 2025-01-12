#!/usr/bin/env node

/**
 * @file cli.ts
 * @description Command Line Interface for Uniswap V3 Position Manager
 * 
 * ! IMPORTANT: Before using this CLI, ensure you have:
 * ! 1. Set up your .env file with RPC_URL and PRIVATE_KEY
 * ! 2. Updated POOL_ADDRESS in constants.ts
 * ! 3. Have sufficient token balances
 */

import { Command } from 'commander';
import { addLiquidity, AddLiquidityParams } from './addLiquidity';
import { monitorPosition } from './monitorPosition';
import { adjustRange } from './adjustRange';
import { withdrawLiquidity } from './withdrawLiquidity';
import { WETH, USDC, FEE_TIERS, POOL_ADDRESS } from './utils/constants';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('univ3-manager')
  .description('CLI to manage Uniswap V3 positions')
  .version('1.0.0');

program
  .command('add')
  .description('Add liquidity to existing position')
  // TODO: Add support for different token pairs
  // .requiredOption('-t0, --token0 <address>', 'Token0 address')
  // .requiredOption('-t1, --token1 <address>', 'Token1 address')
  // Currently hardcoded to WETH/USDC pair
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-a, --amount <amount>', 'Amount of ETH to provide')
  .requiredOption('-l, --lower <price>', 'Lower price bound')
  .requiredOption('-u, --upper <price>', 'Upper price bound')
  .requiredOption('-f, --fee <tier>', 'Fee tier (LOW, MEDIUM, HIGH)')
  .action(async (options) => {
    try {
      const params: AddLiquidityParams = {
        tokenA: WETH,
        tokenB: USDC,
        fee: FEE_TIERS[options.fee as keyof typeof FEE_TIERS],
        amount: options.amount,
        priceLower: Number(options.lower),
        priceUpper: Number(options.upper),
        poolAddress: POOL_ADDRESS, // ! TODO: Ensure this is set in constants.ts
      };
      const result = await addLiquidity(params);
      logger.info('Liquidity Added to Position', { 
        tokenId: options.id,
        addedLiquidity: result?.events?.[0]?.args?.liquidity?.toString(),
        params 
      });
    } catch (error) {
      logger.error('Failed to add liquidity to position', { 
        error: (error as Error).message,
        tokenId: options.id,
        params: options 
      });
    }
  });

program
  .command('monitor')
  .description('Monitor existing position')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .action(async (options) => {
    try {
      const status = await monitorPosition(Number(options.id), WETH, USDC);
      logger.info('Position Status', { status });
    } catch (error) {
      logger.error('Failed to monitor position', { 
        error: (error as Error).message,
        tokenId: options.id 
      });
    }
  });

program
  .command('adjust')
  .description('Adjust position range')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-l, --lower <price>', 'New lower price bound')
  .requiredOption('-u, --upper <price>', 'New upper price bound')
  .requiredOption('-s, --slippage <percentage>', 'Slippage tolerance in percentage')
  .action(async (options) => {
    try {
      await adjustRange(Number(options.id), WETH, USDC, {
        newPriceLower: Number(options.lower),
        newPriceUpper: Number(options.upper),
        slippageTolerance: Number(options.slippage),
      });
      logger.info('Range Adjusted Successfully', { 
        tokenId: options.id,
        newRange: { lower: options.lower, upper: options.upper }
      });
    } catch (error) {
      logger.error('Failed to adjust range', { 
        error: (error as Error).message,
        params: options 
      });
    }
  });

program
  .command('withdraw')
  .description('Withdraw liquidity')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-p, --percentage <amount>', 'Percentage to withdraw (1-100)')
  .requiredOption('-f, --fees <boolean>', 'Whether to collect fees (true/false)')
  .action(async (options) => {
    try {
      await withdrawLiquidity(Number(options.id), {
        percentageToWithdraw: Number(options.percentage),
        collectFees: options.fees === 'true',
      });
      logger.info('Withdrawal Successful', { 
        tokenId: options.id,
        percentage: options.percentage,
        collectFees: options.fees
      });
    } catch (error) {
      logger.error('Failed to withdraw', { 
        error: (error as Error).message,
        params: options 
      });
    }
  });

program.parse(); 