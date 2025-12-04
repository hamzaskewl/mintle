'use client'

import { encodeFunctionData, type Address, type Hex } from 'viem'
import { NFT_ABI } from './contract'

/**
 * Account Abstraction utilities for Base
 * Handles user operations and paymaster integration
 */

export interface UserOperation {
  sender: Address
  nonce: Hex
  initCode: Hex
  callData: Hex
  callGasLimit: Hex
  verificationGasLimit: Hex
  preVerificationGas: Hex
  maxFeePerGas: Hex
  maxPriorityFeePerGas: Hex
  paymasterAndData: Hex
  signature: Hex
}

/**
 * Get paymaster sponsorship for a user operation
 */
export async function getPaymasterSponsorship(
  userOperation: Partial<UserOperation>,
  chainId: string = '84532' // Base Sepolia
): Promise<{
  paymasterAndData?: Hex
  verificationGasLimit?: Hex
  callGasLimit?: Hex
  preVerificationGas?: Hex
} | null> {
  try {
    const response = await fetch('/api/nft/paymaster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userOperation,
        chainId
      })
    })
    
    if (!response.ok) {
      console.warn('Paymaster sponsorship failed:', await response.text())
      return null
    }
    
    const data = await response.json()
    return {
      paymasterAndData: data.paymasterAndData as Hex,
      verificationGasLimit: data.verificationGasLimit as Hex,
      callGasLimit: data.callGasLimit as Hex,
      preVerificationGas: data.preVerificationGas as Hex,
    }
  } catch (error) {
    console.error('Paymaster error:', error)
    return null
  }
}

/**
 * Prepare a user operation for minting an NFT
 */
export function prepareUserOperation(
  sender: Address,
  contractAddress: Address,
  tokenURI: string,
  nonce: bigint = 0n
): Partial<UserOperation> {
  // Encode the mint function call
  const callData = encodeFunctionData({
    abi: NFT_ABI,
    functionName: 'safeMint',
    args: [sender, tokenURI]
  })
  
  return {
    sender,
    nonce: `0x${nonce.toString(16)}`,
    initCode: '0x' as Hex, // Empty for existing accounts
    callData: callData as Hex,
    callGasLimit: '0x0' as Hex, // Will be estimated
    verificationGasLimit: '0x0' as Hex, // Will be estimated
    preVerificationGas: '0x0' as Hex, // Will be estimated
    maxFeePerGas: '0x0' as Hex, // Will be set by paymaster
    maxPriorityFeePerGas: '0x0' as Hex, // Will be set by paymaster
    paymasterAndData: '0x' as Hex, // Will be set by paymaster
    signature: '0x' as Hex, // Will be signed by user
  }
}

/**
 * Send user operation to bundler
 * Base uses a bundler to execute user operations
 * 
 * Bundler endpoints:
 * - Base Sepolia: https://bundler.base.org/v2/84532
 * - Base Mainnet: https://bundler.base.org/v2/8453
 */
export async function sendUserOperation(
  userOperation: UserOperation,
  chainId: string = '84532'
): Promise<{ userOpHash: string } | null> {
  try {
    // Base bundler endpoint
    const bundlerUrl = `https://bundler.base.org/v2/${chainId}`
    
    // Send user operation to bundler
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOperation, `https://paymaster.base.org/v2/${chainId}`]
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bundler error:', errorText)
      return null
    }
    
    const result = await response.json()
    
    if (result.error) {
      console.error('Bundler RPC error:', result.error)
      return null
    }
    
    return {
      userOpHash: result.result
    }
  } catch (error) {
    console.error('Send user operation error:', error)
    return null
  }
}

