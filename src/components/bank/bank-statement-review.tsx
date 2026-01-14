"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertTriangle, Info, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BankStatementUpload, ParsedBankTransaction } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

interface BankStatementReviewProps {
  upload: BankStatementUpload
  organizationId: number
  onImportComplete?: () => void
}

async function checkDuplicates(
  organizationId: number,
  transactions: ParsedBankTransaction[]
): Promise<Record<number, { isDuplicate: boolean; matchReason?: string }>> {
  const response = await fetch('/api/bank-transactions/check-duplicates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      transactions,
    }),
  })

  if (!response.ok) {
    return {}
  }

  const data = await response.json()
  const result: Record<number, { isDuplicate: boolean; matchReason?: string }> = {}
  
  data.results?.forEach((r: any) => {
    result[r.index] = {
      isDuplicate: r.isDuplicate,
      matchReason: r.matchReason,
    }
  })

  return result
}

export function BankStatementReview({ upload, organizationId, onImportComplete }: BankStatementReviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [duplicateMap, setDuplicateMap] = useState<Record<number, { isDuplicate: boolean; matchReason?: string }>>({})

  // Check for duplicates when component mounts or transactions change
  const { data: duplicateCheck } = useQuery({
    queryKey: ['check-duplicates', organizationId, upload.transactions.length],
    queryFn: () => checkDuplicates(organizationId, upload.transactions),
    enabled: upload.transactions.length > 0,
  })

  useEffect(() => {
    if (duplicateCheck) {
      setDuplicateMap(duplicateCheck)
      
      // Auto-deselect duplicates
      const duplicateIndices = Object.keys(duplicateCheck)
        .map(Number)
        .filter(idx => duplicateCheck[idx]?.isDuplicate)
      
      if (duplicateIndices.length > 0) {
        setSelectedRows(prev => {
          const newSet = new Set(prev)
          duplicateIndices.forEach(idx => newSet.delete(idx))
          return newSet
        })
      }
    }
  }, [duplicateCheck])

  const formatCurrency = (amount: number, currency: string = 'DKK') => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredTransactions.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredTransactions.map((_, i) => i)))
    }
  }

  const filteredTransactions = showOnlyErrors
    ? upload.transactions.filter(t => t.errors && t.errors.length > 0)
    : upload.transactions

  const transactionsWithErrors = upload.transactions.filter(t => t.errors && t.errors.length > 0)
  const transactionsWithWarnings = upload.transactions.filter(t => t.warnings && t.warnings.length > 0)
  const duplicateCount = Object.values(duplicateMap).filter(d => d.isDuplicate).length

  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleImport = async () => {
    if (selectedRows.size === 0) return

    setIsImporting(true)
    setImportResult(null)

    try {
      // Filter out duplicates from selected transactions
      const transactionsToImport = Array.from(selectedRows)
        .map(i => filteredTransactions[i])
        .filter((_, idx) => {
          const originalIndex = Array.from(selectedRows)[idx]
          return !duplicateMap[originalIndex]?.isDuplicate
        })
      
      if (transactionsToImport.length === 0) {
        throw new Error('All selected transactions are duplicates. Please select unique transactions to import.')
      }
      
      const response = await fetch('/api/bank-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          filename: upload.filename,
          transactions: transactionsToImport.map(t => ({
            transaction_date: t.transaction_date,
            value_date: t.value_date,
            description: t.description,
            amount: t.amount,
            balance: t.balance,
            reference: t.reference,
            counterparty: t.counterparty,
            account_number: t.account_number || upload.account_number,
            currency: t.currency || upload.currency,
            transaction_type: t.transaction_type,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import transactions')
      }

      const result = await response.json()
      
      let message = `Successfully imported ${result.inserted} transaction${result.inserted !== 1 ? 's' : ''}.`
      if (result.skipped && result.skipped > 0) {
        message += ` ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped.`
      }
      
      setImportResult({
        success: true,
        message,
      })

      toast.success(`Imported ${result.inserted} transaction${result.inserted !== 1 ? 's' : ''} successfully`)
      
      if (result.skipped && result.skipped > 0) {
        toast.info(`${result.skipped} duplicate transaction${result.skipped !== 1 ? 's' : ''} skipped`)
      }
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} transaction${result.errors.length !== 1 ? 's' : ''} failed to import`)
      }

      // Clear selection after successful import
      setSelectedRows(new Set())
      
      // Notify parent component to refresh history
      onImportComplete?.()
      
      // Refresh after a short delay to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import transactions'
      setImportResult({
        success: false,
        message: errorMessage,
      })
      toast.error(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {upload.transactions.length}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-sm text-muted-foreground">Total Credits</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(upload.total_credits, upload.currency)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-sm text-muted-foreground">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(upload.total_debits, upload.currency)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-sm text-muted-foreground">Net Amount</p>
          <p className={cn(
            "text-2xl font-bold",
            upload.total_credits - upload.total_debits >= 0 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(upload.total_credits - upload.total_debits, upload.currency)}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(transactionsWithErrors.length > 0 || transactionsWithWarnings.length > 0 || duplicateCount > 0) && (
        <div className="space-y-2">
          {duplicateCount > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  {duplicateCount} duplicate transaction{duplicateCount !== 1 ? 's' : ''} detected
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                  These transactions already exist in your database and will be skipped during import. They have been automatically deselected.
                </p>
              </div>
            </div>
          )}
          {transactionsWithErrors.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-100">
                  {transactionsWithErrors.length} transaction{transactionsWithErrors.length !== 1 ? 's' : ''} with errors
                </p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  Please review and fix errors before importing.
                </p>
              </div>
            </div>
          )}
          {transactionsWithWarnings.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {transactionsWithWarnings.length} transaction{transactionsWithWarnings.length !== 1 ? 's' : ''} with warnings
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  These transactions may need attention but can still be imported.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date range and account info */}
      <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4 dark:border-dark-3 dark:bg-dark-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Statement Period
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(upload.date_range.start)} - {formatDate(upload.date_range.end)}
          </p>
        </div>
        {upload.account_number && (
          <div className="space-y-1 text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Account Number
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {upload.account_number}
            </p>
          </div>
        )}
      </div>

      {/* Filters and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyErrors}
              onChange={(e) => setShowOnlyErrors(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Show only errors
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
          >
            {selectedRows.size === filteredTransactions.length ? 'Deselect all' : 'Select all'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Export selected transactions
              const data = Array.from(selectedRows).map(i => filteredTransactions[i])
              console.log('Export:', data)
            }}
            disabled={selectedRows.size === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export selected
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="rounded-lg border dark:border-dark-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const isDuplicate = duplicateMap[index]?.isDuplicate || false
                  return (
                  <TableRow
                    key={index}
                    className={cn(
                      selectedRows.has(index) && "bg-primary/5 dark:bg-primary/10",
                      transaction.errors && transaction.errors.length > 0 && "bg-red-50/50 dark:bg-red-500/5",
                      isDuplicate && "bg-orange-50/50 dark:bg-orange-500/5 opacity-60"
                    )}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleRowSelection(index)}
                        disabled={isDuplicate}
                        className="rounded border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isDuplicate ? 'Duplicate transaction - already exists in database' : ''}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {transaction.counterparty ? (
                        <div className="truncate" title={transaction.counterparty}>
                          {transaction.counterparty}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium font-mono",
                      transaction.amount >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(transaction.amount, transaction.currency || upload.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {transaction.balance !== undefined 
                        ? formatCurrency(transaction.balance, transaction.currency || upload.currency)
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference || '-'}
                    </TableCell>
                    <TableCell>
                      {isDuplicate ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400" title={duplicateMap[index]?.matchReason || 'Duplicate transaction'}>
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">Duplicate</span>
                        </div>
                      ) : transaction.errors && transaction.errors.length > 0 ? (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title={transaction.errors.join(', ')}>
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">Error</span>
                        </div>
                      ) : transaction.warnings && transaction.warnings.length > 0 ? (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title={transaction.warnings.join(', ')}>
                          <Info className="h-4 w-4" />
                          <span className="text-xs">Warning</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">OK</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Import result message */}
      {importResult && (
        <div className={cn(
          "rounded-lg border p-4",
          importResult.success 
            ? "border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
            : "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
        )}>
          <div className="flex items-center gap-2">
            {importResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p className={cn(
              "text-sm font-medium",
              importResult.success 
                ? "text-green-900 dark:text-green-100"
                : "text-red-900 dark:text-red-100"
            )}>
              {importResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Import button */}
      <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4 dark:border-dark-3 dark:bg-dark-2">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {selectedRows.size} of {filteredTransactions.length} transaction{selectedRows.size !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Review the transactions above before importing to the database
          </p>
        </div>
        <Button
          onClick={handleImport}
          disabled={selectedRows.size === 0 || isImporting}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Importing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Import {selectedRows.size > 0 ? `${selectedRows.size} ` : ''}Transaction{selectedRows.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

