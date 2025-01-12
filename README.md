# Uniswap V3 Positions Manager

A TypeScript tool for managing Uniswap V3 liquidity positions on Sepolia testnet.

## Features

- Create new liquidity positions
- Monitor position metrics and performance
- Adjust position price ranges
- Withdraw liquidity (full or partial)
- Comprehensive error handling and logging
- Input validation and safety checks
- Slippage protection

## Installation

```bash
pnpm install
```

## Usage

### Add Liquidity

```typescript
import { addLiquidity } from './scripts/addLiquidity'

const params = {
  tokenA: WETH,
  tokenB: USDC,
  fee: FEE_TIERS.MEDIUM,
  amount: "1.5",
  priceLower: 1750,
  priceUpper: 1850,
  poolAddress: "0x..."
}

await addLiquidity(params)
```

### Monitor Position

```typescript
import { monitorPosition } from './scripts/monitorPosition'

const status = await monitorPosition(tokenId, WETH, USDC)
console.log(formatPositionStatus(status, WETH, USDC))
```

### Adjust Range

```typescript
import { adjustRange } from './scripts/adjustRange'

await adjustRange(tokenId, WETH, USDC, {
  newPriceLower: 1800,
  newPriceUpper: 1900,
  slippageTolerance: 0.5
})
```

### Withdraw Liquidity

```typescript
import { withdrawLiquidity } from './scripts/withdrawLiquidity'

// Full withdrawal
await withdrawLiquidity(tokenId)

// Partial withdrawal
await withdrawLiquidity(tokenId, {
  percentageToWithdraw: 50,
  collectFees: true
})
```

## Project Structure

```bash
├── scripts/
│   ├── addLiquidity.ts     # Add new positions
│   ├── monitorPosition.ts  # Track position metrics
│   ├── withdrawLiquidity.ts # Remove liquidity
│   ├── adjustRange.ts      # Modify price ranges
│   └── utils/
│       ├── constants.ts    # Configuration
│       ├── price.ts       # Price calculations
│       ├── position.ts    # Position utilities
│       ├── errorHandler.ts # Error management
│       ├── logger.ts      # Operation logging
│       └── validation.ts  # Input validation
├── tests/
│   └── unit/             # Unit tests
├── .eslintrc.json       # ESLint configuration
├── .prettierrc         # Prettier configuration
├── tsconfig.json      # TypeScript configuration
└── README.md
```

## Development

### Scripts

```bash
# Build the project
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format
pnpm format:check

# Run all checks
pnpm check

# Run tests
pnpm test:watch
pnpm test:coverage
```

### Code Quality and Tech Stack

This project uses:
- TypeScript with strict type checking
- ESLint for code linting
- Prettier for code formatting
- Vitest for testing
- Conventional Commits for commit messages

## Notes

- All tested contracts are deployed on Sepolia testnet
- Uses Uniswap V3 SDK for calculations
- Implements comprehensive error handling
- Includes detailed operation logging
- Supports partial withdrawals
- Handles fee collection
- Validates all inputs before execution