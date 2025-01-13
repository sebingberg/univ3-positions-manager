import { ethers } from 'ethers';
import { describe, expect, it } from 'vitest';

import { adjustRange } from '../../scripts/adjustRange.js';
import {
  NFT_POSITION_MANAGER,
  USDC,
  WETH,
} from '../../scripts/utils/constants.js';

describe('Adjust Range [scripts/adjustRange.ts]', () => {
  it('should adjust position range successfully', async () => {
    const tokenId = 123;
    const params = {
      newPriceLower: 1750,
      newPriceUpper: 1850,
      slippageTolerance: 0.5,
    };

    const result = await adjustRange(tokenId, WETH, USDC, params);
    expect(result).toBe(true);
  });

  it('should handle contract interactions correctly', async () => {
    const tokenId = 123;
    const provider = new ethers.JsonRpcProvider();
    const contract = new ethers.Contract(NFT_POSITION_MANAGER, [], provider);

    expect(contract.positions).toHaveBeenCalledWith(tokenId);
    expect(contract.decreaseLiquidity).toHaveBeenCalled();
    expect(contract.collect).toHaveBeenCalled();
    expect(contract.mint).toHaveBeenCalled();
  });
});
