/**
 * Step 0: Fund Wallet from Netna Faucet
 * 
 * This script:
 * 1. Calls the Netna staging faucet to get APT
 * 2. Shows balance before and after funding
 * 3. APT is used for transaction gas fees
 * 
 * IMPORTANT: This is a prerequisite for ALL other steps!
 * - Without APT, you cannot execute blockchain transactions
 * - The faucet gives 100 APT (sufficient for many transactions)
 * 
 * Faucet URL discovered from Java example:
 * https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app
 */

import { createAptosClient, createAccount } from '../utils/client';
import { fundFromNetnaFaucet } from '../utils/faucet';

async function main() {
  console.log('💰 Funding Wallet from Netna Faucet\n');
  
  // Initialize client and account
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account: ${account.accountAddress.toString()}\n`);
  
  // Step 1: Check current balance
  console.log('Step 1: Checking current APT balance...');
  
  let currentBalance = 0;
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });
    
    currentBalance = balance / 100_000_000; // Convert octas to APT
    console.log(`✅ Current balance: ${currentBalance.toFixed(4)} APT\n`);
    
    if (currentBalance >= 1) {
      console.log('ℹ️ You already have sufficient APT for transactions.');
      console.log('   Skipping faucet request.\n');
      return;
    }
    
  } catch (error) {
    console.log('⚠️ Could not fetch balance (account may not exist yet)');
    console.log('   This is normal for new accounts.\n');
  }
  
  // Step 2: Request funding from faucet
  console.log('Step 2: Requesting 100 APT from Netna faucet...');
  console.log('━'.repeat(60));
  console.log('Faucet: https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app');
  console.log('Amount: 100 APT (10,000,000,000 octas)');
  console.log('━'.repeat(60) + '\n');
  
  try {
    await fundFromNetnaFaucet(account.accountAddress.toString());
    
    console.log('✅ Faucet request successful!\n');
    
    // Step 3: Verify new balance (with retries)
    console.log('Step 3: Verifying new balance...');
    console.log('   (Waiting for blockchain confirmation...)\n');
    
    let newBalance = 0;
    const MAX_RETRIES = 5;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const delay = attempt * 2000; // 2s, 4s, 6s, 8s, 10s
      if (attempt > 1) {
        console.log(`   Retry attempt ${attempt}/${MAX_RETRIES} (waiting ${delay/1000}s...)\n`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const balance = await aptos.getAccountAPTAmount({
          accountAddress: account.accountAddress,
        });
        
        newBalance = balance / 100_000_000; // Convert octas to APT
        
        if (newBalance > currentBalance) {
          console.log(`✅ New balance: ${newBalance.toFixed(4)} APT\n`);
          break; // Success, exit retry loop
        } else if (attempt < MAX_RETRIES) {
          continue; // Retry
        } else {
          console.log(`⚠️ Balance check: ${newBalance.toFixed(4)} APT (may need more time)\n`);
        }
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          console.warn('⚠️ Could not verify balance after all retries.');
          console.warn('   The faucet request was successful, but balance check failed.\n');
        }
        // Continue to next retry
      }
    }
    
    if (newBalance > 0) {
      console.log('━'.repeat(80));
      console.log('🎉 Wallet Funded Successfully!');
      console.log('━'.repeat(80));
      console.log(`You now have ${newBalance.toFixed(4)} APT for transaction fees.`);
      console.log('This is sufficient for hundreds of transactions!\n');
      
      console.log('💡 Remember:');
      console.log('   - APT = Gas fees for blockchain transactions');
      console.log('   - USDC = Trading collateral (you\'ll mint this next)');
      console.log('   - You need BOTH to trade!\n');
      
      console.log('Next steps:');
      console.log('  1. Run: npm run create-subaccount  - Create trading subaccount');
      console.log('  2. Run: npm run mint-usdc          - Mint USDC collateral');
      console.log('  3. Run: npm run deposit-usdc       - Deposit to subaccount\n');
    } else {
      console.warn('⚠️ Balance is still 0. Possible reasons:');
      console.warn('  1. Blockchain needs more time (wait 10 seconds and check again)');
      console.warn('  2. Faucet may be rate-limited');
      console.warn('  3. Network issues\n');
      console.warn('You can check your balance manually:');
      console.warn(`curl "${process.env.FULLNODE_URL || 'https://api.netna.staging.aptoslabs.com/v1'}/accounts/${account.accountAddress.toString()}"\n`);
    }
    
  } catch (error: any) {
    console.error('❌ Error funding from faucet:', error);
    console.error('\nPossible causes:');
    console.error('  1. Network connection issues');
    console.error('  2. Faucet is temporarily unavailable');
    console.error('  3. Rate limiting (try again in a few minutes)\n');
    
    console.error('You can try manual funding:');
    console.error(`curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=${account.accountAddress.toString().replace('0x', '')}'\n`);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});