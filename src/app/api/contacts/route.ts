import { NextRequest, NextResponse } from 'next/server'
import { Contact, CreateContactInput } from '@/lib/types'
import { queryMany, queryOne } from '@/lib/db'
import { auth } from '../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch contacts from database filtered by organization
    const data = await queryMany<Contact>(
      'SELECT * FROM contacts WHERE organization_id = $1 ORDER BY created_at DESC',
      [parseInt(organizationId)]
    )

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'contact',
        {
          organization_id: parseInt(organizationId),
          description: `Viewed contacts list`,
          details: { organization_id: parseInt(organizationId), count: data.length },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateContactInput = await request.json()

    // Validate required fields
    if (!body.organization_id || !body.name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    // Create new contact in database
    const data = await queryOne<Contact>(
      `INSERT INTO contacts (organization_id, contact_type, name, email, phone, address_line, postal_code, city, country, vat_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        body.organization_id,
        body.contact_type,
        body.name,
        body.email,
        body.phone,
        body.address_line,
        body.postal_code,
        body.city,
        body.country || 'Denmark',
        body.vat_number,
      ]
    )

    if (!data) {
      console.error('Error creating contact: No data returned')
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      )
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'CREATE',
        'contact',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Created contact: ${data.name}`,
          details: {
            contact_id: data.id,
            name: data.name,
            contact_type: data.contact_type,
            organization_id: data.organization_id,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
