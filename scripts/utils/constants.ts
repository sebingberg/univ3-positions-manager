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

// Load environment variables from .env file
config();

// Network
export const CHAIN_ID = 11155111; // Sepolia
export const NETWORK_NAME = 'sepolia';

// Environment validation
function validateEnvironment(): void {
  if (!process.env.RPC_URL) {
    throw new Error(
      'RPC_URL environment variable is not set. Please create a .env file with your RPC endpoint.',
    );
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error(
      'PRIVATE_KEY environment variable is not set. Please create a .env file with your private key.',
    );
  }
}

// Run validation when constants are imported
validateEnvironment();

// Environment variables
export const RPC_URL = process.env.RPC_URL!;
export const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// Contract Addresses
export const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
export const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
export const POOL_ADDRESS = '0x3289680dD4d6C10bb19b899729cda5eEF58AEfF1';
export const NFT_POSITION_MANAGER =
  '0x1238536071E1c677A632429e3655c799b22cDA52';

// Tokens
export const WETH = new Token(
  CHAIN_ID,
  WETH_ADDRESS,
  18,
  'WETH',
  'Wrapped Ether',
);

export const USDC = new Token(CHAIN_ID, USDC_ADDRESS, 6, 'USDC', 'USD Coin');

// Fee tiers
export const FEE_TIERS = {
  LOW: 500,
  MEDIUM: 3000,
  HIGH: 10000,
} as const satisfies Record<string, 500 | 3000 | 10000>;

export const SLIPPAGE_TOLERANCE = 0.5; // 0.5%

// * Useful constants for contract interactions
export const MaxUint128 = 2n ** 128n - 1n; // Since Ethers v6 doesn't provide this

export const TICK_SPACINGS = {
  500: 10, // 0.05% fee tier
  3000: 60, // 0.3% fee tier
  10000: 200, // 1% fee tier
} as const;
