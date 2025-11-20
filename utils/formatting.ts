/**
 * Price and size formatting utilities for Decibel trading
 * Documentation: formatting-prices-sizes.mdx
 * 
 * Key concepts:
 * - Blockchain uses integers, not decimals
 * - Prices and sizes must be rounded to valid tick/lot sizes
 * - Must convert to "chain units" (multiply by 10^decimals)
 */

export interface MarketConfig {
  market_name: string;
  market_addr: string;
  px_decimals: number;  // Price decimal precision (usually 9)
  sz_decimals: number;  // Size decimal precision (usually 9)
  tick_size: number;    // Minimum price increment
  lot_size: number;     // Minimum size increment
  min_size: number;     // Minimum order size
  max_leverage?: number;
}

/**
 * Rounds price to valid tick size
 * Documentation: formatting-prices-sizes.mdx:125-141
 * 
 * @param price - User-friendly price (e.g., 50000.5)
 * @param market - Market configuration
 * @returns Rounded price that matches tick size requirements
 */
export function roundToValidPrice(price: number, market: MarketConfig): number {
  if (price === 0) return 0;
  
  // Convert to chain units for rounding
  const denormalizedPrice = price * (10 ** market.px_decimals);
  
  // Round to nearest tick size
  const roundedPrice = Math.round(denormalizedPrice / market.tick_size) * market.tick_size;
  
  // Convert back to human-readable
  return Math.round(roundedPrice) / (10 ** market.px_decimals);
}

/**
 * Rounds size to valid lot size and ensures it meets minimum
 * Documentation: formatting-prices-sizes.mdx:188-215
 * 
 * @param size - User-friendly size (e.g., 1.5)
 * @param market - Market configuration
 * @returns Rounded size that matches lot size requirements
 */
export function roundToValidOrderSize(size: number, market: MarketConfig): number {
  if (size === 0) return 0;
  
  // Check against minimum size
  const normalizedMinSize = market.min_size / (10 ** market.sz_decimals);
  if (size < normalizedMinSize) {
    console.warn(`⚠️ Size ${size} is below minimum ${normalizedMinSize}, using minimum`);
    return normalizedMinSize;
  }
  
  // Convert to chain units for rounding
  const denormalizedSize = size * (10 ** market.sz_decimals);
  
  // Round to nearest lot size
  const roundedSize = Math.round(denormalizedSize / market.lot_size) * market.lot_size;
  
  // Convert back to human-readable
  return Math.round(roundedSize) / (10 ** market.sz_decimals);
}

/**
 * Converts human-readable price to chain units
 * Documentation: formatting-prices-sizes.mdx:54-56
 * 
 * @param price - Already rounded price
 * @param decimals - Number of decimals (from market.px_decimals)
 * @returns Integer price for blockchain
 */
export function priceToChainUnits(price: number, decimals: number): number {
  return Math.floor(price * (10 ** decimals));
}

/**
 * Converts human-readable size to chain units
 * Documentation: formatting-prices-sizes.mdx:54-56
 * 
 * @param size - Already rounded size
 * @param decimals - Number of decimals (from market.sz_decimals)
 * @returns Integer size for blockchain
 */
export function sizeToChainUnits(size: number, decimals: number): number {
  return Math.floor(size * (10 ** decimals));
}

/**
 * Converts chain units back to human-readable format
 * 
 * @param amount - Chain units (integer)
 * @param decimals - Number of decimals
 * @returns Human-readable decimal number
 */
export function chainUnitsToHuman(amount: number, decimals: number): number {
  return amount / (10 ** decimals);
}

/**
 * Complete formatting pipeline: user input → valid chain units
 * 
 * @param price - User-specified price
 * @param size - User-specified size
 * @param market - Market configuration
 * @returns Object with both human-readable and chain unit values
 */
export function formatOrderParams(
  price: number,
  size: number,
  market: MarketConfig
): {
  humanPrice: number;
  humanSize: number;
  chainPrice: number;
  chainSize: number;
} {
  // Step 1: Round to valid tick/lot sizes
  const humanPrice = roundToValidPrice(price, market);
  const humanSize = roundToValidOrderSize(size, market);
  
  // Step 2: Convert to chain units
  const chainPrice = priceToChainUnits(humanPrice, market.px_decimals);
  const chainSize = sizeToChainUnits(humanSize, market.sz_decimals);
  
  return {
    humanPrice,
    humanSize,
    chainPrice,
    chainSize,
  };
}

/**
 * Formats USDC amount to chain units (6 decimals)
 * 
 * @param usdcAmount - USDC amount (e.g., 250 for 250 USDC)
 * @returns Chain units (e.g., 250_000000)
 */
export function usdcToChainUnits(usdcAmount: number): number {
  return Math.floor(usdcAmount * 1_000000);
}

/**
 * Pretty-prints order parameters for debugging
 */
export function printOrderParams(params: ReturnType<typeof formatOrderParams>, market: MarketConfig): void {
  console.log('\n📊 Order Parameters:');
  console.log('━'.repeat(60));
  console.log(`Market:          ${market.market_name}`);
  console.log(`Price (human):   $${params.humanPrice.toLocaleString()}`);
  console.log(`Price (chain):   ${params.chainPrice}`);
  console.log(`Size (human):    ${params.humanSize}`);
  console.log(`Size (chain):    ${params.chainSize}`);
  console.log(`Tick size:       ${market.tick_size}`);
  console.log(`Lot size:        ${market.lot_size}`);
  console.log('━'.repeat(60) + '\n');
}