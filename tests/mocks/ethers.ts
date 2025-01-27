import { vi } from 'vitest';

// Base contract methods shared across all mocks
export const baseContractMethods = {
  interface: {
    getFunction: vi.fn(),
    format: vi.fn(),
  },
  filters: {},
  runner: {
    provider: {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111 }),
    },
  },
  connect: vi.fn(),
  attach: vi.fn(),
  getAddress: vi.fn().mockResolvedValue('0x1234...'),
  positions: vi.fn().mockResolvedValue({
    nonce: 0n,
    operator: '0x0000000000000000000000000000000000000000',
    token0: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    token1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    fee: 3000,
    tickLower: -201360,
    tickUpper: -201260,
    liquidity: 1000n,
    feeGrowthInside0LastX128: 0n,
    feeGrowthInside1LastX128: 0n,
    tokensOwed0: 0n,
    tokensOwed1: 0n,
  }),
  slot0: vi.fn().mockResolvedValue({
    sqrtPriceX96: 1829744519839346509000000000000000000n,
    tick: -201360,
    observationIndex: 0,
    observationCardinality: 0,
    observationCardinalityNext: 0,
    feeProtocol: 0,
    unlocked: true,
  }),
  decreaseLiquidity: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({
      hash: '0x1234...',
      logs: [],
    }),
  }),
  collect: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({
      hash: '0x1234...',
      logs: [],
    }),
  }),
  increaseLiquidity: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({
      hash: '0x1234...',
      logs: [],
    }),
  }),
  mint: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({
      hash: '0x1234...',
      logs: [
        {
          topics: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
        },
      ],
    }),
  }),
};

// Mock ethers exports
export const mockEthers = {
  Contract: vi.fn().mockImplementation(() => baseContractMethods),
  JsonRpcProvider: vi.fn().mockImplementation(() => ({
    getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111 }),
  })),
  Wallet: vi.fn().mockImplementation(() => ({
    address: '0x1234...',
    connect: vi.fn().mockReturnThis(),
  })),
  MaxUint256: BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  ),
};
