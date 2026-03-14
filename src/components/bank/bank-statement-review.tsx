"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle2, AlertTriangle, Info, Download, Link2 } from "lucide-react"
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
import { BankStatementUpload, ParsedBankTransaction, BankTransactionMatchSuggestion } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { getOrganizationInvoices } from "@/lib/queries/invoices"
import { getOrganizationPurchases } from "@/lib/queries/purchases"

interface BankStatementReviewProps {
  upload: BankStatementUpload
  organizationId: number
  onImportComplete?: () => void
}

function txKey(t: ParsedBankTransaction): string {
  return `${t.transaction_date}|${t.amount}|${(t.description || '').slice(0, 50)}`
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

async function fetchSuggestMatches(
  organizationId: number,
  transactions: ParsedBankTransaction[]
): Promise<{ invoices: BankTransactionMatchSuggestion[]; purchases: BankTransactionMatchSuggestion[] }[]> {
  const response = await fetch('/api/bank-transactions/suggest-matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      transactions: transactions.map((t) => ({
        amount: t.amount,
        transaction_date: t.transaction_date,
        description: t.description,
        reference: t.reference,
      })),
    }),
  })
  if (!response.ok) return []
  const data = await response.json()
  return data.suggestions ?? []
}

export function BankStatementReview({ upload, organizationId, onImportComplete }: BankStatementReviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [duplicateMap, setDuplicateMap] = useState<Record<number, { isDuplicate: boolean; matchReason?: string }>>({})
  /** Link selection per transaction (key = txKey). Credits → invoice_id, debits → purchase_id */
  const [linkByKey, setLinkByKey] = useState<Record<string, { invoice_id?: number | null; purchase_id?: number | null }>>({})

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

  const filteredTransactions = showOnlyErrors
    ? upload.transactions.filter(t => t.errors && t.errors.length > 0)
    : upload.transactions

  const { data: suggestMatches = [] } = useQuery({
    queryKey: ['suggest-matches', organizationId, upload.transactions.length],
    queryFn: () => fetchSuggestMatches(organizationId, upload.transactions),
    enabled: upload.transactions.length > 0,
  })

  const { data: allInvoices = [] } = useQuery({
    queryKey: ['invoices', organizationId],
    queryFn: () => getOrganizationInvoices(organizationId),
    enabled: !!organizationId,
  })

  const { data: allPurchases = [] } = useQuery({
    queryKey: ['purchases', organizationId],
    queryFn: () => getOrganizationPurchases(organizationId),
    enabled: !!organizationId,
  })

  const paidInvoices = useMemo(() => allInvoices.filter((inv) => inv.status === 'paid'), [allInvoices])

  const setLink = (key: string, type: 'invoice' | 'purchase', id: number | null) => {
    setLinkByKey(prev => {
      const next = { ...prev }
      if (!next[key]) next[key] = {}
      if (type === 'invoice') next[key].invoice_id = id
      else next[key].purchase_id = id
      return next
    })
  }

  const suggestByKey = useMemo(() => {
    const m: Record<string, { invoices: BankTransactionMatchSuggestion[]; purchases: BankTransactionMatchSuggestion[] }> = {}
    upload.transactions.forEach((t, i) => {
      m[txKey(t)] = suggestMatches[i] || { invoices: [], purchases: [] }
    })
    return m
  }, [upload.transactions, suggestMatches])

  const originalIndexByKey = useMemo(() => {
    const m: Record<string, number> = {}
    upload.transactions.forEach((t, i) => {
      m[txKey(t)] = i
    })
    return m
  }, [upload.transactions])

  const formatCurrency = (amount: number, currency: string = 'DKK') => {
    const sign = amount < 0 ? '-' : ''
    const absolute = Math.abs(amount)
    const [intPart, decPart] = absolute.toFixed(2).split('.')

    // Group thousands with spaces to avoid mixing dots and commas
    const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    const currencyLabel = currency === 'DKK' ? 'kr.' : currency

    return `${sign}${groupedInt}.${decPart} ${currencyLabel}`
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
          transactions: transactionsToImport.map(t => {
            const link = linkByKey[txKey(t)]
            return {
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
              invoice_id: link?.invoice_id ?? null,
              purchase_id: link?.purchase_id ?? null,
            }
          }),
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

      {/* Link to invoice/purchase info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">Avoid double-counting in stats</p>
          <p className="mt-1">
            For credits (income), you can link a transaction to a <strong>paid invoice</strong>. For debits (expenses), link to a <strong>purchase</strong>. 
            Linked transactions are excluded from bank-based totals in financial metrics so the same payment is not counted twice. 
            Matching suggestions are shown by amount and date; pick one or leave as &quot;None&quot;.
          </p>
        </div>
      </div>

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

      {/* Transactions table - min-w-0 so flex parents don't grow and push sidebar */}
      <div className="min-w-0 rounded-lg border dark:border-dark-3">
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
                <TableHead className="text-right min-w-[150px]">Amount</TableHead>
                <TableHead className="text-right min-w-[180px]">Balance</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="min-w-[180px]">
                  <span className="flex items-center gap-1">
                    <Link2 className="h-4 w-4" />
                    Link to
                  </span>
                </TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const key = txKey(transaction)
                  const originalIndex = originalIndexByKey[key] ?? index
                  const isDuplicate = duplicateMap[originalIndex]?.isDuplicate || false
                  const suggestion = suggestByKey[key]
                  const link = linkByKey[key]
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
                    <TableCell className=" text-sm">
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
                      "text-right font-medium ",
                      transaction.amount >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(transaction.amount, transaction.currency || upload.currency)}
                    </TableCell>
                    <TableCell className="text-right  text-sm">
                      {transaction.balance !== undefined 
                        ? formatCurrency(transaction.balance, transaction.currency || upload.currency)
                        : '-'
                      }
                    </TableCell>
                    <TableCell className=" text-sm">
                      {transaction.reference || '-'}
                    </TableCell>
                    <TableCell className="align-top">
                      {!isDuplicate && (
                        <select
                          className="w-full min-w-[200px] rounded border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          value={transaction.amount >= 0 ? (link?.invoice_id ?? '') : (link?.purchase_id ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const id = v === '' ? null : Number(v)
                            setLink(key, transaction.amount >= 0 ? 'invoice' : 'purchase', id)
                          }}
                          title="Link this transaction to an invoice (credit) or purchase (debit) to avoid double-counting in stats"
                        >
                          <option value="">None</option>
                          {transaction.amount >= 0 && (
                            <>
                              {(suggestion?.invoices ?? []).map((inv) => (
                                <option key={`s-${inv.id}`} value={inv.id}>
                                  Inv #{inv.invoice_number} {inv.contact_name ? `(${inv.contact_name})` : ''} — {inv.total_amount.toFixed(2)} (match {inv.score}%)
                                </option>
                              ))}
                              {paidInvoices.filter((inv) => !(suggestion?.invoices ?? []).some((s) => s.id === inv.id)).length > 0 && (
                                <option disabled>—— Other invoices ——</option>
                              )}
                              {paidInvoices
                                .filter((inv) => !(suggestion?.invoices ?? []).some((s) => s.id === inv.id))
                                .map((inv) => (
                                  <option key={inv.id} value={inv.id}>
                                    Inv #{inv.invoice_number} {inv.contact?.name ? `(${inv.contact.name})` : ''} — {Number(inv.total_amount).toFixed(2)}
                                  </option>
                                ))}
                            </>
                          )}
                          {transaction.amount < 0 && (
                            <>
                              {(suggestion?.purchases ?? []).map((p) => (
                                <option key={`s-${p.id}`} value={p.id}>
                                  {p.supplier_name} — {p.total_amount.toFixed(2)} (match {p.score}%)
                                </option>
                              ))}
                              {allPurchases.filter((p) => !(suggestion?.purchases ?? []).some((s) => s.id === p.id)).length > 0 && (
                                <option disabled>—— Other purchases ——</option>
                              )}
                              {allPurchases
                                .filter((p) => !(suggestion?.purchases ?? []).some((s) => s.id === p.id))
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.supplier_name} — {Number(p.amount_incl_vat).toFixed(2)}
                                  </option>
                                ))}
                            </>
                          )}
                        </select>
                      )}
                      {isDuplicate && <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {isDuplicate ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400" title={duplicateMap[originalIndex]?.matchReason || 'Duplicate transaction'}>
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

