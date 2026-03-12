/**
 * Step 0: Check Wallet Funding (Prerequisite)
 *
 * Verifies your wallet has APT for gas fees.
 * If not, prints the faucet link and stops.
 *
 * You must fund your wallet BEFORE running this:
 * https://aptos.dev/network/faucet
 */

import { createAptosClient, createAccount } from '../utils/client';
import { checkTestnetFunding } from '../utils/faucet';

async function main() {
  console.log('💰 Checking Wallet Funding\n');

  const aptos = createAptosClient();
  const account = createAccount();
  const address = account.accountAddress.toString();

  console.log(`Account: ${address}\n`);

  const balance = await checkTestnetFunding(address);
  const apt = balance / 100_000_000;

  console.log(`✅ Balance: ${apt.toFixed(4)} APT — ready to go!\n`);

  const QUICK_WIN_MODE = process.env.QUICK_WIN_MODE === 'true';
  if (!QUICK_WIN_MODE) {
    console.log('Next steps:');
    console.log('  1. npm run setup              - Verify connection');
    console.log('  2. npm run create-subaccount  - Create trading subaccount');
    console.log('  3. npm run mint-usdc          - Mint USDC collateral');
    console.log('  4. npm run deposit-usdc       - Deposit to subaccount\n');
  }
}

main().catch((error) => {
  if (error.message?.includes('aptos.dev')) {
    process.exit(1);
  }
  console.error('Fatal error:', error);
  process.exit(1);
});
