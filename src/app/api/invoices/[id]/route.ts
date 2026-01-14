import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { Invoice } from '@/lib/types'
import { auth } from '../../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

export async function GET(
  request: NextRequest,
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
        ) as contact
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = $1`,
      [invoiceId]
    )

    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Transform the response to match the expected Invoice type structure
    const transformedData: any = {
      ...data,
      contact: data.contact || null,
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'invoice',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Viewed invoice #${data.invoice_number || data.id}`,
          details: { invoice_id: data.id },
          request,
          session,
        }
      );
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

    const invoiceIndex = mockInvoices.findIndex(inv => inv.id === invoiceId)

    if (invoiceIndex === -1) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update the invoice
    mockInvoices[invoiceIndex] = {
      ...mockInvoices[invoiceIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(mockInvoices[invoiceIndex])
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

  const invoiceIndex = mockInvoices.findIndex(inv => inv.id === invoiceId)

  if (invoiceIndex === -1) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    )
  }

  mockInvoices.splice(invoiceIndex, 1)

  return NextResponse.json({ success: true })
}
