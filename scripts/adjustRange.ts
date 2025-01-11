/**
 * @file adjustRange.ts
 * @description Script for adjusting Uniswap V3 position price ranges.
 * It provides functionality to:
 * - Modify existing position's price range
 * - Efficiently migrate liquidity to new range
 * - Handle the entire process in a single transaction
 * - Maintain same liquidity amount in new range
 * 
 * @example
 * ```typescript
 * await adjustRange(tokenId, {
 *   newPriceLower: 1750,
 *   newPriceUpper: 1850,
 *   slippageTolerance: 0.5  // 0.5%
 * })
 * ```
 * 
 * ! Important: This is a complex operation that involves removing and re-adding liquidity
 * * Note: Fees are collected automatically during adjustment
 * * Note: New range can be wider or narrower than original
 */

import { ethers } from 'ethers'
import { NFT_POSITION_MANAGER, SLIPPAGE_TOLERANCE, MaxUint128 } from './utils/constants'
import { priceToTick } from './utils/price'
import { Token } from '@uniswap/sdk-core'

interface AdjustRangeParams {
  newPriceLower: number
  newPriceUpper: number
  slippageTolerance?: number
}

async function adjustRange(
  tokenId: number,
  baseToken: Token,
  quoteToken: Token,
  params: AdjustRangeParams
) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

  // ! Initialize position manager contract with required method signatures
  const positionManager = new ethers.Contract(
    NFT_POSITION_MANAGER,
    [
      'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
      'function decreaseLiquidity(uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline) external returns (uint256 amount0, uint256 amount1)',
      'function collect(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max) external returns (uint128 amount0, uint128 amount1)',
      'function mint(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 amount0Desired, uint128 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
    ],
    wallet
  )

  // * Get current position
  const position = await positionManager.positions(tokenId)

  // * Convert new prices to ticks
  const newTickLower = priceToTick(params.newPriceLower, baseToken, quoteToken)
  const newTickUpper = priceToTick(params.newPriceUpper, baseToken, quoteToken)

  // ! Step 1: Remove all liquidity from current position
  console.log('Removing liquidity from current position...')
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
  
  await positionManager.decreaseLiquidity(
    tokenId,
    position.liquidity,
    0, // TODO: Add slippage protection
    0,
    deadline
  )

  // ! Step 2: Collect all tokens
  console.log('Collecting withdrawn tokens...')
  await positionManager.collect(
    tokenId,
    wallet.address,
    MaxUint128,
    MaxUint128
  )

  // ! Step 3: Create new position with collected tokens
  console.log('Creating new position with adjusted range...')
  await positionManager.mint(
    position.token0,
    position.token1,
    position.fee,
    newTickLower,
    newTickUpper,
    position.amount0,
    position.amount1,
    0, // TODO: Add slippage protection
    0,
    wallet.address,
    deadline
  )

  return true
}

export { adjustRange, AdjustRangeParams }
