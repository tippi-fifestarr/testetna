/**
 * Funds an account using the private Netna faucet.
 *
 * Faucet URL discovered from Java example:
 * https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app
 *
 * @param address The address to fund (with or without 0x prefix)
 * @param amount Amount in Octas (default: 10,000,000,000 = 100 APT)
 */
export async function fundFromNetnaFaucet(address: string, amount: number = 10000000000): Promise<void> {
  const FAUCET_URL = 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app';
  
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  const url = `${FAUCET_URL}/mint?amount=${amount}&address=${cleanAddress}`;
  
  console.log(`   Calling faucet at: ${FAUCET_URL}`);
  console.log(`   Amount: ${amount} octas (${amount / 100000000} APT)`);
  
  const response = await fetch(url, {
    method: 'POST',
    body: '', // Empty body required for POST
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Faucet request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  console.log('   ✅ Faucet request successful!');
  console.log('   Waiting for blockchain confirmation...');
  
  // Wait for blockchain to process the transaction
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// Alias for backwards compatibility
export const fundAccount = fundFromNetnaFaucet;

