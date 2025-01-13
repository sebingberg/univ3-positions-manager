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

import { Pool } from '@uniswap/v3-sdk';
import { Command } from 'commander';
import { ethers } from 'ethers';

import { addLiquidity } from './addLiquidity.js';
import { adjustRange } from './adjustRange.js';
import { formatPositionStatus, monitorPosition } from './monitorPosition.js';
import { ERC20_ABI, POOL_ABI } from './utils/abis.js';
import { POOL_ADDRESS, USDC, WETH } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { calculateOptimalAmounts } from './utils/position.js';
import { priceToTick, tickToTokenPrice } from './utils/price.js';
import { withdrawLiquidity } from './withdrawLiquidity.js';

const program = new Command();

program
  .name('univ3-positions-manager')
  .description('CLI to manage Uniswap V3 positions')
  .version('1.0.0');

program
  .command('add')
  .description('Add liquidity to create a new Uniswap V3 position')
  .requiredOption('-t, --token-pair <pair>', 'Trading pair (e.g., USDC/WETH)')
  .requiredOption('-l, --price-lower <price>', 'Lower price bound')
  .requiredOption('-u, --price-upper <price>', 'Upper price bound')
  .requiredOption('-a, --amount <amount>', 'Amount of token0 to add')
  .requiredOption('-f, --fee <fee>', 'Fee tier (500, 3000, or 10000)')
  .option('--dry-run', 'Calculate amounts without executing transaction')
  .action(async (options) => {
    try {
      // Parse and validate trading pair
      const [token0Symbol, token1Symbol] = options.tokenPair.split('/');
      if (!token0Symbol || !token1Symbol) {
        throw new Error('Invalid trading pair format. Use format: USDC/WETH');
      }

      // Currently supporting only USDC/WETH pair
      // TODO: Add support for other pairs
      if (
        !(
          (token0Symbol === 'USDC' && token1Symbol === 'WETH') ||
          (token0Symbol === 'WETH' && token1Symbol === 'USDC')
        )
      ) {
        throw new Error('Currently only USDC/WETH pair is supported');
      }

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const poolContract = new ethers.Contract(
        POOL_ADDRESS,
        POOL_ABI,
        provider,
      );
      const slot0 = await poolContract.slot0();

      // Get token instances based on input order
      const baseToken = token0Symbol === 'WETH' ? WETH : USDC;
      const quoteToken = token1Symbol === 'WETH' ? WETH : USDC;

      // Get current price and format amounts
      const currentPrice = tickToTokenPrice(slot0.tick, baseToken, quoteToken);
      const priceLower = Number(options.priceLower);
      const priceUpper = Number(options.priceUpper);

      // Add validation for price ranges
      if (priceLower > 100000 || priceUpper > 100000) {
        throw new Error('Price values are too high. Please use a lower range.');
      }

      logger.debug('Price range validation passed', {
        priceLower,
        priceUpper,
        currentPrice,
      });

      // Calculate token amounts
      const pool = new Pool(
        baseToken,
        quoteToken,
        Number(options.fee),
        slot0.sqrtPriceX96.toString(),
        '0',
        slot0.tick,
      );

      // Add debug logging for pool information
      logger.debug('Pool Information', {
        baseToken: baseToken.symbol,
        quoteToken: quoteToken.symbol,
        fee: options.fee,
        sqrtPrice: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick,
      });

      // Add debug logging for price conversion
      logger.debug('Price to Tick Conversion', {
        priceLower,
        priceUpper,
        baseToken: baseToken.symbol,
        quoteToken: quoteToken.symbol,
      });

      const lowerTick = priceToTick(priceLower, baseToken, quoteToken);
      const upperTick = priceToTick(priceUpper, baseToken, quoteToken);

      logger.debug('Calculated Ticks', {
        lowerTick,
        upperTick,
      });

      const { amount0, amount1 } = calculateOptimalAmounts(
        pool,
        lowerTick,
        upperTick,
        options.amount,
      );

      logger.debug('Calculated Amounts', {
        amount0: amount0.toString(),
        amount1: amount1.toString(),
      });

      const preview = {
        currentPrice: `${currentPrice.toLocaleString()} USDC per WETH`,
        priceRange: `${priceLower.toLocaleString()} - ${priceUpper.toLocaleString()} USDC per WETH`,
        inRange: currentPrice >= priceLower && currentPrice <= priceUpper,
        requiredWETH: ethers.formatUnits(amount0, 18),
        requiredUSDC: ethers.formatUnits(amount1, 6),
        feeTier: `${Number(options.fee) / 10000}%`,
      };

      logger.info('Position Preview', preview);

      if (options.dryRun) {
        logger.info('Dry run completed. No transaction executed.', {
          preview: 'dry-run',
        });
        return;
      }

      // Get token instances - declare these before using them
      const token0 = token0Symbol === 'WETH' ? WETH : USDC;
      const token1 = token1Symbol === 'WETH' ? WETH : USDC;

      // Declare fee before using it
      const fee = Number(options.fee);
      if (![500, 3000, 10000].includes(fee)) {
        throw new Error('Fee must be one of: 500, 3000, 10000');
      }

      // Continue with actual position creation if not dry run
      logger.info('Creating position...', {
        pair: options.tokenPair,
        priceRange: { lower: priceLower, upper: priceUpper },
        amount: options.amount,
        fee,
      });

      const receipt = await addLiquidity({
        tokenA: token0,
        tokenB: token1,
        fee: fee as 500 | 3000 | 10000,
        amount: options.amount,
        priceLower,
        priceUpper,
      });

      logger.info('Position created successfully', {
        tokenId: receipt?.logs?.[0]?.topics?.[3]?.toString(),
        pair: options.tokenPair,
        priceRange: `${priceLower} - ${priceUpper}`,
      });
    } catch (error) {
      logger.error('Failed to create position', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      process.exit(1);
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

program
  .command('approve')
  .description('Approve token spending for Position Manager')
  .requiredOption('-t, --token <token>', 'Token to approve (WETH or USDC)')
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
        wallet, // Note: using wallet here for signing
      );

      const tx = await tokenContract.approve(
        options.spender,
        ethers.MaxUint256, // Allow unlimited spending
      );

      logger.info('Approval transaction sent', {
        token: options.token,
        spender: options.spender,
        txHash: tx.hash,
      });

      const receipt = await tx.wait();
      logger.info('Approval confirmed', {
        token: options.token,
        spender: options.spender,
        blockNumber: receipt.blockNumber,
      });
    } catch (error) {
      logger.error('Failed to approve token', {
        error: (error as Error).message,
        token: options.token,
      });
    }
  });

program.parse();
