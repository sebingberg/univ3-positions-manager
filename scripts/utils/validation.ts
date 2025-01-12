/**
 * @file validation.ts
 * @description Input validation utilities for liquidity operations.
 * Provides validation for:
 * - Add liquidity parameters
 * - Range adjustment parameters
 * - Pool addresses
 * - Price ranges
 *
 * @example
 * ```typescript
 * validateAddLiquidityParams({
 *   tokenA: WETH,
 *   tokenB: USDC,
 *   fee: FEE_TIERS.MEDIUM,
 *   amount: "1.5"
 * })
 * ```
 *
 * ! Important: All parameters should be validated before blockchain interaction
 * * Note: Throws descriptive errors for invalid inputs
 */

import { AddLiquidityParams } from '../addLiquidity';
import { AdjustRangeParams } from '../adjustRange';
import { FEE_TIERS, POOL_ADDRESS } from './constants';
import { validatePriceRange } from './price';

/**
 * @dev Validates parameters for adding liquidity
 * @param params Parameters to validate
 * @throws Error if any parameter is invalid
 */
export function validateAddLiquidityParams(params: AddLiquidityParams) {
  if (!params.tokenA || !params.tokenB) {
    throw new Error('Both tokens must be provided');
  }

  if (params.tokenA.address === params.tokenB.address) {
    throw new Error('Tokens must be different');
  }

  if (!Object.values(FEE_TIERS).includes(params.fee)) {
    throw new Error('Invalid fee tier');
  }

  if (parseFloat(params.amount) <= 0) {
    throw new Error('Amount must be positive');
  }

  validatePriceRange(params.priceLower, params.priceUpper);
  validatePoolAddress(params.poolAddress || POOL_ADDRESS);
}

/**
 * @dev Validates parameters for adjusting position range
 * @param params Parameters to validate
 * @throws Error if any parameter is invalid
 */
export function validateAdjustRangeParams(params: AdjustRangeParams) {
  if (!params.newPriceLower || !params.newPriceUpper) {
    throw new Error('Price range must be specified');
  }

  validatePriceRange(params.newPriceLower, params.newPriceUpper);

  if (params.slippageTolerance) {
    if (params.slippageTolerance <= 0 || params.slippageTolerance >= 100) {
      throw new Error('Slippage tolerance must be between 0 and 100');
    }
  }
}

/**
 * @dev Validates Ethereum address (eg: '0x___') format for pools
 * @param address Pool address to validate
 * @throws Error if address format is invalid
 */
function validatePoolAddress(address: string) {
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid pool address format');
  }
}
