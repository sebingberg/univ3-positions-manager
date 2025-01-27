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

import { AddLiquidityParams } from '../addLiquidity.js';
import { AdjustRangeParams } from '../adjustRange.js';
import { FEE_TIERS } from './constants.js';
import { validatePriceRange } from './price.js';

/**
 * @dev Validates parameters for adding liquidity
 * @param params Parameters to validate
 * @throws Error if any parameter is invalid
 */
export function validateAddLiquidityParams(params: AddLiquidityParams): void {
  // Validate tokens
  if (!params.tokenA || !params.tokenB) {
    throw new Error('Both tokens must be specified');
  }
  if (params.tokenA.address === params.tokenB.address) {
    throw new Error('Tokens must be different');
  }

  // Validate fee tier
  if (!Object.values(FEE_TIERS).includes(params.fee)) {
    throw new Error(
      `Invalid fee tier. Must be one of: ${Object.values(FEE_TIERS).join(', ')}`,
    );
  }

  // Validate amount
  const amount = Number(params.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Validate price range
  if (!params.priceLower || !params.priceUpper) {
    throw new Error('Price range must be specified');
  }
  if (params.priceLower >= params.priceUpper) {
    throw new Error('Lower price must be less than upper price');
  }
  if (params.priceLower <= 0 || params.priceUpper <= 0) {
    throw new Error('Prices must be greater than 0');
  }

  // Validate pool address if provided
  if (params.poolAddress && !params.poolAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid pool address format');
  }

  // Get tick spacing for the fee tier
  const tickSpacing = {
    [FEE_TIERS.LOW]: 10,
    [FEE_TIERS.MEDIUM]: 60,
    [FEE_TIERS.HIGH]: 200,
  }[params.fee];

  // Ensure prices are within valid tick range
  validatePriceRange(params.priceLower, params.priceUpper);

  // Validate minimum price difference based on tick spacing
  // The minimum price difference should be at least one tick spacing
  const minTickDiff = tickSpacing;
  const currentTick = Math.floor(
    Math.log(params.priceLower) / Math.log(1.0001),
  );
  const upperTick = Math.floor(Math.log(params.priceUpper) / Math.log(1.0001));

  if (upperTick - currentTick < minTickDiff) {
    throw new Error(
      `Price range too narrow for fee tier ${params.fee}. Minimum tick difference: ${minTickDiff}`,
    );
  }
}

/**
 * @dev Validates parameters for adjusting position range
 * @param params Parameters to validate
 * @throws Error if any parameter is invalid
 */
export function validateAdjustRangeParams(params: AdjustRangeParams): void {
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
