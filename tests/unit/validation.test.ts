import { describe, it, expect } from 'vitest';
import { validateAddLiquidityParams } from '../../scripts/utils/validation';
import {
  WETH,
  USDC,
  FEE_TIERS,
  POOL_ADDRESS,
} from '../../scripts/utils/constants';

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
