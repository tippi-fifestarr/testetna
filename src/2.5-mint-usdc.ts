/**
 * Step 2.5: Mint Testnet USDC (CRITICAL STEP!)
 * 
 * This script:
 * 1. Mints testnet USDC for trading collateral
 * 2. Maximum 250 USDC per account (testnet limit)
 * 3. USDC uses 6 decimals (250 USDC = 250_000000)
 * 
 * WHY THIS IS NEEDED:
 * - APT is only for gas fees (transaction costs)
 * - USDC is your actual trading collateral (margin)
 * - You CANNOT trade without USDC in your subaccount
 * 
 * Documentation:
 * - Function: usdc.move:142 (usdc::restricted_mint)
 * - Limit: usdc.move:37 (250 USDC maximum)
 * - Deposit guide: deposit.mdx:36
 */

import { createAptosClient, createAccount, waitForTransaction } from '../utils/client';
import { config } from '../utils/config';
import { usdcToChainUnits } from '../utils/formatting';

async function main() {
  console.log('💰 Minting Testnet USDC\n');
  
  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account: ${account.accountAddress.toString()}\n`);
  
  // Configuration
  const USDC_AMOUNT = 250; // Maximum allowed
  const USDC_DECIMALS = 6;
  const chainAmount = usdcToChainUnits(USDC_AMOUNT);
  
  console.log('📊 Mint Configuration:');
  console.log('━'.repeat(60));
  console.log(`Amount (human):    ${USDC_AMOUNT} USDC`);
  console.log(`Amount (chain):    ${chainAmount} (with ${USDC_DECIMALS} decimals)`);
  console.log(`Maximum allowed:   250 USDC per account`);
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
        functionArguments: [chainAmount],
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
    console.log(`🔗 View on explorer: https://explorer.aptoslabs.com/txn/${pendingTransaction.hash}\n`);
    
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
    
    console.log('Next steps:');
    console.log('  1. Run: npm run deposit-usdc    - Deposit USDC to your subaccount');
    console.log('  2. Run: npm run place-order     - Place your first order\n');
    
    console.log('💡 Remember:');
    console.log('   - APT = Gas fees for transactions');
    console.log('   - USDC = Trading collateral (margin for positions)');
    console.log('   - You need BOTH to trade successfully!\n');
    
  } catch (error: any) {
    console.error('❌ Error minting USDC:', error);
    console.error('\nPossible causes:');
    console.error('  1. Already minted 250 USDC (check your balance)');
    console.error('  2. Insufficient APT for gas fees');
    console.error('  3. Network connection issues');
    console.error('  4. Incorrect package address\n');
    
    if (error.message?.includes('ALREADY_MINTED')) {
      console.log('💡 You may have already minted your 250 USDC limit.');
      console.log('   This is normal! You can only mint once per account.\n');
    }
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});