import { NextRequest, NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'

/**
 * GET /api/bank-transactions/import-history
 * Get import history grouped by upload sessions
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

    // Group transactions by upload session
    // Group by date (day) and account_number to identify import batches
    // Transactions imported at the same time will have the same created_at date
    const data = await queryMany<any>(
      `SELECT 
        DATE(created_at) as upload_date,
        account_number,
        currency,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits,
        MIN(transaction_date) as date_range_start,
        MAX(transaction_date) as date_range_end,
        MAX(created_at) as uploaded_at
      FROM bank_transactions
      WHERE organization_id = $1
      GROUP BY DATE(created_at), account_number, currency
      ORDER BY MAX(created_at) DESC
      LIMIT 20`,
      [parsedId]
    )

    // Transform to include a filename-like identifier
    const history = data.map((item: any, index: number) => {
      const uploadDate = new Date(item.uploaded_at)
      const dateStr = uploadDate.toLocaleDateString('da-DK', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      })
      
      return {
        id: index + 1,
        filename: item.account_number 
          ? `Bank Statement - ${item.account_number} (${dateStr})`
          : `Bank Statement Import - ${dateStr}`,
        uploaded_at: item.uploaded_at,
        transaction_count: parseInt(item.transaction_count, 10),
        total_credits: parseFloat(item.total_credits || 0),
        total_debits: parseFloat(item.total_debits || 0),
        currency: item.currency || 'DKK',
        date_range_start: item.date_range_start,
        date_range_end: item.date_range_end,
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error in GET /api/bank-transactions/import-history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

