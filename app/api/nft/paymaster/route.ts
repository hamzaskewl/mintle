import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Base Paymaster API endpoint
 * Sponsors gas for user transactions
 * 
 * Base Paymaster endpoints:
 * - Mainnet: https://paymaster.base.org/v2/8453 ($15k/month limit)
 * - Sepolia: https://paymaster.base.org/v2/84532 (UNLIMITED for testing!)
 * 
 * Note: Sepolia has unlimited free sponsorship - perfect for testing!
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      userOperation,
      chainId = '84532' // Default to Sepolia, use '8453' for mainnet
    } = body
    
    if (!userOperation) {
      return NextResponse.json(
        { error: 'Missing userOperation' },
        { status: 400 }
      )
    }
    
    // Base Paymaster endpoint
    const paymasterUrl = `https://paymaster.base.org/v2/${chainId}`
    
    // Request paymaster sponsorship
    const paymasterResponse = await fetch(paymasterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_sponsorUserOperation',
        params: [userOperation, { mode: 'SPONSORED' }]
      })
    })
    
    if (!paymasterResponse.ok) {
      const errorText = await paymasterResponse.text()
      console.error('Paymaster error:', errorText)
      return NextResponse.json(
        { error: 'Paymaster request failed', details: errorText },
        { status: paymasterResponse.status }
      )
    }
    
    const paymasterData = await paymasterResponse.json()
    
    return NextResponse.json({
      success: true,
      paymasterAndData: paymasterData.result?.paymasterAndData,
      verificationGasLimit: paymasterData.result?.verificationGasLimit,
      callGasLimit: paymasterData.result?.callGasLimit,
      preVerificationGas: paymasterData.result?.preVerificationGas,
    })
    
  } catch (error) {
    console.error('Paymaster API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get paymaster sponsorship',
        details: String(error)
      },
      { status: 500 }
    )
  }
}

