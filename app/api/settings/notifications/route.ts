import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { emailOrders, emailMarketing, emailUpdates } = body

    // Update user metadata in Clerk
    const updateResponse = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          emailOrders,
          emailMarketing,
          emailUpdates,
        }
      })
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update user metadata in Clerk')
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
