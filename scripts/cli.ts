#!/usr/bin/env node

/**
 * @file cli.ts
 * @description Command Line Interface for Uniswap V3 Position Manager
 */

import { Command } from 'commander';
import { addLiquidity, AddLiquidityParams } from './addLiquidity';
import { monitorPosition } from './monitorPosition';
import { adjustRange } from './adjustRange';
import { withdrawLiquidity } from './withdrawLiquidity';
import { WETH, USDC, FEE_TIERS } from './utils/constants';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('univ3-manager')
  .description('CLI to manage Uniswap V3 positions')
  .version('1.0.0');

program
  .command('add')
  .description('Add new liquidity position')
  .requiredOption('-a, --amount <amount>', 'Amount of ETH to provide')
  .option('-l, --lower <price>', 'Lower price bound', '1750')
  .option('-u, --upper <price>', 'Upper price bound', '1850')
  .option('-f, --fee <tier>', 'Fee tier (LOW, MEDIUM, HIGH)', 'MEDIUM')
  .option('-p, --pool <address>', 'Pool address', '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640')
  .action(async (options) => {
    try {
      const params: AddLiquidityParams = {
        tokenA: WETH,
        tokenB: USDC,
        fee: FEE_TIERS[options.fee as keyof typeof FEE_TIERS],
        amount: options.amount,
        priceLower: Number(options.lower),
        priceUpper: Number(options.upper),
        poolAddress: options.pool,
      };
      const result = await addLiquidity(params);
      logger.info('Position Created', { 
        tokenId: result?.events?.[0]?.args?.tokenId?.toString() 
      });
    } catch (error) {
      logger.error('Failed to add liquidity', { error: (error as Error).message });
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
      logger.error('Failed to monitor position', { error: (error as Error).message });
    }
  });

program
  .command('adjust')
  .description('Adjust position range')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-l, --lower <price>', 'New lower price bound')
  .requiredOption('-u, --upper <price>', 'New upper price bound')
  .option('-s, --slippage <percentage>', 'Slippage tolerance', '0.5')
  .action(async (options) => {
    try {
      await adjustRange(Number(options.id), WETH, USDC, {
        newPriceLower: Number(options.lower),
        newPriceUpper: Number(options.upper),
        slippageTolerance: Number(options.slippage),
      });
      logger.info('Range Adjusted Successfully', { status: 'complete' });
    } catch (error) {
      logger.error('Failed to adjust range', { error: (error as Error).message });
    }
  });

program
  .command('withdraw')
  .description('Withdraw liquidity')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .option('-p, --percentage <amount>', 'Percentage to withdraw', '100')
  .option('-f, --fees', 'Collect fees', true)
  .action(async (options) => {
    try {
      await withdrawLiquidity(Number(options.id), {
        percentageToWithdraw: Number(options.percentage),
        collectFees: options.fees,
      });
      logger.info('Withdrawal Successful', { status: 'complete' });
    } catch (error) {
      logger.error('Failed to withdraw', { error: (error as Error).message });
    }
  });

program.parse(); 