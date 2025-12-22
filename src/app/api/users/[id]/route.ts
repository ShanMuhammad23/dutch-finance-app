import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { auth } from '../../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

// Helper to ensure only privileged roles can manage users
async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      ),
    }
  }

  return { session }
}

// PATCH - Update user (name, email, role)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const guard = await requireAdmin()
    if ('errorResponse' in guard) return guard.errorResponse

    const id = Number(params.id)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const body = await request.json()
    const { full_name, email, role } = body as {
      full_name?: string
      email?: string
      role?: 'owner' | 'admin' | 'accountant' | 'bookkeeper'
    }

    if (!full_name && !email && !role) {
      return NextResponse.json(
        { error: 'Nothing to update. Provide at least one of full_name, email or role.' },
        { status: 400 },
      )
    }

    const validRoles = ['owner', 'admin', 'accountant', 'bookkeeper']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 },
      )
    }

    const fields: string[] = []
    const values: any[] = []

    if (full_name !== undefined) {
      fields.push('full_name = $' + (fields.length + 1))
      values.push(full_name)
    }
    if (email !== undefined) {
      fields.push('email = $' + (fields.length + 1))
      values.push(email)
    }
    if (role !== undefined) {
      fields.push('role = $' + (fields.length + 1))
      values.push(role)
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      )
    }

    // Add id parameter
    values.push(id)
    const idParamIndex = fields.length + 1

    const setClause = fields.join(', ')

    const updatedUser = await queryOne<{
      id: number
      full_name: string
      email: string
      role: string
      created_at: string
    }>(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${idParamIndex}
       RETURNING id, full_name, email, role, created_at`,
      values,
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log activity
    await logActivityFromRequest(
      'UPDATE',
      'user',
      {
        entity_id: updatedUser.id,
        description: `Updated user: ${updatedUser.full_name} (${updatedUser.email})`,
        details: {
          user_id: updatedUser.id,
          changes: {
            full_name: full_name !== undefined ? full_name : undefined,
            email: email !== undefined ? email : undefined,
            role: role !== undefined ? role : undefined,
          },
        },
        request,
        session: guard.session,
      }
    )

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser })
  } catch (error: any) {
    console.error('Error in PATCH /api/users/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE - Remove user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const guard = await requireAdmin()
    if ('errorResponse' in guard) return guard.errorResponse

    const id = Number(params.id)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const deletedUser = await queryOne<{ id: number }>(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id],
    )

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log activity
    await logActivityFromRequest(
      'DELETE',
      'user',
      {
        entity_id: deletedUser.id,
        description: `Deleted user with ID: ${deletedUser.id}`,
        details: {
          deleted_user_id: deletedUser.id,
        },
        request: _request,
        session: guard.session,
      }
    )

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/users/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}


