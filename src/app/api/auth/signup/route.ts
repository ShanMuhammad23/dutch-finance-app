import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, password } = body

    // Validate input
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create user
    const data = await queryOne<{ id: number; full_name: string; email: string; role: string; created_at: string }>(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, hashedPassword, 'owner']
    )

    if (!data) {
      console.error('Error creating user: No data returned')
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: data 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
