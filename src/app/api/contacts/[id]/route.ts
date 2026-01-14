import { NextRequest, NextResponse } from 'next/server'
import { Contact, UpdateContactInput } from '@/lib/types'
import { queryOne, query } from '@/lib/db'
import { auth } from '../../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const contactId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch contact from database with organization validation
    const data = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = $1 AND organization_id = $2',
      [contactId, parseInt(organizationId)]
    )

    if (!data) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'contact',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Viewed contact: ${data.name}`,
          details: { contact_id: data.id },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const contactId = parseInt(id)
    const updates: UpdateContactInput = await request.json()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Build dynamic UPDATE query based on provided fields
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = $${paramIndex}`)
    updateValues.push(new Date().toISOString())
    paramIndex++

    // Add WHERE clause parameters
    updateValues.push(contactId, parseInt(organizationId))

    const updateQuery = `
      UPDATE contacts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      RETURNING *
    `

    const result = await queryOne<Contact>(updateQuery, updateValues)

    if (!result) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'UPDATE',
        'contact',
        {
          entity_id: result.id,
          organization_id: result.organization_id,
          description: `Updated contact: ${result.name}`,
          details: {
            contact_id: result.id,
            changes: updates,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const contactId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Delete contact from database with organization validation
    const result = await query(
      'DELETE FROM contacts WHERE id = $1 AND organization_id = $2',
      [contactId, parseInt(organizationId)]
    )

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'DELETE',
        'contact',
        {
          entity_id: contactId,
          organization_id: parseInt(organizationId),
          description: `Deleted contact with ID: ${contactId}`,
          details: { deleted_contact_id: contactId },
          request,
          session,
        }
      );
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
