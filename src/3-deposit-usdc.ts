/**
 * Step 3: Deposit USDC to Subaccount (CRITICAL STEP!)
 * 
 * This script:
 * 1. Deposits USDC from your main account to your subaccount
 * 2. This USDC becomes your trading collateral (margin)
 * 3. You CANNOT place orders without USDC in your subaccount
 * 
 * Prerequisites:
 * - You must have a subaccount created (Step 2)
 * - You must have USDC minted (Step 2.5)
 * - SUBACCOUNT_ADDRESS must be set in .env
 * 
 * Documentation:
 * - Function: deposit.mdx:10 (dex_accounts::deposit_to_subaccount_at)
 * - Requirements: deposit.mdx:32-37
 *
 * CRITICAL: USDC Metadata Address Derivation (from Java example)
 * - USDC metadata is derived using createObjectAddress
 * - Seed: "USDC"
 * - Formula: createObjectAddress(packageAddress, "USDC")
 * - NOT from a metadata() function call!
 */

import { createAptosClient, createAccount, waitForTransaction, createObjectAddress } from '../utils/client';
import { config } from '../utils/config';
import { usdcToChainUnits } from '../utils/formatting';

async function main() {
  console.log('💵 Depositing USDC to Subaccount\n');
  
  // Validate subaccount address is set
  if (!config.SUBACCOUNT_ADDRESS) {
    console.error('❌ SUBACCOUNT_ADDRESS not set in .env file!');
    console.error('\nYou must first:');
    console.error('  1. Run: npm run create-subaccount');
    console.error('  2. Add SUBACCOUNT_ADDRESS to your .env file');
    console.error('  3. Then run this script again\n');
    process.exit(1);
  }
  
  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account:     ${account.accountAddress.toString()}`);
  console.log(`Subaccount:  ${config.SUBACCOUNT_ADDRESS}\n`);
  
  // Configuration
  const DEPOSIT_AMOUNT = 200; // Deposit 200 USDC (keep 50 for later use)
  const chainAmount = usdcToChainUnits(DEPOSIT_AMOUNT);
  
  console.log('📊 Deposit Configuration:');
  console.log('━'.repeat(60));
  console.log(`Amount (human):    ${DEPOSIT_AMOUNT} USDC`);
  console.log(`Amount (chain):    ${chainAmount} (with 6 decimals)`);
  console.log(`Destination:       Your trading subaccount`);
  console.log('━'.repeat(60) + '\n');
  
  console.log('💡 Why deposit to subaccount?');
  console.log('   - USDC in subaccount = Available trading collateral');
  console.log('   - Orders require collateral to cover potential losses');
  console.log('   - Without this step, you cannot place orders!\n');
  
  // Step 1: Derive USDC metadata address
  console.log('Step 1: Deriving USDC metadata address...');
  
  // USDC metadata address is derived from package address with seed "USDC"
  // This matches the Java example implementation
  // Formula: SHA3-256(packageAddress + seed + 0xFE)
  const usdcMetadataAddress = createObjectAddress(
    config.PACKAGE_ADDRESS,
    "USDC"
  );
  
  console.log(`✅ USDC metadata address: ${usdcMetadataAddress.toString()}`);
  console.log(`   Derived from package: ${config.PACKAGE_ADDRESS}`);
  console.log(`   Using seed: "USDC"\n`);
  
  // Step 2: Build deposit transaction
  console.log('Step 2: Building deposit transaction...');
  
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${config.PACKAGE_ADDRESS}::dex_accounts::deposit_to_subaccount_at`,
        typeArguments: [],
        functionArguments: [
          config.SUBACCOUNT_ADDRESS,    // subaccount_address
          usdcMetadataAddress,          // asset_metadata (USDC object address)
          chainAmount,                  // amount in smallest units
        ],
      },
    });
    
    console.log('✅ Transaction built\n');
    
    // Step 3: Sign transaction
    console.log('Step 3: Signing transaction...');
    
    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });
    
    console.log('✅ Transaction signed\n');
    
    // Step 4: Submit transaction
    console.log('Step 4: Submitting transaction to blockchain...');
    
    const pendingTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });
    
    console.log(`📝 Transaction hash: ${pendingTransaction.hash}`);
    console.log(`🔗 View on explorer: https://explorer.aptoslabs.com/txn/${pendingTransaction.hash}\n`);
    
    // Step 5: Wait for confirmation
    console.log('Step 5: Waiting for transaction confirmation...');
    console.log('   (This usually takes 2-5 seconds)\n');
    
    await waitForTransaction(aptos, pendingTransaction.hash);
    
    console.log(`✅ Successfully deposited ${DEPOSIT_AMOUNT} USDC to subaccount!\n`);
    
    // Step 6: Verify deposit via API
    console.log('Step 6: Verifying deposit via API...');
    console.log('   (Waiting for indexer to update...)\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const response = await fetch(
        `${config.REST_API_BASE_URL}/api/v1/subaccounts?owner=${account.accountAddress.toString()}`
      );
      
      if (response.ok) {
        const subaccounts = await response.json() as any[];
        const ourSubaccount = subaccounts.find((s: any) => s.subaccount_address === config.SUBACCOUNT_ADDRESS);
        
        if (ourSubaccount) {
          console.log('✅ Subaccount details:');
          console.log(JSON.stringify(ourSubaccount, null, 2));
          console.log();
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch subaccount details (not critical)\n');
    }
    
    // Success summary
    console.log('━'.repeat(80));
    console.log('🎉 USDC Deposit Complete!');
    console.log('━'.repeat(80));
    console.log(`Your subaccount now has ${DEPOSIT_AMOUNT} USDC available as trading collateral.`);
    console.log('You are ready to place orders!\n');
    
    console.log('Next steps:');
    console.log('  1. Run: npm run place-order     - Place your first order');
    console.log('  2. Run: npm run query-order     - Check order status');
    console.log('  3. Run: npm run websocket       - Watch live updates\n');
    
  } catch (error: any) {
    console.error('❌ Error depositing USDC:', error);
    console.error('\nPossible causes:');
    console.error('  1. No USDC in your account (run: npm run mint-usdc)');
    console.error('  2. Insufficient APT for gas fees');
    console.error('  3. Invalid subaccount address');
    console.error('  4. Network connection issues\n');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});