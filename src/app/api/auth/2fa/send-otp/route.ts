import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateOTP, getOTPExpiry } from '@/lib/auth'
import { sendHtmlEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, full_name, "istwofactor" 
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

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = getOTPExpiry(10) // 10 minutes expiry

    // Store OTP and expiry in database
    await sql`
      UPDATE users 
      SET otp = ${otp}, otp_expiry = ${otpExpiry.toISOString()}
      WHERE id = ${user.id}
    `

    // Send OTP via email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Login Verification Code</h2>
            <p>Hello ${user.full_name || 'User'},</p>
            <p>You have requested to sign in to your account. Please use the following verification code:</p>
            <div style="background-color: #ffffff; border: 2px dashed #3498db; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `

    const emailText = `
Login Verification Code

Hello ${user.full_name || 'User'},

You have requested to sign in to your account. Please use the following verification code:

${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.
    `

    await sendHtmlEmail(
      user.email,
      'Your Login Verification Code',
      emailHtml,
      emailText
    )

    return NextResponse.json(
      { 
        message: 'OTP sent successfully to your email',
        expiresIn: 600 // 10 minutes in seconds
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Send OTP API error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}

