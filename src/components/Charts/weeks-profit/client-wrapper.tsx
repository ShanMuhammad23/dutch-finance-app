"use client"

import { useActiveOrganization } from "@/context/organization-context"
import { useQuery } from "@tanstack/react-query"
import { WeeksProfitChart } from "./chart"
import { PeriodPicker } from "@/components/period-picker"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { standardFormat } from "@/lib/format-number"

type PropsType = {
  timeFrame?: string
  className?: string
}

async function fetchProfitData(organizationId: number, period: string = 'month') {
  const response = await fetch(`/api/financial-metrics?organizationId=${organizationId}&period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch profit data')
  }
  
  return response.json()
}

export function WeeksProfit({ className, timeFrame = "this week" }: PropsType) {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()
  
  const { data, isLoading } = useQuery({
    queryKey: ['profit-data', organizationIdAsNumber, timeFrame],
    queryFn: () => fetchProfitData(organizationIdAsNumber!),
    enabled: isReady && !!organizationIdAsNumber,
    staleTime: 1000 * 60 * 5,
  })

  if (!isReady || !organizationIdAsNumber) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <p className="text-muted-foreground">Please select an organization to view profit data.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <Skeleton className="h-[310px] w-full" />
      </div>
    )
  }

  if (!data || !data.timeSeries || data.timeSeries.length === 0) {
    return (
      <div className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
            Profit Trend
          </h2>
          <PeriodPicker
            items={["this month", "this year"]}
            defaultValue={timeFrame === "this week" ? "this month" : timeFrame}
            sectionKey="weeks_profit"
          />
        </div>
        <div className="flex h-[310px] items-center justify-center text-muted-foreground">
          No profit data available
        </div>
      </div>
    )
  }

  // Transform data for chart - show profit trend
  const chartData = {
    profit: data.timeSeries.map((item: any) => ({
      x: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      y: item.profit,
    })),
  }

  const totalProfit = data.timeSeries.reduce((sum: number, item: any) => sum + item.profit, 0)

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Profit Trend
        </h2>

        <PeriodPicker
          items={["this month", "this year"]}
          defaultValue={timeFrame === "this week" ? "this month" : timeFrame}
          sectionKey="weeks_profit"
        />
      </div>

      <WeeksProfitChart data={chartData} />

      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-dark-6 dark:text-dark-4">Total Profit</p>
        <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {standardFormat(totalProfit)} DKK
        </p>
      </div>
    </div>
  )
}

