import { NextRequest, NextResponse } from 'next/server'
import { queryMany, queryOne } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'
import { auth } from '@/lib/auth-config'
import { logActivityFromRequest } from '@/lib/activity-log'

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only owner/admin can view all users
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const data = await queryMany<{ id: number; full_name: string; email: string; role: string; created_at: string }>(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
    )

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only owner/admin can create users
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { full_name, email, password, role } = body

    // Validate input
    if (!full_name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'accountant', 'bookkeeper']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
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
      [full_name, email, hashedPassword, role]
    )

    if (!data) {
      console.error('Error creating user: No data returned')
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Log activity
    await logActivityFromRequest(
      'CREATE',
      'user',
      {
        entity_id: data.id,
        description: `Created user: ${data.full_name} (${data.email}) with role ${data.role}`,
        details: {
          user_id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
        },
        request,
        session,
      }
    )

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: data 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

