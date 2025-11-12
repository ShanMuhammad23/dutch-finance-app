import { NextRequest, NextResponse } from 'next/server'
import { Contact, CreateContactInput } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', parseInt(organizationId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
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
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: body.organization_id,
        contact_type: body.contact_type,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address_line: body.address_line,
        postal_code: body.postal_code,
        city: body.city,
        country: body.country || 'Denmark',
        vat_number: body.vat_number,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json(
        { error: error.message },
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
