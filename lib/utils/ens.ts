import { createPublicClient, http, namehash, toBytes, toHex } from 'viem'
import { base } from 'viem/chains'

/**
 * Base Name Service (.base.eth) resolver
 * Base uses ENS's L2 Primary Names protocol
 * Reverse resolution queries Base's reverse resolver on Base L2
 */

// Base Name Service uses ENS contracts on Base
// The reverse resolver is typically at a standard address
// Base Name Service reverse resolver (similar to ENS reverse registrar)
const BASE_REVERSE_RESOLVER_ABI = [
  {
    inputs: [{ name: 'addr', type: 'address' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Base Name Service registry (ENS registry on Base)
// This is the ENS registry deployed on Base
const BASE_ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const

const BASE_ENS_REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const BASE_RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Resolve Base Name Service (.base.eth) name from address
 * Uses Base's reverse resolver on Base L2
 * Base Name Service uses ENS's L2 Primary Names protocol
 */
export async function resolveBaseName(address: string): Promise<string | null> {
  try {
    if (!address || !address.startsWith('0x')) {
      return null
    }

    // Create a public client for Base mainnet
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    // Reverse lookup pattern: keccak256(addr) + ".addr.reverse"
    // First, construct the reverse node
    const reverseNode = namehash(
      `${address.slice(2).toLowerCase()}.addr.reverse`
    )

    // Get the resolver for the reverse node
    try {
      const resolverAddress = await publicClient.readContract({
        address: BASE_ENS_REGISTRY,
        abi: BASE_ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [reverseNode],
      })

      if (!resolverAddress || resolverAddress === '0x0000000000000000000000000000000000000000') {
        return null
      }

      // Query the resolver for the name
      const name = await publicClient.readContract({
        address: resolverAddress,
        abi: BASE_RESOLVER_ABI,
        functionName: 'name',
        args: [reverseNode],
      })

      if (name && typeof name === 'string' && name.length > 0) {
        // Check if it's a .base.eth name
        if (name.endsWith('.base.eth')) {
          return name
        }
        // Also return regular .eth names if they exist
        if (name.endsWith('.eth')) {
          return name
        }
      }
    } catch (error) {
      // If reverse lookup fails, try alternative methods
      console.log('Reverse lookup failed, trying alternative:', error)
    }

    // Alternative: Try querying Base Name Service API/subgraph if available
    // For now, return null if no name found
    return null
  } catch (error) {
    console.error('Base Name Service resolution error:', error)
    return null
  }
}

/**
 * Reverse lookup ENS name from address (Ethereum mainnet)
 * Note: This requires an Ethereum RPC endpoint
 */
export async function resolveENSName(address: string): Promise<string | null> {
  try {
    // For now, return null - ENS resolution requires an Ethereum RPC
    // In production, you could use:
    // 1. A service like Alchemy/Infura
    // 2. The ENS subgraph
    // 3. A backend API that resolves ENS names
    
    return null
  } catch (error) {
    console.error('ENS resolution error:', error)
    return null
  }
}

/**
 * Format address for display
 * Shows first 6 and last 4 characters
 */
export function formatAddress(address: string): string {
  if (!address) return 'Unknown'
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

