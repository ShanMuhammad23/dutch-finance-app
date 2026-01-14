"use client"

import { useActiveOrganization } from "@/context/organization-context"
import { useQuery } from "@tanstack/react-query"
import { OverviewCard } from "./card"
import * as icons from "./icons"
import { Skeleton } from "@/components/ui/skeleton"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

async function fetchFinancialMetrics(organizationId: number) {
  // Fetch all-time data by default (no period filter)
  const response = await fetch(`/api/financial-metrics?organizationId=${organizationId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch financial metrics')
  }
  
  return response.json()
}

export function OverviewCardsClientWrapper() {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()

  const { data, isLoading } = useQuery({
    queryKey: ['overview-metrics', organizationIdAsNumber],
    queryFn: () => fetchFinancialMetrics(organizationIdAsNumber!),
    enabled: isReady && !!organizationIdAsNumber,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (!isReady || !organizationIdAsNumber) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const summary = data?.summary || {
    income: 0,
    expenses: 0,
    profit: 0,
    incomeGrowth: 0,
    expensesGrowth: 0,
    profitGrowth: 0,
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:gap-7.5">
      <OverviewCard
        label="Total Income"
        data={{
          value: formatCurrency(summary.income),
          growthRate: summary.incomeGrowth || 0,
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Total Expenses"
        data={{
          value: formatCurrency(summary.expenses),
          growthRate: summary.expensesGrowth || 0,
        }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Net Profit"
        data={{
          value: formatCurrency(summary.profit),
          growthRate: summary.profitGrowth || 0,
        }}
        Icon={icons.Product}
      />
    </div>
  )
}

