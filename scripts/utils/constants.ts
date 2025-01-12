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
 * ! IMPORTANT: UPDATE THESE VALUES WHEN CHANGING NETWORKS:
 * ! 1. NETWORK name
 * ! 2. RPC_URL for the target network
 * ! 3. NFT_POSITION_MANAGER address
 * ! 4. SWAP_ROUTER address
 * ! 5. WETH token address and chainId
 * ! 6. USDC token address and chainId
 * ! 7. POOL_ADDRESS for your WETH/USDC pair
 * 
 * * Note: Current values are for Sepolia testnet
 * * Note: Fee tiers are in basis points (1 bp = 0.01%)
 */

import { Token } from '@uniswap/sdk-core';

// ! Network Configuration
export const NETWORK = 'sepolia';
export const RPC_URL = process.env.SEPOLIA_RPC_URL;

// * Contract Addresses for Uniswap V3 on Sepolia Testnet
// ! Update these addresses when deploying to different networks
export const NFT_POSITION_MANAGER =
  '0x1238536071E1c677A632429e3655c799b22cDA52';
export const SWAP_ROUTER = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E';

// * Test Tokens Configuration
// ! Update token addresses and chainId for different networks
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
  6, // ! Important: USDC uses 6 decimals, not 18
  'USDC',
  'USD Coin',
);

// * Fee tiers available in UniswapV3 pools
export const FEE_TIERS = {
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

// * Default safety parameters
export const SLIPPAGE_TOLERANCE = 0.005; // 0.5% slippage tolerance

// * Useful constants for contract interactions
export const MaxUint128 = 2n ** 128n - 1n;

// TODO Add your Sepolia WETH/USDC pool address here
export const POOL_ADDRESS = '0x...' // Update this with your pool address
