/**
 * Resolve ENS name from address
 * Uses the public ENS resolver on Ethereum mainnet
 */

const ENS_RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const
const ENS_RESOLVER = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41' as const

/**
 * Reverse lookup ENS name from address
 * Note: This requires an Ethereum RPC endpoint
 * For Base addresses, we'll check if they have an ENS name on Ethereum mainnet
 */
export async function resolveENSName(address: string): Promise<string | null> {
  try {
    // For now, return null - ENS resolution requires an Ethereum RPC
    // In production, you could use:
    // 1. A service like Alchemy/Infura
    // 2. The ENS subgraph
    // 3. A backend API that resolves ENS names
    
    // Placeholder: You can implement this later with an RPC provider
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

