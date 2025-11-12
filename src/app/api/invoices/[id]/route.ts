import { NextResponse } from 'next/server'
import { Invoice } from '@/lib/types'

// Mock data - in a real app, this would connect to your database
const mockInvoices: Invoice[] = []

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const invoiceId = parseInt(id)

  const invoice = mockInvoices.find(inv => inv.id === invoiceId)

  if (!invoice) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(invoice)
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
