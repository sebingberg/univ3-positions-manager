// Mock modules first
// Imports after mocks
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addLiquidity } from '../../scripts/addLiquidity.js';
import {
  FEE_TIERS,
  NFT_POSITION_MANAGER,
} from '../../scripts/utils/constants.js';
import { MockPool, MockTokens } from '../mocks/uniswap.js';

vi.mock('ethers', async () => {
  const { mockEthers } = await import('../mocks/ethers.js');
  return {
    ethers: mockEthers,
  };
});

vi.mock('process', async () => {
  const { MockEnvironment } = await import('../mocks/environment.js');
  return {
    env: {
      RPC_URL: MockEnvironment.rpcUrl,
      PRIVATE_KEY: MockEnvironment.privateKey,
    },
  };
});

vi.mock('@uniswap/v3-sdk', async () => {
  const { MockPool } = await import('../mocks/uniswap.js');
  return {
    Pool: vi.fn().mockImplementation(() => MockPool.instance),
  };
});

describe('Add Liquidity [scripts/addLiquidity.ts]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add liquidity with valid parameters', async () => {
    const params = {
      tokenA: MockTokens.WETH,
      tokenB: MockTokens.USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: MockPool.prices.min,
      priceUpper: MockPool.prices.max,
      poolAddress: MockPool.position.token0,
    };

    const result = await addLiquidity(params);
    expect(result).toBeDefined();
  });

  it('should handle token approvals', async () => {
    // Create a new contract instance
    const contract = new ethers.Contract(NFT_POSITION_MANAGER, [], null);

    // Add liquidity to trigger approvals
    await addLiquidity({
      tokenA: MockTokens.WETH,
      tokenB: MockTokens.USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: MockPool.prices.min,
      priceUpper: MockPool.prices.max,
      poolAddress: MockPool.position.token0,
    });

    // Verify contract calls
    expect(contract.allowance).toHaveBeenCalled();
    expect(contract.approve).toHaveBeenCalled();
  });

  it('should validate price ranges', async () => {
    const params = {
      tokenA: MockTokens.WETH,
      tokenB: MockTokens.USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1.5',
      priceLower: MockPool.prices.max, // Invalid: lower > upper
      priceUpper: MockPool.prices.min,
      poolAddress: MockPool.position.token0,
    };

    await expect(addLiquidity(params)).rejects.toThrow(
      'Lower price must be less than upper price',
    );
  });
});
