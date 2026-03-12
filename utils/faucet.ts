/**
 * Testnet APT funding check.
 *
 * The Aptos Testnet faucet is web-only — no programmatic API.
 * We just check balance and tell the human where to go.
 *
 * Web faucet: https://aptos.dev/network/faucet
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

/**
 * Checks if an account has enough APT. If not, tells the human to go fund it.
 *
 * @param address The address to check
 * @param requiredOctas Minimum balance in octas (default: 50_000_000 = 0.5 APT)
 * @returns The current balance in octas
 */
export async function checkTestnetFunding(address: string, requiredOctas: number = 50_000_000): Promise<number> {
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);

  let balance = 0;
  try {
    balance = await aptos.getAccountAPTAmount({ accountAddress: address });
  } catch {
    // Account doesn't exist yet
  }

  if (balance >= requiredOctas) {
    return balance;
  }

  console.log('');
  console.log('━'.repeat(60));
  console.log('💡 You need APT for gas fees!');
  console.log('━'.repeat(60));
  console.log('');
  console.log('   1. Go to https://aptos.dev/network/faucet');
  console.log(`   2. Paste your address: ${address}`);
  console.log('   3. Click "Fund"');
  console.log('   4. Come back and re-run this script.');
  console.log('');

  throw new Error('Fund your account at https://aptos.dev/network/faucet then re-run.');
}
