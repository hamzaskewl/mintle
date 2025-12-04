import { privateKeyToAccount, privateKeyToAddress } from 'viem/accounts'

/**
 * EIP-712 signature generation for NFT minting
 * This ensures only verified game results can be minted
 */

const DOMAIN_NAME = 'MintleNFT'
const DOMAIN_VERSION = '1'

/**
 * Create a signature for minting an NFT using EIP-712
 * @param to Address to mint to
 * @param uri Metadata URI
 * @param score Game score (0-5)
 * @param category Category (0 = movies, 1 = spotify)
 * @param date Game date (YYYY-MM-DD)
 * @param chainId Chain ID (8453 for Base, 84532 for Base Sepolia)
 * @param contractAddress NFT contract address
 * @param privateKey Private key for signing (from env var, must start with 0x)
 */
export async function signMintMessage(
  to: string,
  uri: string,
  score: number,
  category: 'movies' | 'spotify',
  date: string,
  chainId: number,
  contractAddress: string,
  privateKey: `0x${string}`
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(privateKey)
  
  const categoryNum = category === 'movies' ? 0 : 1
  
  // EIP-712 typed data structure
  const domain = {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chainId: chainId,
    verifyingContract: contractAddress as `0x${string}`
  }
  
  const types = {
    MintMessage: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
      { name: 'score', type: 'uint256' },
      { name: 'category', type: 'uint8' },
      { name: 'date', type: 'string' }
    ]
  }
  
  const message = {
    to: to.toLowerCase() as `0x${string}`,
    uri: uri,
    score: BigInt(score),
    category: categoryNum,
    date: date
  }
  
  // Sign the typed data using the account's signTypedData method
  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'MintMessage',
    message
  })
  
  return signature
}

/**
 * Get the signer address from a private key
 */
export function getSignerAddress(privateKey: `0x${string}`): `0x${string}` {
  return privateKeyToAddress(privateKey)
}

