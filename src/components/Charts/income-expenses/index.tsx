"use client"

import { PeriodPicker } from "@/components/period-picker"
import { standardFormat } from "@/lib/format-number"
import { cn } from "@/lib/utils"
import { useActiveOrganization } from "@/context/organization-context"
import { useQuery } from "@tanstack/react-query"
import { IncomeExpensesChart as Chart } from "./chart"
import { Skeleton } from "@/components/ui/skeleton"

type PropsType = {
  timeFrame?: string
  className?: string
}

async function fetchFinancialMetrics(organizationId: number, period: string = 'month') {
  const response = await fetch(`/api/financial-metrics?organizationId=${organizationId}&period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch financial metrics')
  }
  
  return response.json()
}

export function IncomeExpensesChart({ className, timeFrame = "monthly" }: PropsType) {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()
  
  const period = timeFrame === 'yearly' ? 'year' : 'month'
  
  const { data, isLoading } = useQuery({
    queryKey: ['financial-metrics', organizationIdAsNumber, period],
    queryFn: () => fetchFinancialMetrics(organizationIdAsNumber!, period),
    enabled: isReady && !!organizationIdAsNumber,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (!isReady || !organizationIdAsNumber) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <p className="text-muted-foreground">Please select an organization to view financial data.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <Skeleton className="h-[310px] w-full" />
      </div>
    )
  }

  if (!data || !data.timeSeries || data.timeSeries.length === 0) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
            Income vs Expenses
          </h2>
          <PeriodPicker defaultValue={timeFrame} sectionKey="income_expenses" />
        </div>
        <div className="flex h-[310px] items-center justify-center text-muted-foreground">
          No financial data available
        </div>
      </div>
    )
  }

  // Transform data for chart
  const chartData = {
    income: data.timeSeries.map((item: any) => ({
      x: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      y: item.income,
    })),
    expenses: data.timeSeries.map((item: any) => ({
      x: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      y: item.expenses,
    })),
  }

  const totalIncome = data.timeSeries.reduce((sum: number, item: any) => sum + item.income, 0)
  const totalExpenses = data.timeSeries.reduce((sum: number, item: any) => sum + item.expenses, 0)

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Income vs Expenses
        </h2>

        <PeriodPicker defaultValue={timeFrame} sectionKey="income_expenses" />
      </div>

      <Chart data={chartData} />

      <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:grid-cols-2 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">
        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-xl font-bold text-green-600 dark:text-green-400">
            {standardFormat(totalIncome)} DKK
          </dt>
          <dd className="font-medium dark:text-dark-6">Total Income</dd>
        </div>

        <div>
          <dt className="text-xl font-bold text-red-600 dark:text-red-400">
            {standardFormat(totalExpenses)} DKK
          </dt>
          <dd className="font-medium dark:text-dark-6">Total Expenses</dd>
        </div>
      </dl>
    </div>
  )
}

