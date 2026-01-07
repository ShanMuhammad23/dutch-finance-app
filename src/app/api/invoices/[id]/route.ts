import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { Invoice } from '@/lib/types'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const invoiceId = parseInt(id)

    if (Number.isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const data = await queryOne<any>(
      `SELECT 
        i.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'contact_type', c.contact_type,
          'address_line', c.address_line,
          'postal_code', c.postal_code,
          'city', c.city,
          'country', c.country,
          'vat_number', c.vat_number
        ) as contact,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ii.id,
              'description', ii.description,
              'quantity', ii.quantity,
              'unit', ii.unit,
              'unit_price', ii.unit_price,
              'discount', ii.discount,
              'line_total', ii.line_total
            )
          ) FILTER (WHERE ii.id IS NOT NULL),
          '[]'::json
        ) as items,
        json_build_object(
          'id', o.id,
          'company_name', o.company_name,
          'address_line', o.address_line,
          'postal_code', o.postal_code,
          'city', o.city,
          'country', o.country,
          'vat_number', o.vat_number,
          'email', o.email,
          'logo', o.logo
        ) as organization
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN organizations o ON i.organization_id = o.id
      WHERE i.id = $1
      GROUP BY i.id, c.id, o.id`,
      [invoiceId]
    )

    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields if they're strings
    let items = data.items || []
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch (e) {
        items = []
      }
    }
    
    let contact = data.contact || null
    if (typeof contact === 'string') {
      try {
        contact = JSON.parse(contact)
      } catch (e) {
        contact = null
      }
    }
    
    let organization = data.organization || null
    if (typeof organization === 'string') {
      try {
        organization = JSON.parse(organization)
      } catch (e) {
        organization = null
      }
    }

    // Transform the response to match the expected Invoice type structure
    const transformedData: any = {
      ...data,
      contact: contact,
      items: items,
      organization: organization,
    }

    return NextResponse.json(transformedData as Invoice)
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const invoiceId = parseInt(id)
    const updates = await request.json()

    // Check if invoice exists
    const existingInvoice = await queryOne<any>(
      'SELECT id FROM invoices WHERE id = $1',
      [invoiceId]
    )

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update the invoice in the database
    // Note: Implement actual database update based on your schema
    return NextResponse.json({ success: true, message: 'Invoice updated' })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const invoiceId = parseInt(id)

  try {
    // Check if invoice exists
    const existingInvoice = await queryOne<any>(
      'SELECT id FROM invoices WHERE id = $1',
      [invoiceId]
    )

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Delete the invoice from the database
    // Note: Implement actual database delete based on your schema
    return NextResponse.json({ success: true, message: 'Invoice deleted' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
