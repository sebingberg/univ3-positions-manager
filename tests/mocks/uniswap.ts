/**
 * @file tests/mocks/uniswap.ts
 * @description Mock data for Uniswap V3 tests based on real Sepolia testnet values
 */

import { Token } from '@uniswap/sdk-core';
import { Pool, TickMath } from '@uniswap/v3-sdk';

import { CHAIN_ID } from '../../scripts/utils/constants.js';

// Mock tokens with real Sepolia addresses
export const MockTokens = {
  WETH: new Token(
    CHAIN_ID,
    '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  USDC: new Token(
    CHAIN_ID,
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    6,
    'USDC',
    'USD Coin',
  ),
  USDT: new Token(
    CHAIN_ID,
    '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    6,
    'USDT',
    'Tether USD',
  ),
  WBTC: new Token(
    CHAIN_ID,
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
} as const;

// Calculate sqrtPriceX96 from tick using SDK's TickMath
const currentTick = 166500; // Tick for ~61,840 USDC/WETH
const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick).toString();

// Mock pool data from Sepolia WETH/USDC pool
export const MockPool = {
  // Current pool state from Sepolia
  slot0: {
    sqrtPriceX96, // Calculated from tick using SDK
    tick: currentTick, // Exact Sepolia value
    observationIndex: 421,
    observationCardinality: 723,
    observationCardinalityNext: 723,
    feeProtocol: 0,
    unlocked: true,
  },
  // Position data with real Sepolia values
  position: {
    token0: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH
    token1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
    fee: 500, // 0.05% fee tier
    tickLower: 163420, // Real position from Sepolia
    tickUpper: 170320, // Real position from Sepolia
    liquidity: '540841577121120934', // Exact Sepolia liquidity
  },
  // Price ranges for tests (from real position)
  prices: {
    current: 61840.6, // Current Sepolia price
    min: 40009.5, // Real min price
    max: 80004.5, // Real max price
  },
  // Pool instance for SDK operations
  instance: new Pool(
    MockTokens.WETH,
    MockTokens.USDC,
    500, // 0.05% fee tier
    sqrtPriceX96,
    '540841577121120934', // Exact Sepolia liquidity
    currentTick,
  ),
  liquidity: '540841577121120934', // Exact Sepolia liquidity

  // Add test prices for different token pairs
  testPrices: {
    WBTC_USDC: 43250.75, // Example BTC/USDC price
    USDT_USDC: 1.0001, // Example USDT/USDC price
  },
};

// Mock fee tiers (standard Uniswap V3 values)
export const MockFeeTiers = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

// Mock tick spacings (standard Uniswap V3 values)
export const MockTickSpacings = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};
