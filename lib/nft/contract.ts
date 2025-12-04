import { createPublicClient, http, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'

/**
 * NFT Contract Configuration
 * 
 * TODO: Deploy your NFT contract and update these addresses
 * 
 * For testing: Use Base Sepolia testnet
 * For production: Use Base mainnet
 */
export const NFT_CONTRACT_ADDRESS = {
  // Update with your deployed contract address
  base: '0x0000000000000000000000000000000000000000', // Base mainnet (update when ready)
  baseSepolia: '0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06', // Base Sepolia testnet
}

/**
 * ERC-721 ABI for minting
 * This is a simplified ABI - your contract may have different functions
 */
export const NFT_ABI = parseAbi([
  'function mint(address to, string memory tokenURI) external returns (uint256)',
  'function safeMint(address to, string memory tokenURI) external returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
])

/**
 * Create a public client for Base network
 */
export function getBaseClient(isTestnet = false) {
  return createPublicClient({
    chain: isTestnet ? baseSepolia : base,
    transport: http()
  })
}

/**
 * Prepare mint transaction data
 * This is a helper function - actual minting happens via account abstraction
 */
export function prepareMintTransaction(
  to: string,
  tokenURI: string,
  isTestnet = false
) {
  const contractAddress = isTestnet 
    ? NFT_CONTRACT_ADDRESS.baseSepolia 
    : NFT_CONTRACT_ADDRESS.base
  
  return {
    to: contractAddress as `0x${string}`,
    functionName: 'safeMint' as const,
    args: [to as `0x${string}`, tokenURI],
    abi: NFT_ABI,
  }
}

/**
 * Get contract address based on network
 */
export function getContractAddress(isTestnet = false): `0x${string}` {
  const address = isTestnet 
    ? NFT_CONTRACT_ADDRESS.baseSepolia 
    : NFT_CONTRACT_ADDRESS.base
  
  if (address === '0x0000000000000000000000000000000000000000') {
    throw new Error('NFT contract not deployed. Please deploy your contract first.')
  }
  
  return address as `0x${string}`
}

