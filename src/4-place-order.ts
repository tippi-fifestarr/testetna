/**
 * Step 4: Place Your First Order
 * 
 * This script:
 * 1. Fetches market configuration
 * 2. Formats price and size correctly
 * 3. Places a limit order on the orderbook
 * 4. Returns client_order_id for tracking
 * 
 * Prerequisites:
 * - Subaccount created (Step 2)
 * - USDC minted (Step 2.5)
 * - USDC deposited to subaccount (Step 3)
 * 
 * Documentation:
 * - Function: place-order.mdx:9 (dex_accounts::place_order_to_subaccount)
 * - Parameters: place-order.mdx:44-61
 * - Formatting: formatting-prices-sizes.mdx
 *
 * VERIFIED: Implementation matches Java example
 * - Fetches market config from API
 * - Uses proper price/size formatting
 * - Generates client_order_id for tracking
 */

import { createAptosClient, createAccount, waitForTransaction } from '../utils/client';
import { config } from '../utils/config';
import { formatOrderParams, printOrderParams, MarketConfig } from '../utils/formatting';

async function main() {
  console.log('📊 Placing Your First Order\n');
  
  // Validate prerequisites
  if (!config.SUBACCOUNT_ADDRESS) {
    console.error('❌ SUBACCOUNT_ADDRESS not set in .env file!');
    console.error('   Run: npm run create-subaccount first\n');
    process.exit(1);
  }
  
  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account:     ${account.accountAddress.toString()}`);
  console.log(`Subaccount:  ${config.SUBACCOUNT_ADDRESS}\n`);
  
  // Step 1: Fetch market configuration
  console.log('Step 1: Fetching market configuration...');
  
  const marketsResponse = await fetch(`${config.REST_API_BASE_URL}/api/v1/markets`);
  if (!marketsResponse.ok) {
    throw new Error(`Failed to fetch markets: ${marketsResponse.statusText}`);
  }
  
  const markets = await marketsResponse.json() as any[];
  
  // =========================================================
  // 🧠 BRAIN ON: CUSTOMIZE YOUR STRATEGY HERE
  // =========================================================
  
  // 1. CHOOSE YOUR MARKET
  // Run `npm run setup` to see the exact names of all available markets.
  const marketName = config.MARKET_NAME || 'BTC-PERP'; 
  const market: MarketConfig = markets.find((m: any) => m.market_name === marketName);
  
  if (!market) {
    console.error(`❌ Market ${marketName} not found!`);
    console.log('Available markets:', markets.map((m: any) => m.market_name).join(', '));
    process.exit(1);
  }
  
  console.log(`✅ Trading on: ${market.market_name}`);
  console.log(`   Market address: ${market.market_addr}\n`);
  
  // Step 2: Define order parameters
  console.log('Step 2: Defining order parameters...');
  
  // 2. SET YOUR ORDER DETAILS
  // In a real bot, these values would come from your strategy logic.
  const userPrice = 50000;   // The price you are willing to pay (Limit Price)
  const userSize = 0.001;    // How much you want to buy/sell
  const isBuy = true;        // true = Long (Buy), false = Short (Sell)

  // =========================================================
  // END CUSTOMIZATION
  // =========================================================
  
  // Format price and size according to market rules
  const params = formatOrderParams(userPrice, userSize, market);
  printOrderParams(params, market);
  
  // Step 3: Generate client_order_id for tracking
  const clientOrderId = `order-${Date.now()}`;
  console.log(`📝 Client Order ID: ${clientOrderId}`);
  console.log('   (Use this to query order status later)\n');
  
  // Step 4: Build order transaction
  console.log('Step 4: Building order transaction...');
  
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${config.PACKAGE_ADDRESS}::dex_accounts::place_order_to_subaccount`,
        typeArguments: [],
        functionArguments: [
          config.SUBACCOUNT_ADDRESS,  // subaccount
          market.market_addr,         // market
          params.chainPrice,          // price (chain units)
          params.chainSize,           // size (chain units)
          isBuy,                      // is_buy
          0,                          // time_in_force (0=GTC, 1=PostOnly, 2=IOC)
          false,                      // is_reduce_only
          clientOrderId,              // client_order_id
          null,                       // stop_price
          null,                       // tp_trigger_price
          null,                       // tp_limit_price
          null,                       // sl_trigger_price
          null,                       // sl_limit_price
          null,                       // builder_addr
          null,                       // builder_fee
        ],
      },
    });
    
    console.log('✅ Transaction built\n');
    
    // Step 5: Sign transaction
    console.log('Step 5: Signing transaction...');
    
    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });
    
    console.log('✅ Transaction signed\n');
    
    // Step 6: Submit transaction
    console.log('Step 6: Submitting order to blockchain...');
    
    const pendingTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });
    
    console.log(`📝 Transaction hash: ${pendingTransaction.hash}`);
    console.log(`🔗 View on explorer: https://explorer.aptoslabs.com/txn/${pendingTransaction.hash}\n`);
    
    // Step 7: Wait for confirmation
    console.log('Step 7: Waiting for transaction confirmation...');
    console.log('   (This usually takes 2-5 seconds)\n');
    
    await waitForTransaction(aptos, pendingTransaction.hash);
    
    console.log('✅ Order placed successfully!\n');
    
    // Success summary
    console.log('━'.repeat(80));
    console.log('🎉 Order Placement Complete!');
    console.log('━'.repeat(80));
    console.log(`Market:           ${market.market_name}`);
    console.log(`Side:             ${isBuy ? 'BUY' : 'SELL'}`);
    console.log(`Price:            $${params.humanPrice.toLocaleString()}`);
    console.log(`Size:             ${params.humanSize}`);
    console.log(`Client Order ID:  ${clientOrderId}`);
    console.log(`Transaction:      ${pendingTransaction.hash}`);
    console.log('━'.repeat(80) + '\n');
    
    console.log('💡 Save this Client Order ID for querying: ' + clientOrderId + '\n');
    
    console.log('Next steps:');
    console.log('  1. Run: npm run query-order    - Check order status');
    console.log('  2. Run: npm run websocket       - Watch live updates\n');
    
    console.log('To query this specific order, use:');
    console.log(`CLIENT_ORDER_ID="${clientOrderId}" npm run query-order\n`);
    
  } catch (error: any) {
    console.error('❌ Error placing order:', error);
    console.error('\nPossible causes:');
    console.error('  1. Insufficient USDC collateral in subaccount');
    console.error('  2. Invalid price/size (check market minimums)');
    console.error('  3. Insufficient APT for gas fees');
    console.error('  4. Market is not active\n');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});