import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isOTPExpired } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, otp, otp_expiry, "istwofactor" 
      FROM users 
      WHERE email = ${email}
    `

    if (!users[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Check if 2FA is enabled - handle both lowercase and camelCase property names
    const is2FAEnabled = user.istwofactor !== undefined ? user.istwofactor : (user.isTwoFactor || false)
    if (!is2FAEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled for this account' },
        { status: 400 }
      )
    }

    // Check if OTP exists
    if (!user.otp) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    if (isOTPExpired(user.otp_expiry)) {
      // Clear expired OTP
      await sql`
        UPDATE users 
        SET otp = NULL, otp_expiry = NULL
        WHERE id = ${user.id}
      `
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (user.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      )
    }

    // OTP is valid - clear it from database
    await sql`
      UPDATE users 
      SET otp = NULL, otp_expiry = NULL
      WHERE id = ${user.id}
    `

    return NextResponse.json(
      { 
        message: 'OTP verified successfully',
        verified: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verify OTP API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

