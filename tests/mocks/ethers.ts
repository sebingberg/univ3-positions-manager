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
    liquidity: 1000n,
    tickLower: -201360,
    tickUpper: -201260,
    feeGrowthInside0LastX128: 0n,
    feeGrowthInside1LastX128: 0n,
    tokensOwed0: 0n,
    tokensOwed1: 0n,
  }),
  slot0: vi.fn().mockResolvedValue({
    sqrtPriceX96: 1829744519839346509n,
    tick: -201360,
    observationIndex: 0,
    observationCardinality: 0,
    observationCardinalityNext: 0,
    feeProtocol: 0,
    unlocked: true,
  }),
  decreaseLiquidity: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({}),
  }),
  collect: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({}),
  }),
  increaseLiquidity: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({}),
  }),
  mint: vi.fn().mockResolvedValue({
    wait: vi.fn().mockResolvedValue({}),
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
  })),
};
