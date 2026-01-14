import { NextRequest, NextResponse } from 'next/server'
import { queryMany, queryOne } from '@/lib/db'
import { auth } from '../auth/[...nextauth]/route'
import { logActivityFromRequest } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const period = searchParams.get('period') || null // null means show all data
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const parsedOrgId = Number(organizationId)
    if (Number.isNaN(parsedOrgId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID' },
        { status: 400 }
      )
    }

    // Calculate date range based on period
    let dateFilter = ''
    let dateParams: any[] = [parsedOrgId]

    if (startDate && endDate) {
      dateFilter = `AND transaction_date >= $2 AND transaction_date <= $3`
      dateParams.push(startDate, endDate)
    } else if (period === 'month') {
      dateFilter = `AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)`
    } else if (period === 'year') {
      dateFilter = `AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)`
    }
    let invoiceDateFilter = ''
    if (startDate && endDate) {
      invoiceDateFilter = `AND issue_date >= $2 AND issue_date <= $3`
    } else if (period === 'month') {
      invoiceDateFilter = `AND issue_date >= DATE_TRUNC('month', CURRENT_DATE)`
    } else if (period === 'year') {
      invoiceDateFilter = `AND issue_date >= DATE_TRUNC('year', CURRENT_DATE)`
    }
    let purchaseDateFilter = ''
    if (startDate && endDate) {
      purchaseDateFilter = `AND attachment_date >= $2 AND attachment_date <= $3`
    } else if (period === 'month') {
      purchaseDateFilter = `AND attachment_date >= DATE_TRUNC('month', CURRENT_DATE)`
    } else if (period === 'year') {
      purchaseDateFilter = `AND attachment_date >= DATE_TRUNC('year', CURRENT_DATE)`
    }
    // If period is 'all' or not specified and no dates, don't filter by date (show all data)

    // Calculate INCOME from invoices (paid invoices only)
    const incomeData = await queryOne<any>(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_income,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE organization_id = $1
        AND status = 'paid'
        ${invoiceDateFilter}`,
      dateParams
    )

    // Calculate EXPENSES from bank transactions (negative amounts = debits)
    const bankExpensesData = await queryOne<any>(
      `SELECT 
        COALESCE(SUM(ABS(amount)), 0) as total_expenses,
        COUNT(*) as transaction_count
      FROM bank_transactions
      WHERE organization_id = $1
        AND amount < 0
        ${dateFilter}`,
      dateParams
    )

    // Calculate EXPENSES from purchases
    const purchasesExpensesData = await queryOne<any>(
      `SELECT 
        COALESCE(SUM(amount_incl_vat), 0) as total_expenses,
        COUNT(*) as purchase_count
      FROM purchases
      WHERE organization_id = $1
        ${purchaseDateFilter}`,
      dateParams
    )

    // Calculate INCOME from bank transactions (positive amounts = credits)
    const bankIncomeData = await queryOne<any>(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(*) as transaction_count
      FROM bank_transactions
      WHERE organization_id = $1
        AND amount > 0
        ${dateFilter}`,
      dateParams
    )

    // Get time series data for charts (monthly breakdown)
    const timeSeriesData = await queryMany<any>(
      `SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
      FROM bank_transactions
      WHERE organization_id = $1
        ${dateFilter}
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC
      LIMIT 12`,
      dateParams
    )

    // Get invoice income by month
    const invoiceTimeSeries = await queryMany<any>(
      `SELECT 
        DATE_TRUNC('month', issue_date) as month,
        COALESCE(SUM(total_amount), 0) as income
      FROM invoices
      WHERE organization_id = $1
        AND status = 'paid'
        ${invoiceDateFilter}
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY month DESC
      LIMIT 12`,
      dateParams
    )

    // Get purchases expenses by month
    const purchasesTimeSeries = await queryMany<any>(
      `SELECT 
        DATE_TRUNC('month', attachment_date) as month,
        COALESCE(SUM(amount_incl_vat), 0) as expenses
      FROM purchases
      WHERE organization_id = $1
        ${purchaseDateFilter}
      GROUP BY DATE_TRUNC('month', attachment_date)
      ORDER BY month DESC
      LIMIT 12`,
      dateParams
    )

    // Combine invoice income with bank income
    const combinedIncome = parseFloat(incomeData?.total_income || 0) + parseFloat(bankIncomeData?.total_income || 0)
    // Combine bank expenses with purchases expenses
    const totalExpenses = parseFloat(bankExpensesData?.total_expenses || 0) + parseFloat(purchasesExpensesData?.total_expenses || 0)
    const profit = combinedIncome - totalExpenses

    // Merge time series data
    // Get all unique months from all sources
    const allMonths = new Set<string>()
    timeSeriesData.forEach((row: any) => allMonths.add(row.month))
    invoiceTimeSeries.forEach((row: any) => allMonths.add(row.month))
    purchasesTimeSeries.forEach((row: any) => allMonths.add(row.month))

    const monthlyData = Array.from(allMonths)
      .map((month: string) => {
        const bankMonth = timeSeriesData.find((row: any) => row.month === month)
        const invoiceMonth = invoiceTimeSeries.find((inv: any) => inv.month === month)
        const purchaseMonth = purchasesTimeSeries.find((p: any) => p.month === month)
        
        const income = parseFloat(bankMonth?.income || 0) + parseFloat(invoiceMonth?.income || 0)
        const expenses = parseFloat(bankMonth?.expenses || 0) + parseFloat(purchaseMonth?.expenses || 0)
        
        return {
          month,
          income,
          expenses,
          profit: income - expenses,
        }
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Calculate growth rates (compare with previous period)
    let incomeGrowth = 0
    let expensesGrowth = 0
    let profitGrowth = 0

    if (period === 'month') {
      const previousMonthIncome = await queryOne<any>(
        `SELECT COALESCE(SUM(total_amount), 0) as total
         FROM invoices
         WHERE organization_id = $1
           AND status = 'paid'
           AND issue_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND issue_date < DATE_TRUNC('month', CURRENT_DATE)`,
        [parsedOrgId]
      )

      const previousMonthBankIncome = await queryOne<any>(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM bank_transactions
         WHERE organization_id = $1
           AND amount > 0
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND transaction_date < DATE_TRUNC('month', CURRENT_DATE)`,
        [parsedOrgId]
      )

      const previousMonthBankExpenses = await queryOne<any>(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as total
         FROM bank_transactions
         WHERE organization_id = $1
           AND amount < 0
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND transaction_date < DATE_TRUNC('month', CURRENT_DATE)`,
        [parsedOrgId]
      )

      const previousMonthPurchasesExpenses = await queryOne<any>(
        `SELECT COALESCE(SUM(amount_incl_vat), 0) as total
         FROM purchases
         WHERE organization_id = $1
           AND attachment_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND attachment_date < DATE_TRUNC('month', CURRENT_DATE)`,
        [parsedOrgId]
      )

      const prevIncome = parseFloat(previousMonthIncome?.total || 0) + parseFloat(previousMonthBankIncome?.total || 0)
      const prevExpenses = parseFloat(previousMonthBankExpenses?.total || 0) + parseFloat(previousMonthPurchasesExpenses?.total || 0)
      const prevProfit = prevIncome - prevExpenses

      if (prevIncome > 0) {
        incomeGrowth = ((combinedIncome - prevIncome) / prevIncome) * 100
      }
      if (prevExpenses > 0) {
        expensesGrowth = ((totalExpenses - prevExpenses) / prevExpenses) * 100
      }
      if (prevProfit !== 0) {
        profitGrowth = ((profit - prevProfit) / Math.abs(prevProfit)) * 100
      }
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'organization',
        {
          organization_id: parsedOrgId,
          description: `Viewed financial metrics for period: ${period}`,
          details: {
            organization_id: parsedOrgId,
            period,
            income: combinedIncome,
            expenses: totalExpenses,
            profit: profit,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json({
      summary: {
        income: combinedIncome,
        expenses: totalExpenses,
        profit: profit,
        incomeGrowth: incomeGrowth,
        expensesGrowth: expensesGrowth,
        profitGrowth: profitGrowth,
      },
      timeSeries: monthlyData.reverse(), // Reverse to show oldest first
      period: period || 'all',
    })
  } catch (error) {
    console.error('Error in GET /api/financial-metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

