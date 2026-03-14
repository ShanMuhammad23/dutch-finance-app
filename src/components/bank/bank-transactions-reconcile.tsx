"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link2, RefreshCw } from "lucide-react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BankTransaction, BankTransactionMatchSuggestion } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getOrganizationInvoices } from "@/lib/queries/invoices"
import { getOrganizationPurchases } from "@/lib/queries/purchases"
import { useMemo } from "react"

const DISPLAY_LIMIT = 50

async function fetchBankTransactions(organizationId: number): Promise<BankTransaction[]> {
  const res = await fetch(`/api/bank-transactions?organizationId=${organizationId}`)
  if (!res.ok) throw new Error("Failed to fetch transactions")
  return res.json()
}

async function fetchSuggestMatches(
  organizationId: number,
  transactions: BankTransaction[]
): Promise<{ invoices: BankTransactionMatchSuggestion[]; purchases: BankTransactionMatchSuggestion[] }[]> {
  const res = await fetch("/api/bank-transactions/suggest-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: organizationId,
      transactions: transactions.slice(0, DISPLAY_LIMIT).map((t) => ({
        amount: t.amount,
        transaction_date: t.transaction_date,
        description: t.description,
        reference: t.reference,
      })),
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.suggestions ?? []
}

async function updateTransactionLink(
  transactionId: number,
  payload: { invoice_id?: number | null; purchase_id?: number | null }
): Promise<BankTransaction> {
  const res = await fetch(`/api/bank-transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Failed to update link")
  }
  return res.json()
}

function formatCurrency(amount: number, currency: string = "DKK") {
  const sign = amount < 0 ? "-" : ""
  const abs = Math.abs(amount)
  const [intPart, decPart] = abs.toFixed(2).split(".")
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${sign}${grouped}.${decPart} ${currency === "DKK" ? "kr." : currency}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

interface BankTransactionsReconcileProps {
  organizationId: number
  refreshKey?: number
}

export function BankTransactionsReconcile({ organizationId, refreshKey = 0 }: BankTransactionsReconcileProps) {
  const queryClient = useQueryClient()
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["bank-transactions", organizationId, refreshKey],
    queryFn: () => fetchBankTransactions(organizationId),
    enabled: !!organizationId,
  })

  const limited = transactions.slice(0, DISPLAY_LIMIT)

  const { data: suggestMatches = [] } = useQuery({
    queryKey: ["bank-suggest-matches", organizationId, limited.length, limited[0]?.id],
    queryFn: () => fetchSuggestMatches(organizationId, limited),
    enabled: limited.length > 0,
  })

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["invoices", organizationId],
    queryFn: () => getOrganizationInvoices(organizationId),
    enabled: !!organizationId,
  })

  const { data: allPurchases = [] } = useQuery({
    queryKey: ["purchases", organizationId],
    queryFn: () => getOrganizationPurchases(organizationId),
    enabled: !!organizationId,
  })

  const paidInvoices = useMemo(() => allInvoices.filter((inv) => inv.status === "paid"), [allInvoices])

  const handleLinkChange = async (
    tx: BankTransaction,
    type: "invoice" | "purchase",
    value: number | null
  ) => {
    if (!tx.id) return
    setUpdatingId(tx.id)
    try {
      await updateTransactionLink(tx.id, {
        invoice_id: type === "invoice" ? value : tx.invoice_id ?? null,
        purchase_id: type === "purchase" ? value : tx.purchase_id ?? null,
      })
      toast.success("Link updated")
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", organizationId] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update link")
    } finally {
      setUpdatingId(null)
    }
  }

  if (transactions.length === 0 && !isLoading) return null

  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-dark dark:text-white">Reconcile transactions</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Link imported transactions to invoices (credits) or purchases (debits) so they are not double-counted in financial stats.
      </p>
      <div className="min-w-0 rounded-lg border dark:border-dark-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="min-w-[200px]">Link to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (
              limited.map((tx, index) => {
                const suggestion = suggestMatches[index]
                const isCredit = (tx.amount as number) >= 0
                const currentValue = isCredit ? tx.invoice_id : tx.purchase_id
                const suggestedOptions = isCredit ? (suggestion?.invoices ?? []) : (suggestion?.purchases ?? [])
                const otherInvoices = paidInvoices.filter((inv) => !suggestedOptions.some((s) => s.id === inv.id))
                const otherPurchases = allPurchases.filter((p) => !suggestedOptions.some((s) => s.id === p.id))
                const isUpdating = updatingId === tx.id

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{formatDate(tx.transaction_date)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {formatCurrency(Number(tx.amount), tx.currency)}
                    </TableCell>
                    <TableCell>
                      <select
                        className={cn(
                          "min-w-[200px] rounded border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-dark-3 dark:bg-dark-2 dark:text-white",
                          isUpdating && "opacity-60"
                        )}
                        value={currentValue ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          handleLinkChange(tx, isCredit ? "invoice" : "purchase", v === "" ? null : Number(v))
                        }}
                        disabled={isUpdating}
                      >
                        <option value="">None</option>
                        {isCredit &&
                          suggestedOptions.map((opt) => (
                            <option key={`s-${opt.id}`} value={opt.id}>
                              Inv #${opt.invoice_number} — ${opt.total_amount.toFixed(2)} (match {opt.score}%)
                            </option>
                          ))}
                        {isCredit && otherInvoices.length > 0 && <option disabled>—— Other invoices ——</option>}
                        {isCredit &&
                          otherInvoices.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              Inv #{inv.invoice_number} {inv.contact?.name ? `(${inv.contact.name})` : ""} — {Number(inv.total_amount).toFixed(2)}
                            </option>
                          ))}
                        {!isCredit &&
                          suggestedOptions.map((opt) => (
                            <option key={`s-${opt.id}`} value={opt.id}>
                              {opt.supplier_name} — {opt.total_amount.toFixed(2)} (match {opt.score}%)
                            </option>
                          ))}
                        {!isCredit && otherPurchases.length > 0 && <option disabled>—— Other purchases ——</option>}
                        {!isCredit &&
                          otherPurchases.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.supplier_name} — {Number(p.amount_incl_vat).toFixed(2)}
                            </option>
                          ))}
                      </select>
                      {tx.invoice && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          → Inv #{tx.invoice.invoice_number}
                        </span>
                      )}
                      {tx.purchase && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          → {tx.purchase.supplier_name}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {transactions.length > DISPLAY_LIMIT && (
        <p className="text-xs text-muted-foreground">
          Showing latest {DISPLAY_LIMIT} of {transactions.length} transactions.
        </p>
      )}
    </Card>
  )
}
