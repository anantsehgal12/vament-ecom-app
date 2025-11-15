import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user data from Clerk to get metadata
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Clerk')
    }

    const userData = await response.json()
    const metadata = userData.public_metadata || {}

    return NextResponse.json({
      standardDeliveryFee: metadata.standardDeliveryFee || '50',
      freeDeliveryThreshold: metadata.freeDeliveryThreshold || '500',
      freeDeliveryCoupon: metadata.freeDeliveryCoupon ?? true,
    })
  } catch (error) {
    console.error('Error fetching delivery fees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery fees' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { standardDeliveryFee, freeDeliveryThreshold, freeDeliveryCoupon } = body

    // Update user metadata in Clerk
    const updateResponse = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          standardDeliveryFee,
          freeDeliveryThreshold,
          freeDeliveryCoupon,
        }
      })
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update user metadata in Clerk')
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery fees updated successfully'
    })
  } catch (error) {
    console.error('Error updating delivery fees:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery fees' },
      { status: 500 }
    )
  }
}
