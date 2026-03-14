import { NextRequest, NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'
import type { BankTransactionMatchSuggestion } from '@/lib/types'

/** Score matching: amount exact = 50, date within 30 days = 30, reference/description contains invoice number = 20 */
function scoreInvoiceMatch(
  txAmount: number,
  txDate: string,
  txDesc: string,
  txRef: string,
  inv: { total_amount: number; issue_date: string; due_date?: string; invoice_number: number }
): { score: number; reason: string } {
  let score = 0
  const reasons: string[] = []
  const amountMatch = Math.abs(Number(inv.total_amount) - Math.abs(txAmount)) < 0.02
  if (amountMatch) {
    score += 50
    reasons.push('Amount matches')
  } else {
    const diff = Math.abs(Number(inv.total_amount) - Math.abs(txAmount))
    if (diff < 10) {
      score += 25
      reasons.push('Amount close')
    }
  }
  const txD = new Date(txDate).getTime()
  const issueD = new Date(inv.issue_date).getTime()
  const dueD = inv.due_date ? new Date(inv.due_date).getTime() : issueD
  const daysDiff = Math.min(Math.abs(txD - issueD), inv.due_date ? Math.abs(txD - dueD) : Infinity) / (24 * 60 * 60 * 1000)
  if (daysDiff <= 7) {
    score += 30
    reasons.push('Date within 7 days')
  } else if (daysDiff <= 30) {
    score += 15
    reasons.push('Date within 30 days')
  }
  const refStr = `${txRef || ''} ${txDesc || ''}`.toLowerCase()
  const invNumStr = String(inv.invoice_number)
  if (refStr.includes(invNumStr)) {
    score += 20
    reasons.push('Reference mentions invoice #')
  }
  return { score: Math.min(100, score), reason: reasons.join('; ') || 'Possible match' }
}

function scorePurchaseMatch(
  txAmount: number,
  txDate: string,
  txDesc: string,
  p: { amount_incl_vat: number; attachment_date: string; supplier_name?: string }
): { score: number; reason: string } {
  let score = 0
  const reasons: string[] = []
  const amountMatch = Math.abs(Number(p.amount_incl_vat) - Math.abs(txAmount)) < 0.02
  if (amountMatch) {
    score += 50
    reasons.push('Amount matches')
  } else {
    const diff = Math.abs(Number(p.amount_incl_vat) - Math.abs(txAmount))
    if (diff < 10) {
      score += 25
      reasons.push('Amount close')
    }
  }
  const txD = new Date(txDate).getTime()
  const attachD = new Date(p.attachment_date).getTime()
  const daysDiff = Math.abs(txD - attachD) / (24 * 60 * 60 * 1000)
  if (daysDiff <= 7) {
    score += 30
    reasons.push('Date within 7 days')
  } else if (daysDiff <= 30) {
    score += 15
    reasons.push('Date within 30 days')
  }
  const supplier = (p.supplier_name || '').toLowerCase()
  const desc = (txDesc || '').toLowerCase()
  if (supplier && desc && (desc.includes(supplier.slice(0, 10)) || supplier.slice(0, 10).split(' ').some((w: string) => desc.includes(w)))) {
    score += 20
    reasons.push('Description mentions supplier')
  }
  return { score: Math.min(100, score), reason: reasons.join('; ') || 'Possible match' }
}

/**
 * POST /api/bank-transactions/suggest-matches
 * Body: { organization_id: number, transactions: Array<{ amount, transaction_date, description?, reference? }> }
 * Returns: { suggestions: Array<{ invoices: BankTransactionMatchSuggestion[], purchases: BankTransactionMatchSuggestion[] }> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, transactions } = body

    if (!organization_id || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'organization_id and non-empty transactions array required' },
        { status: 400 }
      )
    }

    const orgId = Number(organization_id)
    if (Number.isNaN(orgId)) {
      return NextResponse.json({ error: 'Invalid organization_id' }, { status: 400 })
    }

    const paidInvoices = await queryMany<any>(
      `SELECT i.id, i.invoice_number, i.total_amount, i.issue_date, i.due_date, c.name as contact_name
       FROM invoices i
       LEFT JOIN contacts c ON i.contact_id = c.id
       WHERE i.organization_id = $1 AND i.status = 'paid'
       ORDER BY i.issue_date DESC`,
      [orgId]
    )

    const purchases = await queryMany<any>(
      `SELECT id, supplier_name, amount_incl_vat, attachment_date
       FROM purchases
       WHERE organization_id = $1
       ORDER BY attachment_date DESC`,
      [orgId]
    )

    const suggestions: { invoices: BankTransactionMatchSuggestion[]; purchases: BankTransactionMatchSuggestion[] }[] = []

    for (const tx of transactions) {
      const amount = Number(tx.amount)
      const date = tx.transaction_date || ''
      const description = tx.description || ''
      const reference = tx.reference || ''

      const invoiceMatches: BankTransactionMatchSuggestion[] = []
      if (amount > 0) {
        for (const inv of paidInvoices) {
          const { score, reason } = scoreInvoiceMatch(amount, date, description, reference, inv)
          if (score >= 20) {
            invoiceMatches.push({
              id: inv.id,
              type: 'invoice',
              score,
              matchReason: reason,
              invoice_number: inv.invoice_number,
              total_amount: Number(inv.total_amount),
              contact_name: inv.contact_name,
              issue_date: inv.issue_date,
            })
          }
        }
        invoiceMatches.sort((a, b) => b.score - a.score)
      }

      const purchaseMatches: BankTransactionMatchSuggestion[] = []
      if (amount < 0) {
        for (const p of purchases) {
          const { score, reason } = scorePurchaseMatch(amount, date, description, p)
          if (score >= 20) {
            purchaseMatches.push({
              id: p.id,
              type: 'purchase',
              score,
              matchReason: reason,
              supplier_name: p.supplier_name,
              total_amount: Number(p.amount_incl_vat),
              attachment_date: p.attachment_date,
            })
          }
        }
        purchaseMatches.sort((a, b) => b.score - a.score)
      }

      suggestions.push({
        invoices: invoiceMatches.slice(0, 10),
        purchases: purchaseMatches.slice(0, 10),
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error in POST /api/bank-transactions/suggest-matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
