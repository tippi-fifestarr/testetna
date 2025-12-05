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

import { createAptosClient, createAccount, waitForTransaction, getPrimarySubaccountAddress } from '../utils/client';
import { config, authenticatedFetch } from '../utils/config';
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
  
  // Step 5: Calculate primary subaccount address deterministically (as fallback)
  console.log('Step 5: Calculating primary subaccount address (fallback)...');
  const calculatedSubaccountAddress = getPrimarySubaccountAddress(account.accountAddress);
  console.log(`✅ Primary subaccount address: ${calculatedSubaccountAddress.toString()}`);
  console.log('   (This is a fallback - we\'ll use the API response if available)\n');
  
  // Step 6: Retrieve subaccount address via API (with retries)
  console.log('Step 6: Retrieving subaccount address via API...');
  console.log('   (This may take a few seconds for the indexer to catch up)\n');
  
  let subaccountAddress = calculatedSubaccountAddress.toString(); // Fallback
  let verifiedViaAPI = false;
  const MAX_RETRIES = 5;
  
  // Retry logic: try up to 5 times with increasing delays
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const delay = attempt * 2000; // 2s, 4s, 6s, 8s, 10s
    if (attempt > 1) {
      console.log(`   Retry attempt ${attempt}/${MAX_RETRIES} (waiting ${delay/1000}s for indexer...)\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
      const response = await authenticatedFetch(
        `${config.REST_API_BASE_URL}/api/v1/subaccounts?owner=${account.accountAddress.toString()}`
      );
      
      if (!response.ok) {
        if (attempt === MAX_RETRIES) {
          console.warn(`⚠️ API returned ${response.status}: ${response.statusText}`);
          console.warn('   Using calculated address as fallback.\n');
          break;
        }
        continue; // Retry
      }
      
      const subaccounts = await response.json() as any[];
      
      if (!subaccounts || subaccounts.length === 0) {
        if (attempt < MAX_RETRIES) {
          continue; // Retry
        }
        // On final attempt, use calculated address
        console.warn('⚠️ Indexer hasn\'t caught up yet after all retries.');
        console.warn('   Using calculated primary subaccount address as fallback.');
        console.warn('   (The subaccount was created successfully on-chain)\n');
        break;
      }
      
      console.log(`✅ Found ${subaccounts.length} subaccount(s) via API:\n`);
      
      subaccounts.forEach((sub: any, index: number) => {
        console.log(`Subaccount #${index + 1}:`);
        console.log(`  Address:     ${sub.subaccount_address}`);
        console.log(`  Is Primary:  ${sub.is_primary}`);
        console.log(`  Is Active:   ${sub.is_active}`);
        console.log(`  Label:       ${sub.custom_label || '(none)'}\n`);
      });
      
      // Use the most recently created non-primary subaccount (the one we just created)
      // create_new_subaccount creates non-primary subaccounts, so filter those out
      // API typically returns subaccounts in creation order, so first non-primary is likely the newest
      const nonPrimarySubaccounts = subaccounts.filter((s: any) => !s.is_primary);
      const mostRecentSubaccount = nonPrimarySubaccounts.length > 0 
        ? nonPrimarySubaccounts[0]  // First non-primary (most recently created)
        : subaccounts[0];  // Fallback to first if somehow all are primary
      
      const apiSubaccountAddress = mostRecentSubaccount.subaccount_address;
      
      // Use API address as source of truth
      subaccountAddress = apiSubaccountAddress;
      verifiedViaAPI = true;
      
      console.log(`✅ Using subaccount from API: ${apiSubaccountAddress}`);
      if (apiSubaccountAddress.toLowerCase() !== calculatedSubaccountAddress.toString().toLowerCase()) {
        console.log(`   (Note: This is a non-primary subaccount created by create_new_subaccount)`);
        console.log(`   (Primary subaccount would be: ${calculatedSubaccountAddress.toString()})\n`);
      } else {
        console.log('   (Matches calculated primary subaccount address)\n');
      }
      
      break; // Success, exit retry loop
      
    } catch (error: any) {
      if (attempt === MAX_RETRIES) {
        console.warn('⚠️ Could not retrieve subaccount via API after all retries.');
        console.warn(`   Error: ${error.message}`);
        console.warn('   Using calculated primary subaccount address as fallback.\n');
        break;
      }
      // Continue to next retry
    }
  }
    
  // Step 7: Update .env file with subaccount address
  console.log('Step 7: Updating .env file with subaccount address...\n');
  
  try {
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add SUBACCOUNT_ADDRESS
    const replacement = `SUBACCOUNT_ADDRESS=${subaccountAddress}`;
    
    if (envContent.includes('SUBACCOUNT_ADDRESS=')) {
      // Update existing value
      envContent = envContent.replace(
        /SUBACCOUNT_ADDRESS=.*/,
        replacement
      );
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('✅ Updated .env file successfully!');
      console.log(`   SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
    } else {
      // Add new line
      envContent += `\n${replacement}\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('✅ Added SUBACCOUNT_ADDRESS to .env file!');
      console.log(`   SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
    }
  } catch (error) {
    console.error('❌ Error updating .env file:', error);
    console.log('\n📝 Please manually add to your .env file:');
    console.log(`SUBACCOUNT_ADDRESS=${subaccountAddress}\n`);
  }
  
  // Success summary
  console.log('━'.repeat(80));
  console.log('🎉 Subaccount Creation Complete!');
  console.log('━'.repeat(80));
  console.log(`Subaccount Address: ${subaccountAddress}`);
  if (verifiedViaAPI) {
    console.log('Status: ✅ Verified via API');
  } else {
    console.log('Status: ✅ Calculated (indexer may need more time)');
  }
  console.log('━'.repeat(80) + '\n');
  
  console.log('Next steps:');
  console.log('  1. Run: npm run mint-usdc          - Mint testnet USDC');
  console.log('  2. Run: npm run deposit-usdc       - Deposit USDC to subaccount');
  console.log('  3. Run: npm run place-order        - Place your first order\n');
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});