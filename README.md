# Uniswap V3 Positions Manager

A TypeScript CLI tool for managing Uniswap V3 liquidity positions on Sepolia testnet.

## Features

- Create new liquidity positions
- Monitor position metrics and performance
- Adjust position price ranges
- Withdraw liquidity (full or partial)
- Comprehensive error handling and logging
- Input validation and safety checks
- Command Line Interface (CLI)

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## CLI Usage

### Add New Position
```bash
pnpm cli add --amount 0.1 --lower 1750 --upper 1850 --fee MEDIUM
```
Options:
- `-a, --amount`: Amount of ETH to provide (required)
- `-l, --lower`: Lower price bound (default: 1750)
- `-u, --upper`: Upper price bound (default: 1850)
- `-f, --fee`: Fee tier (LOW, MEDIUM, HIGH) (default: MEDIUM)

### Monitor Position
```bash
pnpm cli monitor --id 123
```
Options:
- `-i, --id`: Position token ID (required)

### Adjust Range
```bash
pnpm cli adjust --id 123 --lower 1800 --upper 1900 --slippage 0.5
```
Options:
- `-i, --id`: Position token ID (required)
- `-l, --lower`: New lower price bound (required)
- `-u, --upper`: New upper price bound (required)
- `-s, --slippage`: Slippage tolerance in percentage (default: 0.5)

### Withdraw Liquidity
```bash
pnpm cli withdraw --id 123 --percentage 50 --fees
```
Options:
- `-i, --id`: Position token ID (required)
- `-p, --percentage`: Percentage to withdraw (default: 100)
- `-f, --fees`: Collect accumulated fees (default: true)

### Help
```bash
pnpm cli --help        # General help
pnpm cli add --help    # Help for specific command
```

## Project Structure

```bash
├── scripts/
│   ├── cli.ts         # Command Line Interface for this Application
│   ├── addLiquidity.ts # Add new positions
│   ├── monitorPosition.ts # Track position metrics
│   ├── withdrawLiquidity.ts # Remove liquidity
│   ├── adjustRange.ts # Modify price ranges
│   └── utils/
│       ├── constants.ts # Configuration
│       ├── price.ts    # Price calculations
│       ├── position.ts # Position utilities
│       ├── errorHandler.ts # Error management
│       ├── logger.ts   # Operation logging
│       └── validation.ts # Input validation
├── tests/
│   └── unit/         # Unit tests
├── .env             # Environment configuration
└── README.md
```

## Environment Setup

Create a `.env` file in the root directory:
```bash
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
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

### Code Quality

This project uses:
- `TypeScript` with strict type checking
- `ESLint` for code linting
- `Prettier` for code formatting
- `Vitest` for testing
- `Commander` for CLI
- `Conventional Commits` for commit messages

## Notes

- All tested contracts are deployed on Sepolia testnet
- Uses Uniswap V3 SDK for calculations
- Implements comprehensive error handling
- Includes detailed operation logging
- Supports partial withdrawals
- Handles fee collection
- Validates all inputs before execution