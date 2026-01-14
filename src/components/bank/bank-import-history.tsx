"use client"

import { useQuery } from '@tanstack/react-query'
import { History, FileText, CheckCircle2, AlertTriangle, Calendar } from "lucide-react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui-elements/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveOrganization } from "@/context/organization-context"
import dayjs from "dayjs"

interface ImportHistoryItem {
  id: number
  filename: string
  uploaded_at: string
  transaction_count: number
  total_credits: number
  total_debits: number
  currency: string
  date_range_start: string
  date_range_end: string
}

async function fetchImportHistory(organizationId: number): Promise<ImportHistoryItem[]> {
  const response = await fetch(`/api/bank-transactions/import-history?organizationId=${organizationId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch import history')
  }
  
  return response.json()
}

interface BankImportHistoryProps {
  refreshKey?: number
}

export function BankImportHistory({ refreshKey }: BankImportHistoryProps) {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()

  const { data: history = [], isLoading, refetch } = useQuery<ImportHistoryItem[]>({
    queryKey: ['bank-import-history', organizationIdAsNumber, refreshKey],
    queryFn: () => fetchImportHistory(organizationIdAsNumber!),
    enabled: isReady && !!organizationIdAsNumber,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const formatCurrency = (amount: number, currency: string = 'DKK') => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD.MM.YYYY HH:mm')
  }

  if (!isReady || !organizationIdAsNumber) {
    return null
  }

  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <History className="size-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-dark dark:text-white">
                Recent imports
              </p>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                View your recent bank statement imports and their details
              </p>
            </div>
            <Button
              label="Refresh"
              variant="outlineDark"
              size="small"
              onClick={() => refetch()}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4 dark:border-dark-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-4 bg-gray-2 p-8 text-center dark:border-dark-3 dark:bg-dark-2">
          <FileText className="mx-auto mb-3 size-10 text-gray-400 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-4">
            No imports yet
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-5">
            Upload your first bank statement to see import history here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-6" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-dark dark:text-white">
                      {item.filename}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(item.uploaded_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {item.transaction_count} transaction{item.transaction_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-4">Period:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {dayjs(item.date_range_start).format('DD.MM.YYYY')} - {dayjs(item.date_range_end).format('DD.MM.YYYY')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t dark:border-dark-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-4">Credits</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(item.total_credits, item.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-4">Debits</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(item.total_debits, item.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-4">Net</p>
                    <p className={item.total_credits - item.total_debits >= 0 
                      ? "text-sm font-semibold text-green-600 dark:text-green-400"
                      : "text-sm font-semibold text-red-600 dark:text-red-400"
                    }>
                      {formatCurrency(item.total_credits - item.total_debits, item.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

