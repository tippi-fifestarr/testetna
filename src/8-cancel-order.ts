/**
 * Step 8: Cancel an Order
 *
 * This script:
 * 1. Queries your order to confirm it exists and is open
 * 2. Cancels it by client_order_id on-chain
 *
 * Usage:
 *   CLIENT_ORDER_ID="order-123456" npm run cancel-order
 *
 * You can also cancel by on-chain order_id:
 *   ORDER_ID="12345678901234567890" npm run cancel-order
 */

import { createAptosClient, createAccount, waitForTransaction, getExplorerLink } from '../utils/client';
import { config, authenticatedFetch } from '../utils/config';

async function main() {
  console.log('🚫 Cancelling Order\n');

  const clientOrderId = process.env.CLIENT_ORDER_ID;
  const orderId = process.env.ORDER_ID;

  if (!clientOrderId && !orderId) {
    console.error('❌ No order ID provided!\n');
    console.error('Usage (by client_order_id):');
    console.error('  CLIENT_ORDER_ID="order-1234567890" npm run cancel-order\n');
    console.error('Usage (by on-chain order_id):');
    console.error('  ORDER_ID="12345678901234567890" npm run cancel-order\n');
    process.exit(1);
  }

  if (!config.SUBACCOUNT_ADDRESS) {
    console.error('❌ SUBACCOUNT_ADDRESS not set in .env file!');
    console.error('   Run: npm run create-subaccount first\n');
    process.exit(1);
  }

  const aptos = createAptosClient();
  const account = createAccount();

  console.log(`Account:     ${account.accountAddress.toString()}`);
  console.log(`Subaccount:  ${config.SUBACCOUNT_ADDRESS}\n`);

  // Step 1: Fetch market address
  console.log('Step 1: Fetching market configuration...');

  const marketsResponse = await authenticatedFetch(`${config.REST_API_BASE_URL}/api/v1/markets`);
  if (!marketsResponse.ok) {
    throw new Error(`Failed to fetch markets: ${marketsResponse.statusText}`);
  }

  const markets = await marketsResponse.json() as any[];
  const marketName = config.MARKET_NAME || 'BTC/USD';
  const market = markets.find((m: any) => m.market_name === marketName);

  if (!market) {
    console.error(`❌ Market ${marketName} not found!`);
    console.log('Available markets:', markets.map((m: any) => m.market_name).join(', '));
    process.exit(1);
  }

  console.log(`✅ Market: ${market.market_name}`);
  console.log(`   Address: ${market.market_addr}\n`);

  // Step 2: Query order to confirm it exists (optional but helpful)
  if (clientOrderId) {
    console.log(`Step 2: Checking order status for ${clientOrderId}...`);
    try {
      const queryUrl = new URL(`${config.REST_API_BASE_URL}/api/v1/orders`);
      queryUrl.searchParams.append('market_address', market.market_addr);
      queryUrl.searchParams.append('user_address', config.API_WALLET_ADDRESS);
      queryUrl.searchParams.append('client_order_id', clientOrderId);

      const response = await authenticatedFetch(queryUrl.toString());
      if (response.ok) {
        const data = await response.json() as any;
        console.log(`   Status: ${data.status || 'unknown'}`);
        if (data.order?.order_id) {
          console.log(`   On-chain order_id: ${data.order.order_id}`);
        }
      }
    } catch {
      console.log('   Could not query order (will attempt cancel anyway)');
    }
    console.log();
  }

  // Step 3: Build cancel transaction
  const cancelType = clientOrderId ? 'client_order_id' : 'order_id';
  const cancelValue = clientOrderId || orderId;
  console.log(`Step 3: Building cancel transaction (by ${cancelType})...`);
  console.log(`   ${cancelType}: ${cancelValue}\n`);

  try {
    const functionName = (clientOrderId
      ? `${config.PACKAGE_ADDRESS}::dex_accounts_entry::cancel_client_order_to_subaccount`
      : `${config.PACKAGE_ADDRESS}::dex_accounts_entry::cancel_order_to_subaccount`) as `${string}::${string}::${string}`;

    const functionArguments = [
      config.SUBACCOUNT_ADDRESS,
      cancelValue,
      market.market_addr,
    ];

    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: functionName,
        typeArguments: [],
        functionArguments,
      },
    });

    console.log('✅ Transaction built\n');

    // Step 4: Sign
    console.log('Step 4: Signing transaction...');
    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });
    console.log('✅ Transaction signed\n');

    // Step 5: Submit
    console.log('Step 5: Submitting cancel transaction...');
    const pendingTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    console.log(`📝 Transaction hash: ${pendingTransaction.hash}`);
    console.log(`🔗 View on explorer: ${getExplorerLink(pendingTransaction.hash)}\n`);

    // Step 6: Wait for confirmation
    console.log('Step 6: Waiting for confirmation...');
    await waitForTransaction(aptos, pendingTransaction.hash);

    console.log('\n' + '━'.repeat(80));
    console.log('🎉 Order Cancelled!');
    console.log('━'.repeat(80));
    console.log(`${cancelType}: ${cancelValue}`);
    console.log(`Market:     ${market.market_name}`);
    console.log(`Transaction: ${pendingTransaction.hash}`);
    console.log('━'.repeat(80) + '\n');

  } catch (error: any) {
    const vmStatus = error?.transaction?.vm_status || '';
    if (vmStatus.includes('ORDER_NOT_FOUND') || vmStatus.includes('E_ORDER_NOT_FOUND')) {
      console.error('❌ Order not found. It may have already been filled or cancelled.');
    } else {
      console.error('❌ Error cancelling order:', error);
      console.error('\nPossible causes:');
      console.error('  1. Order already filled or cancelled');
      console.error('  2. Wrong client_order_id or order_id');
      console.error('  3. Wrong market');
      console.error('  4. Insufficient APT for gas fees\n');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
