import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { comparePassword } from '@/lib/auth'
import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL!, { 
  ssl: 'require' 
})
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await sql`SELECT * FROM users WHERE email = ${email}`

    if (!user[0]) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Compare password - handle both hashed and plain text passwords
    let isPasswordValid = false
    
    if (user[0].password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt comparison
      isPasswordValid = await comparePassword(password, user[0].password)
    } else {
      // Password is plain text (legacy), compare directly
      isPasswordValid = password === user[0].password
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user[0]

    return NextResponse.json(
      { 
        message: 'Login successful',
        user: userWithoutPassword 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
