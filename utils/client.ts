import { Aptos, AptosConfig, Ed25519Account, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { config } from './config';

/**
 * Creates and configures an Aptos client for blockchain interactions
 * Documentation: placing-your-first-order.mdx:31-37
 */
export function createAptosClient(): Aptos {
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: config.FULLNODE_URL,
  });
  
  return new Aptos(aptosConfig);
}

/**
 * Creates an account instance from private key for signing transactions
 * Documentation: placing-your-first-order.mdx:27-30
 */
export function createAccount(): Ed25519Account {
  if (!config.API_WALLET_PRIVATE_KEY) {
    throw new Error('API_WALLET_PRIVATE_KEY not set in environment variables');
  }
  
  return new Ed25519Account({
    privateKey: new Ed25519PrivateKey(config.API_WALLET_PRIVATE_KEY),
  });
}

/**
 * Helper to wait for transaction confirmation with better error handling
 */
export async function waitForTransaction(aptos: Aptos, txHash: string): Promise<void> {
  try {
    console.log(`⏳ Waiting for transaction: ${txHash}`);
    await aptos.waitForTransaction({ transactionHash: txHash });
    console.log(`✅ Transaction confirmed: ${txHash}`);
  } catch (error) {
    console.error(`❌ Transaction failed: ${txHash}`);
    throw error;
  }
}