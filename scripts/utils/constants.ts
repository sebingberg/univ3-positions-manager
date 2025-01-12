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
import { config } from 'dotenv';

config();

// Network
export const CHAIN_ID = Number(process.env.CHAIN_ID);
export const NETWORK_NAME = process.env.NETWORK_NAME;

// Tokens
export const WETH = new Token(
  CHAIN_ID,
  process.env.WETH_ADDRESS!,
  18,
  'WETH',
  'Wrapped Ether',
);

export const USDC = new Token(
  CHAIN_ID,
  process.env.USDC_ADDRESS!,
  6,
  'USDC',
  'USD Coin',
);

// Uniswap
export const POOL_ADDRESS = process.env.POOL_ADDRESS!;
export const NFT_POSITION_MANAGER = process.env.NFT_POSITION_MANAGER!;

// Other constants remain the same
export const FEE_TIERS = {
  LOW: 500, // 0.05% or 500 bp
  MEDIUM: 3000, // 0.3% or 3000 bp
  HIGH: 10000, // 1% or 10000 bp
} as const;

export const SLIPPAGE_TOLERANCE = 0.5; // 0.5%

// * Useful constants for contract interactions
export const MaxUint128 = 2n ** 128n - 1n; // Since Ethers v6 doesn't provide this
