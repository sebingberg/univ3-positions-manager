import { describe, expect, it } from 'vitest';
import {
    formatPositionStatus,
    monitorPosition,
} from '../../scripts/monitorPosition';
import { USDC, WETH } from '../../scripts/utils/constants';

describe('Monitor Position [scripts/monitorPosition.ts]', () => {
  it('should return position status', async () => {
    const tokenId = 123;
    const status = await monitorPosition(tokenId, WETH, USDC);

    expect(status.tokenId).toBe(tokenId);
    expect(status.liquidity).toBeDefined();
    expect(status.currentPrice).toBeCloseTo(1800, 0);
  });

  it('should format position status correctly', () => {
    const status = {
      tokenId: 123,
      liquidity: 1000n,
      feeGrowthInside0: 0n,
      feeGrowthInside1: 0n,
      tokensOwed0: 100n,
      tokensOwed1: 200n,
      currentPrice: 1800,
    };

    const formatted = formatPositionStatus(status, WETH, USDC);
    expect(formatted).toContain('Position Status for Token ID: 123');
    expect(formatted).toContain('USDC per WETH');
  });
});
