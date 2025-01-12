import { describe, expect, it } from 'vitest';
import { addLiquidity } from '../../scripts/addLiquidity';
import { monitorPosition } from '../../scripts/monitorPosition';
import { FEE_TIERS, USDC, WETH } from '../../scripts/utils/constants';

describe('Error Handling', () => {
  it('should handle invalid price ranges', async () => {
    const params = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '0.1',
      priceLower: 2000, // Higher than upper
      priceUpper: 1800,
      poolAddress: '0x...',
    };

    await expect(addLiquidity(params)).rejects.toThrow();
  });

  it('should handle non-existent positions', async () => {
    await expect(monitorPosition(99999, WETH, USDC)).rejects.toThrow();
  });

  it('should handle insufficient balance', async () => {
    const params = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '1000000', // Unrealistic amount
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: '0x...',
    };

    await expect(addLiquidity(params)).rejects.toThrow();
  });
});
