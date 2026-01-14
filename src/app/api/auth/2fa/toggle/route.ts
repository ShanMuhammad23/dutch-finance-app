import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
<<<<<<< HEAD
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'
=======
import { auth } from '@/lib/auth-config'
>>>>>>> d81abe5a6f50e02670cc1058d2aa04a61e0ed1ac

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { istwofactor, isTwofactor } = body // Support both naming conventions
    const is2FAEnabled = istwofactor !== undefined ? istwofactor : isTwofactor

    if (typeof is2FAEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'istwofactor must be a boolean value' },
        { status: 400 }
      )
    }

    // Update user's 2FA setting - use quoted column name to match database
    await sql`
      UPDATE users 
      SET "istwofactor" = ${is2FAEnabled}
      WHERE id = ${parseInt(session.user.id)}
    `

    // Clear OTP if disabling 2FA
    if (!is2FAEnabled) {
      await sql`
        UPDATE users 
        SET otp = NULL, otp_expiry = NULL
        WHERE id = ${parseInt(session.user.id)}
      `
    }

    // Log activity
    await logActivityFromRequest(
      'UPDATE',
      'auth',
      {
        entity_id: parseInt(session.user.id),
        user_id: parseInt(session.user.id),
        description: `Two-factor authentication ${is2FAEnabled ? 'enabled' : 'disabled'}`,
        details: {
          user_id: parseInt(session.user.id),
          is_twofactor: is2FAEnabled,
        },
        request,
        session,
      }
    );

    return NextResponse.json(
      { 
        message: `Two-factor authentication ${is2FAEnabled ? 'enabled' : 'disabled'}`,
        is_twofactor: is2FAEnabled 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('2FA toggle API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

