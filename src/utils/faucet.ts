import { config } from './config';
import fetch from 'node-fetch'; // Assuming node-fetch is available or we can use global fetch if Node 18+

/**
 * Funds an account using the private Netna faucet.
 * @param address The address to fund (with or without 0x prefix)
 * @param amount Amount in Octas (1 APT = 100,000,000 Octas)
 */
export async function fundAccount(address: string, amount: number = 10000000000): Promise<string> {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  const url = `${config.FAUCET_URL}/mint?amount=${amount}&address=${cleanAddress}`;
  
  console.log(`🚰 Requesting funds from: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Faucet request failed: ${response.status} ${response.statusText}`);
  }

  const txHash = await response.json();
  // The faucet returns an array like ["txHash"]
  return Array.isArray(txHash) ? txHash[0] : txHash;
}

