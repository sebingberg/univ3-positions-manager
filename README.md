# Uniswap V3 Positions Manager

A TypeScript CLI tool for managing Uniswap V3 liquidity positions on Sepolia testnet.

## Features
- Add liquidity to existing positions
- Monitor position metrics and fee performance
- Adjust position price ranges
- Withdraw liquidity and collect fees
- Comprehensive error handling and logging

## Prerequisites
- Node.js >= 18 (tested with LTS v20.11.0)
- pnpm (tested with v9.1.0)
- A Sepolia testnet wallet with Sepolia ETH and tokens (along with its private key)
- Infura/Alchemy API key (or you can use a public RPC URL)
- See the end of the README for more details on how to set up a Sepolia testnet wallet

## Quick Start
```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your:
# - RPC_URL (Sepolia)
# - PRIVATE_KEY (with funds)

# Build
pnpm build

# Run CLI
pnpm cli --help
```

### Add Liquidity to Position
```bash
pnpm cli add --id <tokenId> --amount <ethAmount> --lower <price> --upper <price> --fee <LOW|MEDIUM|HIGH>
```
Required options:
- `-i, --id`: Position token ID
- `-a, --amount`: Amount of ETH to provide
- `-l, --lower`: Lower price bound
- `-u, --upper`: Upper price bound
- `-f, --fee`: Fee tier (LOW, MEDIUM, HIGH)

### Monitor Position
```bash
pnpm cli monitor --id <tokenId>
```
Required options:
- `-i, --id`: Position token ID

### Adjust Range
```bash
pnpm cli adjust --id <tokenId> --lower <price> --upper <price> --slippage <percentage>
```
Required options:
- `-i, --id`: Position token ID
- `-l, --lower`: New lower price bound
- `-u, --upper`: New upper price bound
- `-s, --slippage`: Slippage tolerance in percentage

### Withdraw Liquidity
```bash
pnpm cli withdraw --id <tokenId> --percentage <amount> --fees <true|false>
```
Required options:
- `-i, --id`: Position token ID
- `-p, --percentage`: Percentage to withdraw (1-100)
- `-f, --fees`: Whether to collect accumulated fees

## Project Structure
```bash
├── scripts/
│   ├── cli.ts         # Command Line Interface
│   ├── addLiquidity.ts # Add to existing positions
│   ├── monitorPosition.ts # Track position metrics
│   ├── withdrawLiquidity.ts # Remove liquidity
│   ├── adjustRange.ts # Modify price ranges
│   └── utils/
│       ├── constants.ts # Network configuration and other important constants
│       ├── price.ts    # Price calculations
│       ├── position.ts # Position utilities
│       ├── errorHandler.ts # Error management
│       ├── logger.ts   # Operation logging
│       └── validation.ts # Input validation
├── tests/
│   ├── integration/   # E2E tests
│   └── unit/         # Unit tests
├── .env             # Environment configuration
└── README.md
```

## Environment Setup
A `.env.example` file is provided as a template. Copy it to create your own `.env`:

```bash
cp .env.example .env
```

Required environment variables:
- `RPC_URL`: Sepolia RPC endpoint
- `CHAIN_ID`: 11155111 for Sepolia
- `NETWORK_NAME`: sepolia
- `WETH_ADDRESS`: Wrapped ETH contract on Sepolia
- `USDC_ADDRESS`: USDC contract on Sepolia
- `POOL_ADDRESS`: WETH/USDC pool address
- `NFT_POSITION_MANAGER`: Uniswap V3 NFT manager
- `PRIVATE_KEY`: Your wallet's private key

Optional:
- `BLOCK_EXPLORER`: Etherscan URL for Sepolia

## Development Scripts
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

# Run tests
pnpm test
pnpm test:watch
```
### Code Quality and Tech Stack

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
- Validates all inputs before execution

## Testnet Resources
To test this application on Sepolia testnet, you'll need:

### Test Tokens
- Sepolia ETH: [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- Sepolia USDC: [Circle USDC Faucet](https://faucet.circle.com/)

### Network Details
- Network Name: Sepolia
- Chain ID: 11155111
- Currency Symbol: SepoliaETH
- Block Explorer: sepolia.etherscan.io

### Sepolia Testnet Wallet Setup
- Create a new wallet on MetaMask or any other wallet
- Add Sepolia ETH to the wallet
- Add Sepolia USDC to the wallet
- Export the private key of the wallet
- Set the private key in the `.env` file
