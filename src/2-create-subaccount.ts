/**
 * Step 2: Create Trading Subaccount
 * 
 * This script:
 * 1. Creates a new subaccount for trading
 * 2. Waits for transaction confirmation
 * 3. Retrieves the subaccount address via API
 * 
 * Documentation:
 * - Function: create-subaccount.mdx:12 (dex_accounts::create_new_subaccount)
 * - API endpoint: openapi.json:1095-1130 (GET /api/v1/subaccounts)
 */

import { createAptosClient, createAccount, waitForTransaction } from '../utils/client';
import { config } from '../utils/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🏦 Creating Trading Subaccount\n');
  
  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account: ${account.accountAddress.toString()}\n`);
  
  // Step 1: Build create subaccount transaction
  console.log('Step 1: Building create subaccount transaction...');
  
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${config.PACKAGE_ADDRESS}::dex_accounts::create_new_subaccount`,
      typeArguments: [],
      functionArguments: [],
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
  
  console.log('✅ Subaccount created successfully!\n');
  
  // Step 5: Retrieve subaccount address via API
  console.log('Step 5: Retrieving subaccount address via API...');
  console.log('   This is the documented way to get your subaccount address.\n');
  
  // Wait a moment for indexer to catch up
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const response = await fetch(
      `${config.REST_API_BASE_URL}/api/v1/subaccounts?owner=${account.accountAddress.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const subaccounts = await response.json() as any[];
    
    if (!subaccounts || subaccounts.length === 0) {
      console.warn('⚠️ No subaccounts found. The indexer might need more time.');
      console.warn('   Try running this command again in a few seconds:');
      console.warn(`   curl "${config.REST_API_BASE_URL}/api/v1/subaccounts?owner=${account.accountAddress.toString()}"\n`);
      return;
    }
    
    console.log(`✅ Found ${subaccounts.length} subaccount(s):\n`);
    
    subaccounts.forEach((sub: any, index: number) => {
      console.log(`Subaccount #${index + 1}:`);
      console.log(`  Address:     ${sub.subaccount_address}`);
      console.log(`  Is Primary:  ${sub.is_primary}`);
      console.log(`  Is Active:   ${sub.is_active}`);
      console.log(`  Label:       ${sub.custom_label || '(none)'}\n`);
    });
    
    // Automatically update .env file with subaccount address
    const primarySubaccount = subaccounts.find((s: any) => s.is_primary) || subaccounts[0];
    const subaccountAddress = primarySubaccount.subaccount_address;
    
    console.log('📝 Updating .env file with subaccount address...\n');
    
    try {
      const envPath = path.join(__dirname, '../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the placeholder with actual address
      const placeholder = 'SUBACCOUNT_ADDRESS=0xYOUR_SUBACCOUNT_ADDRESS_HERE';
      const replacement = `SUBACCOUNT_ADDRESS=${subaccountAddress}`;
      
      if (envContent.includes(placeholder)) {
        envContent = envContent.replace(placeholder, replacement);
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Updated .env file successfully!');
        console.log(`   SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
      } else if (envContent.includes('SUBACCOUNT_ADDRESS=')) {
        // Already has a value, update it
        envContent = envContent.replace(
          /SUBACCOUNT_ADDRESS=0x[a-fA-F0-9]+/,
          replacement
        );
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Updated .env file with new subaccount address!');
        console.log(`   SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
      } else {
        console.warn('⚠️ Could not find SUBACCOUNT_ADDRESS in .env file');
        console.warn('   Please add manually:');
        console.warn(`   SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
      }
    } catch (error) {
      console.error('❌ Error updating .env file:', error);
      console.log('\n📝 Please manually add to your .env file:');
      console.log(`SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
    }
    
    console.log('━'.repeat(80));
    console.log('🎉 Subaccount Creation Complete!');
    console.log('━'.repeat(80));
    console.log(`Subaccount Address: ${subaccountAddress}`);
    console.log('━'.repeat(80) + '\n');
    
    console.log('Next steps:');
    console.log('  2. Run: npm run mint-usdc          - Mint testnet USDC');
    console.log('  3. Run: npm run deposit-usdc       - Deposit USDC to subaccount');
    console.log('  4. Run: npm run place-order        - Place your first order\n');
    
  } catch (error) {
    console.error('❌ Error retrieving subaccount:', error);
    console.error('\nYou can try manually querying:');
    console.error(`curl "${config.REST_API_BASE_URL}/api/v1/subaccounts?owner=${account.accountAddress.toString()}"\n`);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});