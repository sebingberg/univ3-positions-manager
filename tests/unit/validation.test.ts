import { describe, expect, it } from 'vitest';

import {
  FEE_TIERS,
  POOL_ADDRESS,
  USDC,
  WETH,
} from '../../scripts/utils/constants';
import { validateAddLiquidityParams } from '../../scripts/utils/validation';

describe('Input Validation', () => {
  it('should validate add liquidity parameters', () => {
    const validParams = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: POOL_ADDRESS,
    };

    expect(() => validateAddLiquidityParams(validParams)).not.toThrow();
  });

  it('should reject invalid amounts', () => {
    const invalidParams = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '-1.5', // Negative amount
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: POOL_ADDRESS,
    };

    expect(() => validateAddLiquidityParams(invalidParams)).toThrow();
  });
});
