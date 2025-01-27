/**
 * @file tests/mocks/uniswap.ts
 * @description Mock data for Uniswap V3 tests based on real Sepolia testnet values
 */

import { Token } from '@uniswap/sdk-core';
import { CHAIN_ID, USDC, WETH } from '../../scripts/utils/constants.js';

// Mock tokens with real Sepolia addresses
export const MockTokens = {
  WETH,
  USDC,
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
};

// Mock pool data from Sepolia WETH/USDC pool
export const MockPool = {
  // From slot0() query
  slot0: {
    sqrtPriceX96: '305852707744136481743870474612073',
    tick: 165178,
    observationIndex: 3,
    observationCardinality: 6,
    observationCardinalityNext: 6,
    feeProtocol: 0,
    unlocked: true,
  },
  // Real position data
  position: {
    id: 36468,
    owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    tickLower: 163420,
    tickUpper: 177280,
    liquidity: '1234567890',
    token0: WETH.address,
    token1: USDC.address,
    fee: 500, // 0.05%
  },
  // Price ranges
  prices: {
    current: 67067.1,
    min: 20008.4,
    max: 80004.5,
  },
  // Common test values
  testPrices: {
    WBTC_USDC: 42000.5,
    USDT_USDC: 1.0,
  },
};

// Mock fee tiers
export const MockFeeTiers = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

// Mock tick spacings
export const MockTickSpacings = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};
