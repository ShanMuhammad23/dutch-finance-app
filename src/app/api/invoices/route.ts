import { NextRequest, NextResponse } from 'next/server'

import { calculateInvoiceTotals, calculateLineTotal } from '@/lib/invoice-utils'
import { queryMany, queryOne } from '@/lib/db'
import { CreateInvoiceInput } from '@/lib/types'
import { checkInvoiceLimit, getLimitErrorMessage } from '@/lib/plan-limits'
import { countInvoicesThisMonth, getOrganizationPlan } from '@/lib/plan-utils'
import { auth } from '../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 },
      )
    }

    const parsedId = Number(organizationId)

    if (Number.isNaN(parsedId)) {
      return NextResponse.json(
        { error: 'Organization ID must be a valid number' },
        { status: 400 },
      )
    }

    const data = await queryMany<any>(
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
        ) as items
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.organization_id = $1
      GROUP BY i.id, c.id
      ORDER BY i.created_at DESC`,
      [parsedId]
    )

    // Transform the response to match the expected Invoice type structure
    const transformedData = data.map((invoice: any) => {
      // Parse JSON fields if they're strings
      let items = invoice.items || []
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items)
        } catch (e) {
          items = []
        }
      }
      
      let contact = invoice.contact || null
      if (typeof contact === 'string') {
        try {
          contact = JSON.parse(contact)
        } catch (e) {
          contact = null
        }
      }
      
      return {
        ...invoice,
        contact: contact,
        items: items,
      }
    })

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'invoice',
        {
          organization_id: parsedId,
          description: `Viewed invoices list`,
          details: { organization_id: parsedId, count: transformedData.length },
          request,
          session,
        }
      );
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in GET /api/invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceInput = await request.json()

    if (
      !body.organization_id ||
      !body.issue_date ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Check plan limits for invoice creation
    const plan = await getOrganizationPlan(body.organization_id)
    const currentInvoiceCount = await countInvoicesThisMonth(body.organization_id)
    const limitCheck = checkInvoiceLimit(currentInvoiceCount, plan)

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: getLimitErrorMessage('invoices', plan, limitCheck.current, limitCheck.limit),
          limitExceeded: true,
          limitType: 'invoices',
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 },
      )
    }

    const status = body.status ?? 'draft'
    const itemsForTotals = body.items.map((item) => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
    }))

    const totals = calculateInvoiceTotals(itemsForTotals)

    const invoicePayload: Record<string, unknown> = {
      organization_id: body.organization_id,
      contact_id: typeof body.contact_id === 'number' ? body.contact_id : null,
      created_by: null,
      issue_date: body.issue_date,
      due_date: body.due_date ?? null,
      payment_terms: body.payment_terms ?? 'Net 8 days',
      status,
      comments: body.comments ?? null,
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      tax_total: totals.tax_total,
      total_amount: totals.total_amount,
      currency: body.currency ?? 'DKK',
      bank_reg_no: body.bank_reg_no ?? null,
      bank_account_no: body.bank_account_no ?? null,
      interest_rate: body.interest_rate ?? 0.81,
      late_fee: body.late_fee ?? 100,
      is_published: status !== 'draft',
    }

    if (typeof body.invoice_number === 'number') {
      invoicePayload.invoice_number = body.invoice_number
    }

    // Build INSERT query dynamically
    const fields = Object.keys(invoicePayload)
    const values = Object.values(invoicePayload)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const fieldNames = fields.join(', ')

    const data = await queryOne<any>(
      `INSERT INTO invoices (${fieldNames})
       VALUES (${placeholders})
       RETURNING *`,
      values
    )

    if (!data) {
      console.error('Error creating invoice: No data returned')
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 },
      )
    }

    const itemsWithTotals = body.items.map((item, index) => ({
      id: index + 1,
      invoice_id: data.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
      line_total: calculateLineTotal(item.quantity, item.unit_price, item.discount ?? 0),
    }))

<<<<<<< HEAD
    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'CREATE',
        'invoice',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Created invoice #${data.invoice_number || data.id}`,
          details: {
            invoice_id: data.id,
            invoice_number: data.invoice_number,
            status: data.status,
            total_amount: data.total_amount,
            organization_id: data.organization_id,
          },
          request,
          session,
        }
      );
=======
    // Insert invoice items (line_total is a generated column, so we don't insert it)
    for (const item of itemsWithTotals) {
      await queryOne(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit, unit_price, discount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [item.invoice_id, item.description, item.quantity, item.unit, item.unit_price, item.discount]
      )
    }

    // If status is 'sent' and contact has email, send email automatically
    if (status === 'sent' && body.contact_id) {
      try {
        const contact = await queryOne<any>(
          'SELECT email FROM contacts WHERE id = $1',
          [body.contact_id]
        )
        
        if (contact?.email) {
          // Trigger email sending in background (don't wait for it)
          fetch(`${request.nextUrl.origin}/api/invoices/${data.id}/send-email`, {
            method: 'POST',
          }).catch(err => {
            console.error('Failed to send invoice email:', err)
            // Don't fail the request if email fails
          })
        }
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError)
        // Don't fail the request if email fails
      }
>>>>>>> d81abe5a6f50e02670cc1058d2aa04a61e0ed1ac
    }

    return NextResponse.json(
      {
        ...data,
        items: itemsWithTotals,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error in POST /api/invoices:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 },
    )
  }
}
