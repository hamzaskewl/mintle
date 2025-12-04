import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Webhook endpoint for Base Mini App notifications
 * This receives events from Base app (notifications, user actions, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Log webhook events for debugging
    console.log('Webhook received:', body)
    
    // Handle different webhook event types
    // You can extend this to handle specific events like:
    // - User interactions
    // - Notification responses
    // - Payment confirmations
    // etc.
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook received' 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    )
  }
}

// Also handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ 
    message: 'MorL Mini App Webhook',
    status: 'active' 
  })
}

