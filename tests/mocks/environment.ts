/**
 * @file tests/mocks/environment.ts
 * @description Centralized mock data for environment variables and blockchain interactions
 */

export const MockEnvironment = {
  // Network
  rpcUrl: 'https://eth-sepolia.public.blastapi.io',
  chainId: 11155111, // Sepolia
  blockNumber: 5123456,

  // Wallet
  address: '0x818288B881AEd8918D679e03f2173120B0c89f22',
  privateKey:
    '0x1234567890123456789012345678901234567890123456789012345678901234', // Mock private key

  // Provider responses
  provider: {
    getNetwork: () => Promise.resolve({ chainId: 11155111 }),
    getBlockNumber: () => Promise.resolve(5123456),
  },

  // Contract responses
  contract: {
    allowance: () => Promise.resolve(0),
    approve: () => Promise.resolve(true),
    connect: () => ({ address: '0x818288B881AEd8918D679e03f2173120B0c89f22' }),
    mint: () => Promise.resolve({ wait: () => Promise.resolve({ status: 1 }) }),
    slot0: () =>
      Promise.resolve({
        sqrtPriceX96: '1234567890',
        tick: 123456,
        observationIndex: 0,
        observationCardinality: 0,
        observationCardinalityNext: 0,
        feeProtocol: 0,
        unlocked: true,
      }),
  },

  // Wallet responses
  wallet: {
    address: '0x818288B881AEd8918D679e03f2173120B0c89f22',
    connect: () => ({ address: '0x818288B881AEd8918D679e03f2173120B0c89f22' }),
  },
} as const;
