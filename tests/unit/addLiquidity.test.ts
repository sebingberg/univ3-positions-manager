import { ethers } from 'ethers';
import { describe, expect, it } from 'vitest';
import { addLiquidity } from '../../scripts/addLiquidity';
import {
  FEE_TIERS,
  NFT_POSITION_MANAGER,
  USDC,
  WETH,
} from '../../scripts/utils/constants';

describe('Add Liquidity [scripts/addLiquidity.ts]', () => {
  it('should add liquidity with valid parameters', async () => {
    const params = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: '0x1234567890123456789012345678901234567890',
    };

    const result = await addLiquidity(params);
    expect(result).toBeDefined();
  });

  it('should handle token approvals', async () => {
    const provider = new ethers.JsonRpcProvider();
    const contract = new ethers.Contract(NFT_POSITION_MANAGER, [], provider);

    expect(contract.allowance).toHaveBeenCalled();
    expect(contract.approve).toHaveBeenCalled();
  });

  it('should validate price ranges', async () => {
    const params = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: 1850, // Invalid: lower > upper
      priceUpper: 1750,
      poolAddress: '0x1234567890123456789012345678901234567890',
    };

    await expect(addLiquidity(params)).rejects.toThrow();
  });

  it('should handle different fee tiers', async () => {
    const paramsLow = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.LOW,
      amount: '1.5',
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: '0x1234567890123456789012345678901234567890',
    };

    await expect(addLiquidity(paramsLow)).resolves.toBeDefined();
  });
});
