import NextAuth, { type NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { queryOne } from "@/lib/db"
import { comparePassword, isOTPExpired, generateOTP, getOTPExpiry } from "@/lib/auth"
import { sql } from "@/lib/db"
import { sendHtmlEmail } from "@/lib/email"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
  
  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email, passwordLength: (credentials?.password as string)?.length })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const userProfile = await queryOne<any>(
            'SELECT id, full_name, email, role, password, "istwofactor" FROM users WHERE email = $1',
            [credentials.email]
          )

          if (!userProfile) {
            console.log('❌ User not found')
            return null
          }

          console.log('👤 User found:', { id: userProfile.id, email: userProfile.email })
          console.log('🔑 Stored password format:', userProfile.password.startsWith('$2b$') ? 'Hashed (bcrypt)' : 'Plain text')
          
          // Debug: Log the 2FA status from database
          const is2FAEnabled = userProfile.istwofactor || userProfile.isTwoFactor || false
          console.log('🔐 2FA status from DB:', { 
            istwofactor: userProfile.istwofactor, 
            isTwoFactor: userProfile.isTwoFactor,
            is2FAEnabled 
          })

          // Check if password is hashed (starts with $2b$) or plain text
          let isPasswordValid = false
          
          if (userProfile.password.startsWith('$2b$')) {
            // Password is hashed, use bcrypt comparison
            console.log('🔐 Comparing with bcrypt...')
            isPasswordValid = await comparePassword(credentials.password as string, userProfile.password)
          } else {
            // Password is plain text (legacy), compare directly
            console.log('🔐 Comparing plain text passwords...')
            isPasswordValid = credentials.password as string === userProfile.password
          }
          
          if (!isPasswordValid) {
            console.error('❌ Password mismatch')
            return null
          }

          // Check if 2FA is enabled - handle both lowercase and camelCase property names
          if (is2FAEnabled) {
            console.log('🔐 2FA is enabled, checking OTP...')
            const otp = credentials.otp as string | undefined
            console.log('🔐 OTP value received:', { 
              otp, 
              otpType: typeof otp, 
              otpLength: otp?.length,
              otpTrimmed: otp?.trim(),
              hasOTP: !!(otp && otp.trim() !== '')
            })
            const hasOTP = otp && otp.trim() !== ''

            if (!hasOTP) {
              console.log('❌ OTP required but not provided - generating and sending OTP automatically')
              
              // Automatically generate and send OTP
              const otpCode = generateOTP()
              const otpExpiry = getOTPExpiry(10) // 10 minutes expiry
              
              // Store OTP in database
              await sql`
                UPDATE users 
                SET otp = ${otpCode}, otp_expiry = ${otpExpiry.toISOString()}
                WHERE id = ${userProfile.id}
              `
              
              console.log('✅ OTP generated and saved to database:', { otp: otpCode, expiry: otpExpiry })
              
              // Send OTP via email
              try {
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
                        <p>Hello ${userProfile.full_name || 'User'},</p>
                        <p>You have requested to sign in to your account. Please use the following verification code:</p>
                        <div style="background-color: #ffffff; border: 2px dashed #3498db; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
                          <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
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

Hello ${userProfile.full_name || 'User'},

You have requested to sign in to your account. Please use the following verification code:

${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.
                `
                
                await sendHtmlEmail(
                  userProfile.email,
                  'Your Login Verification Code',
                  emailHtml,
                  emailText
                )
                
                console.log('✅ OTP email sent successfully to:', userProfile.email)
              } catch (emailError) {
                console.error('❌ Failed to send OTP email:', emailError)
                // Don't fail login if email fails - OTP is still saved in DB
              }
              
              // Throw error with message that NextAuth will pass through
              const error: any = new Error('OTP_REQUIRED: A verification code has been sent to your email. Please enter it to continue.')
              error.type = 'OTP_REQUIRED'
              throw error
            }

            console.log('🔐 OTP provided, validating against database...')
            // Get user's OTP from database
            const userWithOTP = await sql`
              SELECT otp, otp_expiry 
              FROM users 
              WHERE id = ${userProfile.id}
            `

            if (!userWithOTP[0]?.otp) {
              console.log('❌ No OTP found in database for user')
              const error: any = new Error('OTP_NOT_FOUND: No verification code found. Please request a new code.')
              error.type = 'OTP_NOT_FOUND'
              throw error
            }

            // Check if OTP has expired
            if (isOTPExpired(userWithOTP[0].otp_expiry)) {
              console.log('❌ OTP has expired')
              // Clear expired OTP
              await sql`
                UPDATE users 
                SET otp = NULL, otp_expiry = NULL
                WHERE id = ${userProfile.id}
              `
              const error: any = new Error('OTP_EXPIRED: The verification code has expired. Please request a new code.')
              error.type = 'OTP_EXPIRED'
              throw error
            }

            // Verify OTP
            if (userWithOTP[0].otp !== otp.trim()) {
              console.log('❌ Invalid OTP')
              const error: any = new Error('OTP_INVALID: Invalid verification code. Please try again.')
              error.type = 'OTP_INVALID'
              throw error
            }

            // OTP is valid - clear it from database
            await sql`
              UPDATE users 
              SET otp = NULL, otp_expiry = NULL
              WHERE id = ${userProfile.id}
            `

            console.log('✅ OTP verified successfully')
          }

          console.log('✅ Password valid, creating session')
          return {
            id: userProfile.id.toString(),
            email: userProfile.email,
            name: userProfile.full_name,
            role: userProfile.role,
            // organizationId will be fetched separately if needed
          }
        } catch (error: any) {
          console.error('❌ Auth error:', error)
          // Re-throw custom OTP errors so frontend can handle them
          if (error?.type && (
            error.type === 'OTP_REQUIRED' ||
            error.type === 'OTP_NOT_FOUND' ||
            error.type === 'OTP_EXPIRED' ||
            error.type === 'OTP_INVALID'
          )) {
            // Re-throw with the original error message so NextAuth passes it through
            throw error
          }
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.sub || ''
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const { handlers, auth } = NextAuth(authOptions)

export const { GET, POST } = handlers
export { auth }
