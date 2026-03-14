import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

/**
 * PATCH /api/bank-transactions/[id]
 * Update reconciliation: set or clear invoice_id / purchase_id
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const transactionId = Number(id)
    if (Number.isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
    }

    const body = await request.json()
    const { invoice_id, purchase_id } = body

    // Allow null to clear the link
    const invoiceId = invoice_id === undefined ? undefined : (invoice_id === null ? null : Number(invoice_id))
    const purchaseId = purchase_id === undefined ? undefined : (purchase_id === null ? null : Number(purchase_id))

    if (invoiceId !== undefined && invoiceId !== null && Number.isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice_id' }, { status: 400 })
    }
    if (purchaseId !== undefined && purchaseId !== null && Number.isNaN(purchaseId)) {
      return NextResponse.json({ error: 'Invalid purchase_id' }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (invoiceId !== undefined) {
      updates.push(`invoice_id = $${paramIndex}`)
      values.push(invoiceId)
      paramIndex++
    }
    if (purchaseId !== undefined) {
      updates.push(`purchase_id = $${paramIndex}`)
      values.push(purchaseId)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(transactionId)
    const result = await queryOne<any>(
      `UPDATE bank_transactions
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    if (!result) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PATCH /api/bank-transactions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
