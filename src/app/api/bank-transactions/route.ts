import { NextRequest, NextResponse } from 'next/server'
import { queryMany, queryOne } from '@/lib/db'
import { BankTransaction } from '@/lib/types'
import { auth } from '../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

/**
 * GET /api/bank-transactions
 * Get bank transactions for an organization
 */
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

    const parsedId = Number(organizationId)

    if (Number.isNaN(parsedId)) {
      return NextResponse.json(
        { error: 'Organization ID must be a valid number' },
        { status: 400 }
      )
    }

    const data = await queryMany<any>(
      `SELECT * FROM bank_transactions 
       WHERE organization_id = $1 
       ORDER BY transaction_date DESC, created_at DESC`,
      [parsedId]
    )

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'purchase',
        {
          organization_id: parsedId,
          description: `Viewed bank transactions list`,
          details: { organization_id: parsedId, count: data.length },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/bank-transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bank-transactions
 * Import bank transactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, transactions, filename } = body

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

    // Check for existing transactions to prevent duplicates
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

    // Insert transactions (skip duplicates)
    const insertedTransactions: any[] = []
    const skippedDuplicates: string[] = []
    const errors: string[] = []

    for (const transaction of transactions) {
      try {
        // Validate required fields
        if (!transaction.transaction_date || !transaction.description) {
          errors.push(`Transaction missing required fields: ${transaction.description || 'Unknown'}`)
          continue
        }

        // Check for duplicate
        const isDuplicate = existingTransactions.some((existing: any) => {
          // Exact match: date + amount + description
          if (
            existing.transaction_date === transaction.transaction_date &&
            Math.abs(existing.amount - transaction.amount) < 0.01 &&
            existing.description.toLowerCase().trim() === transaction.description.toLowerCase().trim()
          ) {
            // If reference exists, also check it
            if (transaction.reference && existing.reference) {
              return existing.reference === transaction.reference
            }
            // Check account number if available
            if (transaction.account_number && existing.account_number) {
              return existing.account_number === transaction.account_number
            }
            // Match without reference/account - consider duplicate
            return true
          }
          
          // Check by reference number if available (strong indicator)
          if (transaction.reference && existing.reference) {
            return (
              existing.reference === transaction.reference &&
              existing.transaction_date === transaction.transaction_date &&
              Math.abs(existing.amount - transaction.amount) < 0.01
            )
          }
          
          return false
        })

        if (isDuplicate) {
          skippedDuplicates.push(
            `${transaction.description} (${transaction.transaction_date}, ${transaction.amount})`
          )
          continue
        }

        const result = await queryOne<any>(
          `INSERT INTO bank_transactions (
            organization_id,
            transaction_date,
            value_date,
            description,
            amount,
            balance,
            reference,
            counterparty,
            account_number,
            currency,
            transaction_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            parsedOrgId,
            transaction.transaction_date,
            transaction.value_date || null,
            transaction.description,
            transaction.amount,
            transaction.balance || null,
            transaction.reference || null,
            transaction.counterparty || null,
            transaction.account_number || null,
            transaction.currency || 'DKK',
            transaction.transaction_type || (transaction.amount >= 0 ? 'credit' : 'debit'),
          ]
        )

        if (result) {
          insertedTransactions.push(result)
          // Add to existing transactions to prevent duplicates within the same batch
          existingTransactions.push({
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            description: transaction.description,
            reference: transaction.reference,
            account_number: transaction.account_number,
          })
        }
      } catch (error: any) {
        console.error('Error inserting transaction:', error)
        // Check if it's a unique constraint violation
        if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
          skippedDuplicates.push(
            `${transaction.description || 'Unknown'} (${transaction.transaction_date || 'N/A'})`
          )
        } else {
          errors.push(`Failed to insert transaction: ${transaction.description || 'Unknown'}`)
        }
      }
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'IMPORT',
        'purchase',
        {
          organization_id: parsedOrgId,
          description: `Imported ${insertedTransactions.length} bank transactions${filename ? ` from ${filename}` : ''}`,
          details: {
            organization_id: parsedOrgId,
            inserted: insertedTransactions.length,
            skipped: skippedDuplicates.length,
            total: transactions.length,
            filename: filename || null,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        inserted: insertedTransactions.length,
        skipped: skippedDuplicates.length,
        total: transactions.length,
        transactions: insertedTransactions,
        skippedDuplicates: skippedDuplicates.length > 0 ? skippedDuplicates : undefined,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/bank-transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

