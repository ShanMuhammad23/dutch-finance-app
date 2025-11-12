import { NextRequest, NextResponse } from 'next/server'

import { calculateInvoiceTotals, calculateLineTotal } from '@/lib/invoice-utils'
import { supabase } from '@/lib/supabase'
import { CreateInvoiceInput } from '@/lib/types'

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

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', parsedId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(data ?? [])
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

    const status = body.status ?? 'draft'
    const itemsForTotals = body.items.map((item) => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
    }))

    const totals = calculateInvoiceTotals(itemsForTotals)

    const invoicePayload: Record<string, unknown> = {
      organization_id: body.organization_id,
      contact_id: body.contact_id ?? null,
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

    const { data, error } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return NextResponse.json(
        { error: error.message },
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
