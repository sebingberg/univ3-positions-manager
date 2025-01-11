import { ethers } from 'ethers';
import { describe, expect, it } from 'vitest';
import { NFT_POSITION_MANAGER } from '../../scripts/utils/constants';
import { withdrawLiquidity } from '../../scripts/withdrawLiquidity';

describe('Withdraw Liquidity [scripts/withdrawLiquidity.ts]', () => {
  it('should withdraw full position', async () => {
    const tokenId = 123;
    const result = await withdrawLiquidity(tokenId);
    expect(result).toBe(true);
  });

  it('should handle partial withdrawals', async () => {
    const tokenId = 123;
    const result = await withdrawLiquidity(tokenId, {
      percentageToWithdraw: 50,
      collectFees: true,
    });
    expect(result).toBe(true);
  });

  it('should respect withdrawal options', async () => {
    const tokenId = 123;
    const provider = new ethers.JsonRpcProvider();
    const contract = new ethers.Contract(NFT_POSITION_MANAGER, [], provider);

    await withdrawLiquidity(tokenId, { collectFees: false });
    expect(contract.collect).not.toHaveBeenCalled();
  });
});
