import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { comparePassword } from '@/lib/auth'

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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Compare password - handle both hashed and plain text passwords
    let isPasswordValid = false
    
    if (user.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt comparison
      isPasswordValid = await comparePassword(password, user.password)
    } else {
      // Password is plain text (legacy), compare directly
      isPasswordValid = password === user.password
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

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
