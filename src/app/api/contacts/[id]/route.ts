import { NextRequest, NextResponse } from 'next/server'
import { Contact, UpdateContactInput } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('organization_id', parseInt(organizationId))
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching contact:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
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

    // Update contact in database with organization validation
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('organization_id', parseInt(organizationId))
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        )
      }
      console.error('Error updating contact:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
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
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('organization_id', parseInt(organizationId))

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
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
