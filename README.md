# Uniswap V3 Position Manager

A TypeScript implementation for managing Uniswap V3 liquidity positions on supported EVM chains.

## Core Features

- 🔄 Add liquidity to UniswapV3 (and any forked version) pools
- 📊 Monitor position metrics and fees
- 💰 Withdraw liquidity from created positions (fully/partially)
- 🔄 Adjust position price ranges

## Prerequisites

- Node.js >= 16 (tested with v20.11.0)
- pnpm
- An EVM compatible wallet with ETH (or equivalent gas token) and tokens
- Private key for said wallet

## Setup

1. Clone this repository and install dependencies:
```bash
git clone <repository-url>
cd <repository-name>
pnpm install
```
2. Configure environment:

```bash
cp .env.example .env
```

Add your credentials to `.env`:

```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=your_rpc_url
```

## Usage

### Add Liquidity

```typescript
import { addLiquidity } from './scripts/addLiquidity'
await addLiquidity({
tokenA: WETH,
tokenB: USDC,
fee: FEE_TIERS.MEDIUM,
amount: '1.5',
priceLower: 1750,
priceUpper: 1850
})
```

### Monitor Position

typescript
```typescript
import { monitorPosition } from './scripts/monitorPosition'
const status = await monitorPosition(tokenId, WETH, USDC)
console.log(formatPositionStatus(status, WETH, USDC))
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

## Testing

Run the test suite:

```bash
pnpm test
```

## Project Structure
```bash
├── scripts/
│ ├── addLiquidity.ts # Add new positions
│ ├── monitorPosition.ts # Track position metrics
│ ├── withdrawLiquidity.ts # Remove liquidity
│ ├── adjustRange.ts # Modify price ranges
│ └── utils/
│    ├── constants.ts # Configuration
│    ├── price.ts # Price calculations
│    └── position.ts # Position utilities
│ └── ...
├── tests/
│ └── unit/ # Unit tests
└── README.md
```

## Notes

- All contracts are deployed on Sepolia testnet
- Uses Uniswap V3 SDK for calculations
- Implements slippage protection
- Supports partial withdrawals
- Handles fee collection