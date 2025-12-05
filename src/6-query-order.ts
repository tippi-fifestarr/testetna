/**
 * Step 6: Query Order Status
 * 
 * This script:
 * 1. Queries order status via REST API
 * 2. Shows current order state (Open, Filled, Cancelled)
 * 3. Displays fills and remaining size
 * 
 * Usage:
 *   CLIENT_ORDER_ID="order-123456" npm run query-order
 * 
 * Documentation:
 * - Endpoint: openapi.json:866-1001 (GET /api/v1/orders)
 * - Response: openapi.json:922-997
 */

import { config, authenticatedFetch } from '../utils/config';

async function main() {
  console.log('🔍 Querying Order Status\n');
  
  // Get client_order_id from environment or prompt
  const clientOrderId = process.env.CLIENT_ORDER_ID;
  
  if (!clientOrderId) {
    console.error('❌ CLIENT_ORDER_ID not provided!');
    console.error('\nUsage:');
    console.error('  CLIENT_ORDER_ID="your-order-id" npm run query-order');
    console.error('\nExample:');
    console.error('  CLIENT_ORDER_ID="order-1732118400000" npm run query-order\n');
    process.exit(1);
  }
  
  if (!config.MARKET_ADDRESS) {
    console.warn('⚠️ MARKET_ADDRESS not set in .env');
    console.warn('   Using BTC/USD market, but this might not match your order\n');
  }
  
  console.log(`Client Order ID: ${clientOrderId}`);
  console.log(`User Address:    ${config.API_WALLET_ADDRESS}\n`);
  
  // Fetch market to get address if not in config
  let marketAddress = config.MARKET_ADDRESS;
  
  if (!marketAddress) {
    console.log('Fetching markets to get market address...');
    const marketsResponse = await authenticatedFetch(`${config.REST_API_BASE_URL}/api/v1/markets`);
    const markets = await marketsResponse.json() as any[];
    const marketName = config.MARKET_NAME || 'BTC/USD';
    const market = markets.find((m: any) => m.market_name === marketName);
    marketAddress = market?.market_addr;
    console.log(`Using market: ${marketName} (${marketAddress})\n`);
  }
  
  // Build query URL
  const queryUrl = new URL(`${config.REST_API_BASE_URL}/api/v1/orders`);
  queryUrl.searchParams.append('market_address', marketAddress);
  queryUrl.searchParams.append('user_address', config.API_WALLET_ADDRESS);
  queryUrl.searchParams.append('client_order_id', clientOrderId);
  
  console.log('Querying order...');
  console.log(`URL: ${queryUrl.toString()}\n`);
  
  try {
    const response = await authenticatedFetch(queryUrl.toString());
    
    if (!response.ok) {
      console.error(`❌ API returned ${response.status}: ${response.statusText}`);
      
      if (response.status === 404) {
        console.error('\nOrder not found. Possible reasons:');
        console.error('  1. Wrong client_order_id');
        console.error('  2. Wrong market_address');
        console.error('  3. Order hasn\'t been indexed yet (wait a few seconds)');
        console.error('  4. User address doesn\'t match\n');
      }
      
      process.exit(1);
    }
    
    const orderData = await response.json() as any;
    
    // Display order information
    console.log('━'.repeat(80));
    console.log('📊 Order Information');
    console.log('━'.repeat(80));
    
    console.log(`Status:           ${orderData.status}`);
    console.log(`Details:          ${orderData.details || '(none)'}\n`);
    
    if (orderData.order) {
      const order = orderData.order;
      
      console.log('Order Details:');
      console.log(`  Market:         ${order.market}`);
      console.log(`  Client Order ID: ${order.client_order_id}`);
      console.log(`  Order ID:       ${order.order_id}`);
      console.log(`  Type:           ${order.order_type}`);
      console.log(`  Direction:      ${order.order_direction || (order.is_buy ? 'Buy' : 'Sell')}`);
      console.log(`  Price:          $${order.price?.toLocaleString() || 'N/A'}`);
      console.log(`  Original Size:  ${order.orig_size}`);
      console.log(`  Remaining Size: ${order.remaining_size}`);
      console.log(`  Filled Size:    ${order.orig_size - order.remaining_size}`);
      console.log(`  Is Buy:         ${order.is_buy}`);
      console.log(`  Reduce Only:    ${order.is_reduce_only}`);
      
      if (order.transaction_version) {
        console.log(`  TX Version:     ${order.transaction_version}`);
      }
      
      if (order.unix_ms) {
        const date = new Date(order.unix_ms);
        console.log(`  Timestamp:      ${date.toISOString()}`);
      }
    }
    
    console.log('━'.repeat(80) + '\n');
    
    // Status-specific messages
    if (orderData.status === 'Open') {
      console.log('📋 Order is OPEN and waiting to be filled');
      console.log('   Run this script again to check for updates\n');
    } else if (orderData.status === 'Filled') {
      console.log('✅ Order is FILLED!');
      console.log('   Your trade has been executed\n');
    } else if (orderData.status === 'PartiallyFilled') {
      console.log('⏳ Order is PARTIALLY FILLED');
      console.log('   Some of the order has executed, rest is still open\n');
    } else if (orderData.status === 'Cancelled') {
      console.log('❌ Order was CANCELLED');
      console.log('   The order did not execute\n');
    }
    
    console.log('💡 Tip: Use WebSocket for real-time updates');
    console.log('   Run: npm run websocket\n');
    
  } catch (error) {
    console.error('❌ Error querying order:', error);
    console.error('\nCheck:');
    console.error('  1. REST_API_BASE_URL is correct in .env');
    console.error('  2. Network connection');
    console.error('  3. client_order_id is accurate\n');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});