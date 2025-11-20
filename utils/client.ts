import { Aptos, AptosConfig, Ed25519Account, Ed25519PrivateKey, Network, AccountAddress } from '@aptos-labs/ts-sdk';
import { config } from './config';
import { sha3_256 } from '@noble/hashes/sha3';

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

/**
 * Creates an object address from a creator address and seed
 * Matches the Java example's implementation: SHA3-256(creator + seed + 0xFE)
 *
 * @param creatorAddress The address that created the object (usually package address)
 * @param seed The seed string used to derive the object
 * @returns The derived object address
 */
export function createObjectAddress(creatorAddress: string, seed: string): AccountAddress {
  // Remove 0x prefix if present
  const cleanAddress = creatorAddress.startsWith('0x')
    ? creatorAddress.slice(2)
    : creatorAddress;
  
  // Convert hex address to bytes
  const addressBytes = Buffer.from(cleanAddress, 'hex');
  
  // Convert seed to bytes
  const seedBytes = Buffer.from(seed, 'utf-8');
  
  // Create the data to hash: address + seed + 0xFE (object marker)
  const data = Buffer.concat([
    addressBytes,
    seedBytes,
    Buffer.from([0xFE]) // Object address marker
  ]);
  
  // Hash with SHA3-256
  const hash = sha3_256(data);
  
  // Convert hash to hex string with 0x prefix
  const hashHex = '0x' + Buffer.from(hash).toString('hex');
  
  return AccountAddress.from(hashHex);
}