/**
 * @file utils/constants.ts
 * @description Central repository for all constants used across the project.
 * Includes:
 * - Network configurations
 * - Contract addresses
 * - Token definitions
 * - Fee tier settings
 * - Default parameters
 *
 * @example
 * ```typescript
 * import { NFT_POSITION_MANAGER, WETH, USDC, FEE_TIERS } from './constants'
 * ```
 *
 * ! Important: All addresses are for Sepolia testnet
 * * Note: Fee tiers are in basis points (1 bp = 0.01%)
 * * Note: Update addresses when deploying to different networks
 */

import { Token } from '@uniswap/sdk-core';

// ! Network Configuration - Critical for deployment
export const NETWORK = 'sepolia';
export const RPC_URL = process.env.SEPOLIA_RPC_URL;

// * Contract Addresses for Uniswap V3 on Sepolia TestNet
// * These addresses are specific to Sepolia and will need to be changed for other networks
export const NFT_POSITION_MANAGER =
  '0x1238536071E1c677A632429e3655c799b22cDA52';
export const SWAP_ROUTER = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E';

// * Test Tokens Configuration
// ? Note: Make sure these tokens have sufficient liquidity on Sepolia
export const WETH = new Token(
  11155111, // Sepolia chainId
  '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  18,
  'WETH',
  'Wrapped Ether',
);

export const USDC = new Token(
  11155111,
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  6, // ! Important: USDC token contract uses 6 decimals, not 18
  'USDC',
  'USD Coin',
);

// * Fee tiers available in UniswapV3 pools
// ? Choose based on expected pair volatility:
// * - LOW: Stable pairs (e.g., USDC/USDT)
// * - MEDIUM: Standard pairs (e.g., WETH/USDC)
// * - HIGH: Exotic pairs (e.g., ETH/FXS)
export const FEE_TIERS = {
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

// * Default safety parameters
export const SLIPPAGE_TOLERANCE = 0.005; // 0.5% slippage tolerance

// * Useful constants for contract interactions
export const MaxUint128 = 2n ** 128n - 1n; // * Maximum value for uint128 (not available in ethers v6)
