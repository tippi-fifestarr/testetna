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

import { createAptosClient, createAccount, waitForTransaction, getPrimarySubaccountAddress, getExplorerLink } from '../utils/client';
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
  console.log(`🔗 View on explorer: ${getExplorerLink(pendingTransaction.hash)}\n`);
  
  // Step 4: Wait for confirmation and extract subaccount from events
  console.log('Step 4: Waiting for transaction confirmation...');
  console.log('   (This usually takes 2-5 seconds)\n');
  
  const committedTx = await waitForTransaction(aptos, pendingTransaction.hash);
  
  console.log('✅ Subaccount created successfully!\n');
  
  // Step 5: Extract subaccount address from transaction events (most reliable)
  console.log('Step 5: Extracting subaccount address from transaction events...');
  
  let subaccountFromEvent: string | null = null;
  if ('events' in committedTx && Array.isArray(committedTx.events)) {
    for (const event of committedTx.events) {
      if (event.type && event.type.includes('::dex_accounts::SubaccountCreatedEvent')) {
        const eventData = event.data as any;
        if (eventData.owner === account.accountAddress.toString()) {
          subaccountFromEvent = eventData.subaccount;
          break;
        }
      }
    }
  }
  
  if (subaccountFromEvent) {
    console.log(`✅ Extracted subaccount from transaction: ${subaccountFromEvent}`);
    console.log('   (This is the exact subaccount created in this transaction)\n');
  } else {
    console.log('⚠️ Could not extract subaccount from events, will use API as fallback\n');
  }
  
  // Step 6: Calculate primary subaccount address (for comparison only)
  const calculatedSubaccountAddress = getPrimarySubaccountAddress(account.accountAddress);
  
  // Step 7: Retrieve subaccount address via API (for verification and listing)
  console.log('Step 7: Retrieving subaccount details via API...');
  console.log('   (This may take a few seconds for the indexer to catch up)\n');
  
  let subaccountAddress = subaccountFromEvent || calculatedSubaccountAddress.toString(); // Use event first
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
      
      // Find the subaccount we just created (from event) in the API response
      const createdSubaccount = subaccountFromEvent 
        ? subaccounts.find((s: any) => s.subaccount_address.toLowerCase() === subaccountFromEvent.toLowerCase())
        : null;
      
      // Show all subaccounts, highlighting the one we just created
      subaccounts.forEach((sub: any, index: number) => {
        const isJustCreated = createdSubaccount && sub.subaccount_address === createdSubaccount.subaccount_address;
        const marker = isJustCreated ? ' ⭐ (just created)' : '';
        console.log(`Subaccount #${index + 1}:${marker}`);
        console.log(`  Address:     ${sub.subaccount_address}`);
        console.log(`  Is Primary:  ${sub.is_primary}`);
        console.log(`  Is Active:   ${sub.is_active}`);
        console.log(`  Label:       ${sub.custom_label || '(none)'}\n`);
      });
      
      // Use event address as source of truth, verify with API
      if (createdSubaccount) {
        subaccountAddress = createdSubaccount.subaccount_address;
        verifiedViaAPI = true;
        console.log(`✅ Verified: Subaccount from transaction matches API`);
        console.log(`   Address: ${subaccountAddress}\n`);
      } else if (subaccountFromEvent) {
        // Event address exists but not in API yet (indexer lag)
        subaccountAddress = subaccountFromEvent;
        console.log(`✅ Using subaccount from transaction event: ${subaccountAddress}`);
        console.log(`   (Not yet in API - indexer may need more time)\n`);
      } else {
        // Fallback: use first non-primary from API
        const nonPrimarySubaccounts = subaccounts.filter((s: any) => !s.is_primary);
        const fallbackSubaccount = nonPrimarySubaccounts.length > 0 
          ? nonPrimarySubaccounts[0]
          : subaccounts[0];
        subaccountAddress = fallbackSubaccount.subaccount_address;
        verifiedViaAPI = true;
        console.log(`✅ Using subaccount from API: ${subaccountAddress}`);
        console.log(`   (Could not extract from transaction events)\n`);
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
    
  // Step 8: Update .env file with subaccount address
  console.log('Step 8: Updating .env file with subaccount address...\n');
  
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
  
  const QUICK_WIN_MODE = process.env.QUICK_WIN_MODE === 'true';
  if (!QUICK_WIN_MODE) {
    console.log('Next steps:');
    console.log('  1. Run: npm run mint-usdc          - Mint testnet USDC');
    console.log('  2. Run: npm run deposit-usdc       - Deposit USDC to subaccount');
    console.log('  3. Run: npm run place-order        - Place your first order\n');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});