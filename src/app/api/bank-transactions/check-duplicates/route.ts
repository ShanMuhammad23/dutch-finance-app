import { NextRequest, NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'
import { ParsedBankTransaction } from '@/lib/types'
import { isDuplicateTransaction } from '@/lib/bank-duplicate-check'

/**
 * POST /api/bank-transactions/check-duplicates
 * Check which transactions are duplicates before importing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, transactions } = body

    if (!organization_id || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Organization ID and transactions array are required' },
        { status: 400 }
      )
    }

    const parsedOrgId = Number(organization_id)
    if (Number.isNaN(parsedOrgId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID' },
        { status: 400 }
      )
    }

    // Fetch existing transactions for this organization
    const existingTransactions = await queryMany<any>(
      `SELECT 
        transaction_date,
        amount,
        description,
        reference,
        account_number
      FROM bank_transactions
      WHERE organization_id = $1`,
      [parsedOrgId]
    )

    // Check each transaction for duplicates
    const duplicateResults = transactions.map((transaction: ParsedBankTransaction, index: number) => {
      const check = isDuplicateTransaction(transaction, existingTransactions)
      return {
        index,
        transaction,
        ...check,
      }
    })

    const duplicates = duplicateResults.filter(r => r.isDuplicate)
    const unique = duplicateResults.filter(r => !r.isDuplicate)

    return NextResponse.json({
      total: transactions.length,
      duplicates: duplicates.length,
      unique: unique.length,
      results: duplicateResults,
    })
  } catch (error) {
    console.error('Error in POST /api/bank-transactions/check-duplicates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

