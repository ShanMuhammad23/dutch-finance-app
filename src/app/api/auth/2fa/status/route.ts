import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's 2FA status
    const users = await sql`
      SELECT "istwofactor" 
      FROM users 
      WHERE id = ${parseInt(session.user.id)}
    `

    if (!users[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Handle both lowercase and camelCase property names from PostgreSQL
    const is2FAEnabled = users[0].istwofactor !== undefined ? users[0].istwofactor : (users[0].isTwoFactor || false)

    return NextResponse.json(
      { 
        is_twofactor: is2FAEnabled
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('2FA status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

