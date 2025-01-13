import { describe, expect, it } from 'vitest';

import { addLiquidity } from '../../scripts/addLiquidity.js';
import { adjustRange } from '../../scripts/adjustRange.js';
import { monitorPosition } from '../../scripts/monitorPosition.js';
import {
  FEE_TIERS,
  POOL_ADDRESS,
  USDC,
  WETH,
} from '../../scripts/utils/constants.js';
import { withdrawLiquidity } from '../../scripts/withdrawLiquidity.js';

describe('Workflow Integration [E2E]', () => {
  it('should execute full position lifecycle', async () => {
    // 1. Add Liquidity
    const addParams = {
      tokenA: WETH,
      tokenB: USDC,
      fee: FEE_TIERS.MEDIUM,
      amount: '0.1',
      priceLower: 1750,
      priceUpper: 1850,
      poolAddress: POOL_ADDRESS,
    };
    const result = await addLiquidity(addParams);
    const tokenId = Number(result.logs?.[0]?.topics?.[1]);
    expect(tokenId).toBeGreaterThan(0); // Means the position was created

    // 2. Monitor Position
    const status = await monitorPosition(tokenId, WETH, USDC);
    expect(status.liquidity).toBeGreaterThan(0n);

    // 3. Adjust Range
    await adjustRange(tokenId, WETH, USDC, {
      newPriceLower: 1800,
      newPriceUpper: 1900,
    });

    // 4. Withdraw
    const withdrawResult = await withdrawLiquidity(tokenId);
    expect(withdrawResult).toBe(true);
  });
});
