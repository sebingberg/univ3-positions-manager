/**
 * @file tests/mocks/ethers.ts
 * @description Centralized mock for ethers library
 */

import { vi } from 'vitest';

// Mock provider responses
const mockProvider = {
  getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111 }),
  getBlockNumber: vi.fn().mockResolvedValue(1234567),
};

// Mock contract responses
const mockContract = {
  allowance: vi.fn().mockResolvedValue(0),
  approve: vi.fn().mockResolvedValue(true),
  connect: vi.fn().mockReturnThis(),
  mint: vi
    .fn()
    .mockResolvedValue({ wait: () => Promise.resolve({ status: 1 }) }),
  slot0: vi.fn().mockResolvedValue({
    sqrtPriceX96: '1925932132478453600959787122321',
    tick: 85176,
    observationIndex: 0,
    observationCardinality: 1,
    observationCardinalityNext: 1,
    feeProtocol: 0,
    unlocked: true,
  }),
};

// Mock wallet responses
const mockWallet = {
  address: '0x818288B881AEd8918D679e03f2173120B0c89f22',
  connect: vi.fn().mockReturnThis(),
};

// Export mock implementations
export const mockEthers = {
  Contract: vi.fn().mockImplementation(() => mockContract),
  JsonRpcProvider: vi.fn().mockImplementation(() => mockProvider),
  Wallet: vi.fn().mockImplementation(() => mockWallet),
  provider: mockProvider,
  contract: mockContract,
  wallet: mockWallet,
};
