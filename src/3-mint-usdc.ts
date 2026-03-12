/**
 * Step 3: Mint Testnet USDC (CRITICAL STEP!)
 *
 * This script:
 * 1. Mints testnet USDC for trading collateral
 * 2. Uses restricted_mint on Testnet (rate-limited, mints to caller)
 * 3. USDC uses 6 decimals (1000 USDC = 1000_000000)
 *
 * WHY THIS IS NEEDED:
 * - APT is only for gas fees (transaction costs)
 * - USDC is your actual trading collateral (margin)
 * - You CANNOT trade without USDC in your subaccount
 *
 * IMPORTANT: Testnet uses restricted_mint (1 argument: amount only)
 * - Unlike Netna's unrestricted usdc::mint(to, amount), testnet's
 *   restricted_mint(amount) mints to the caller and may be rate-limited.
 * - This is for testing only - production uses real USDC
 */

import { createAptosClient, createAccount, waitForTransaction, getExplorerLink, createObjectAddress } from '../utils/client';
import { config } from '../utils/config';
import { usdcToChainUnits } from '../utils/formatting';

async function main() {
  console.log('💰 Minting Testnet USDC\n');

  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();

  console.log(`Account: ${account.accountAddress.toString()}\n`);

  // Configuration
  const USDC_AMOUNT = 1000; // restricted_mint on Testnet (may be rate-limited)
  const USDC_DECIMALS = 6;
  const chainAmount = usdcToChainUnits(USDC_AMOUNT);
  const MIN_USDC_NEEDED = 200_000_000; // 200 USDC in chain units (enough to deposit)

  // Check existing USDC balance before minting
  const usdcMetadata = createObjectAddress(config.PACKAGE_ADDRESS, "USDC");
  try {
    const balances = await aptos.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: account.accountAddress.toString() },
          asset_type: { _eq: usdcMetadata.toString() },
        },
      },
    });
    const usdcBalance = balances.length > 0 ? Number(balances[0].amount) : 0;
    if (usdcBalance >= MIN_USDC_NEEDED) {
      console.log(`✅ Already have ${(usdcBalance / 1_000_000).toFixed(2)} USDC. Skipping mint.\n`);
      return;
    }
  } catch {
    // Indexer unavailable, proceed with mint attempt
  }

  console.log('📊 Mint Configuration:');
  console.log('━'.repeat(60));
  console.log(`Amount (human):    ${USDC_AMOUNT} USDC`);
  console.log(`Amount (chain):    ${chainAmount} (with ${USDC_DECIMALS} decimals)`);
  console.log(`Mint type:         Restricted (Testnet, rate-limited)`);
  console.log('━'.repeat(60) + '\n');

  console.log('⚠️ IMPORTANT: This is testnet-only USDC for learning.');
  console.log('   Production trading requires real USDC.\n');
  
  // Step 1: Build mint transaction
  console.log('Step 1: Building mint transaction...');
  
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${config.PACKAGE_ADDRESS}::usdc::restricted_mint`,
        typeArguments: [],
        functionArguments: [
          chainAmount,            // amount in smallest units (6 decimals)
        ],
      },
    });
    
    console.log('✅ Transaction built\n');
    
    // Step 2: Sign transaction
    console.log('Step 2: Signing transaction...');
    
    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });
    
    console.log('✅ Transaction signed\n');
    
    // Step 3: Submit transaction
    console.log('Step 3: Submitting transaction to blockchain...');
    
    const pendingTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });
    
    console.log(`📝 Transaction hash: ${pendingTransaction.hash}`);
    console.log(`🔗 View on explorer: ${getExplorerLink(pendingTransaction.hash)}\n`);
    
    // Step 4: Wait for confirmation
    console.log('Step 4: Waiting for transaction confirmation...');
    console.log('   (This usually takes 2-5 seconds)\n');
    
    await waitForTransaction(aptos, pendingTransaction.hash);
    
    console.log(`✅ Successfully minted ${USDC_AMOUNT} USDC!\n`);
    
    // Success summary
    console.log('━'.repeat(80));
    console.log('🎉 USDC Minting Complete!');
    console.log('━'.repeat(80));
    console.log(`You now have ${USDC_AMOUNT} USDC in your account.`);
    console.log('This USDC is for trading collateral (NOT the same as APT gas fees).\n');
    
    const QUICK_WIN_MODE = process.env.QUICK_WIN_MODE === 'true';
    if (!QUICK_WIN_MODE) {
      console.log('Next steps:');
      console.log('  1. Run: npm run deposit-usdc    - Deposit USDC to your subaccount');
      console.log('  2. Run: npm run place-order     - Place your first order\n');
    }
    
    console.log('💡 Remember:');
    console.log('   - APT = Gas fees for transactions');
    console.log('   - USDC = Trading collateral (margin for positions)');
    console.log('   - You need BOTH to trade successfully!\n');
    
  } catch (error: any) {
    const vmStatus = error?.transaction?.vm_status || '';
    if (vmStatus.includes('E_MINT_ACCOUNT_LIMIT_EXCEEDED')) {
      console.warn('⚠️ Mint rate limit reached. You probably already have USDC from a previous run.');
      console.warn('   Continuing...\n');
    } else {
      console.error('❌ Error minting USDC:', error);
      console.error('\nPossible causes:');
      console.error('  1. Insufficient APT for gas fees (run: npm run fund-wallet)');
      console.error('  2. Network connection issues');
      console.error('  3. Incorrect package address');
      console.error('  4. USDC module not deployed at package address\n');
    }
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});