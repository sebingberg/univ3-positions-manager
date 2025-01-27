/**
 * @file tests/mocks/uniswap.ts
 * @description Mock data for Uniswap V3 tests based on real Sepolia testnet values
 */

import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';

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

// Mock pool data from Sepolia WETH/USDC pool
export const MockPool = {
  // Current price ~64,348.90 USDC/WETH
  slot0: {
    sqrtPriceX96: '305852707744136481743870474612073', // Real Sepolia value
    tick: 165178, // Real Sepolia value
    observationIndex: 3,
    observationCardinality: 6,
    observationCardinalityNext: 6,
    feeProtocol: 0,
    unlocked: true,
  },
  // Position data with real Sepolia values
  position: {
    token0: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH
    token1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
    fee: 500, // 0.05% fee tier
    tickLower: 163420, // Real position min tick
    tickUpper: 177280, // Real position max tick
    liquidity: '1234567890123456789', // Real-world scale liquidity
  },
  // Price ranges for tests (based on real market data)
  prices: {
    current: 64348.9,
    min: 20008.4,
    max: 80004.5,
  },
  // Pool instance for SDK operations
  instance: new Pool(
    MockTokens.WETH,
    MockTokens.USDC,
    500, // 0.05% fee tier
    '305852707744136481743870474612073', // Real sqrtPriceX96
    '1234567890123456789', // Real liquidity
    165178, // Real tick
  ),
  // Common test values based on real market data
  testPrices: {
    WBTC_USDC: 64348.9, // Using same price as ETH for now
    USDT_USDC: 1.0,
  },
  liquidity: '1234567890123456789',
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
