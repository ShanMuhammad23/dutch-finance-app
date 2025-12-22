import { NextRequest, NextResponse } from 'next/server'
import { Contact, CreateContactInput } from '@/lib/types'
import { queryMany, queryOne } from '@/lib/db'

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

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
