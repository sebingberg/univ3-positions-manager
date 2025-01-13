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
import { ethers } from 'ethers';

import { addLiquidity } from './addLiquidity.js';
import { adjustRange } from './adjustRange.js';
import { formatPositionStatus, monitorPosition } from './monitorPosition.js';
import { ERC20_ABI } from './utils/abis.js';
import { FEE_TIERS, USDC, WETH } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { withdrawLiquidity } from './withdrawLiquidity.js';

const program = new Command();

program
  .name('univ3-positions-manager')
  .description('CLI to manage Uniswap V3 positions')
  .version('1.0.0');

program
  .command('add')
  .description('Add liquidity to an existing position')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-a, --amount <amount>', 'Amount of tokens to add')
  .requiredOption('-t, --token <token>', 'Token to add (WETH or USDC)')
  .action(async (options) => {
    try {
      const params = {
        tokenA: options.token === 'WETH' ? WETH : USDC,
        tokenB: options.token === 'WETH' ? USDC : WETH,
        fee: FEE_TIERS.MEDIUM,
        amount: options.amount.toString(),
        priceLower: 0,
        priceUpper: 0,
      };
      await addLiquidity(params);
      logger.info('Liquidity Added Successfully', {
        tokenId: options.id,
        amount: options.amount,
        token: options.token,
      });
    } catch (error) {
      logger.error('Failed to add liquidity', {
        error: (error as Error).message,
        tokenId: options.id,
      });
    }
  });

program
  .command('monitor')
  .description('Monitor a liquidity position')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .action(async (options) => {
    try {
      const tokenId = parseInt(options.id);
      if (isNaN(tokenId)) {
        throw new Error('Invalid token ID format');
      }

      const status = await monitorPosition(tokenId, WETH, USDC);
      console.log(formatPositionStatus(status, WETH, USDC));
    } catch (error) {
      logger.error('Failed to monitor position', {
        error: error instanceof Error ? error.message : String(error),
        tokenId: options.id,
      });
      process.exit(1);
    }
  });

program
  .command('adjust')
  .description('Adjust position range')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-l, --lower <price>', 'New lower price bound')
  .requiredOption('-u, --upper <price>', 'New upper price bound')
  .requiredOption(
    '-s, --slippage <percentage>',
    'Slippage tolerance in percentage',
  )
  .action(async (options) => {
    try {
      await adjustRange(Number(options.id), WETH, USDC, {
        newPriceLower: Number(options.lower),
        newPriceUpper: Number(options.upper),
        slippageTolerance: Number(options.slippage),
      });
      logger.info('Range Adjusted Successfully', {
        tokenId: options.id,
        newRange: { lower: options.lower, upper: options.upper },
      });
    } catch (error) {
      logger.error('Failed to adjust range', {
        error: (error as Error).message,
        params: options,
      });
    }
  });

program
  .command('withdraw')
  .description('Withdraw liquidity')
  .requiredOption('-i, --id <tokenId>', 'Position token ID')
  .requiredOption('-p, --percentage <amount>', 'Percentage to withdraw (1-100)')
  .requiredOption(
    '-f, --fees <boolean>',
    'Whether to collect fees (true/false)',
  )
  .action(async (options) => {
    try {
      await withdrawLiquidity(Number(options.id), {
        percentageToWithdraw: Number(options.percentage),
        collectFees: options.fees === 'true',
      });
      logger.info('Withdrawal Successful', {
        tokenId: options.id,
        percentage: options.percentage,
        collectFees: options.fees,
      });
    } catch (error) {
      logger.error('Failed to withdraw', {
        error: (error as Error).message,
        params: options,
      });
    }
  });

program
  .command('check-allowance')
  .description('Check token approval for Position Manager')
  .requiredOption('-t, --token <token>', 'Token to check (WETH or USDC)')
  .requiredOption(
    '-s, --spender <address>',
    'Spender address (Position Manager)',
  )
  .action(async (options) => {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      const token = options.token === 'WETH' ? WETH : USDC;
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider,
      );

      const allowance = await tokenContract.allowance(
        wallet.address,
        options.spender,
      );

      logger.info('Current Allowance', {
        token: options.token,
        spender: options.spender,
        allowance: ethers.formatUnits(allowance, token.decimals),
      });
    } catch (error) {
      logger.error('Failed to check allowance', {
        error: (error as Error).message,
        token: options.token,
      });
    }
  });

program.parse();
