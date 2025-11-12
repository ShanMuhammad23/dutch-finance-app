"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InvoiceItem } from "@/lib/types"
import { calculateInvoiceTotals } from "@/lib/invoice-utils"
import { DatePicker } from "./date-picker"

interface InvoiceSummaryProps {
  items: InvoiceItem[]
  paymentTerms: string
  onPaymentTermsChange: (terms: string) => void
  dueDate: string
  onDueDateChange: (date: string) => void
  bankRegNo: string
  onBankRegNoChange: (regNo: string) => void
  bankAccountNo: string
  onBankAccountNoChange: (accountNo: string) => void
  interestRate: number
  onInterestRateChange: (rate: number) => void
  lateFee: number
  onLateFeeChange: (fee: number) => void
  invoiceNumber: number
  currency?: string
}

export function InvoiceSummary({
  items,
  paymentTerms,
  onPaymentTermsChange,
  dueDate,
  onDueDateChange,
  bankRegNo,
  onBankRegNoChange,
  bankAccountNo,
  onBankAccountNoChange,
  interestRate,
  onInterestRateChange,
  lateFee,
  onLateFeeChange,
  invoiceNumber,
  currency = 'DKK',
}: InvoiceSummaryProps) {
  const [showComments, setShowComments] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(true)

  const totals = calculateInvoiceTotals(items.filter((item) => !item.isHeadline))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-dark-6">
      {/* Subtotal and Total */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-slate-700 dark:text-dark-7">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900 dark:text-dark-8">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-semibold text-slate-900 dark:border-dark-3 dark:text-dark-8">
            <span>Total {currency}</span>
            <span>{formatCurrency(totals.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Payment terms</Label>
          <Input
            value={paymentTerms}
            onChange={(e) => onPaymentTermsChange(e.target.value)}
            placeholder="Net 8 days"
          />
        </div>

        <DatePicker label="Due date" value={dueDate} onChange={onDueDateChange} />

        {dueDate && (
          <p className="text-sm text-muted-foreground dark:text-dark-6">
            Payment terms: {paymentTerms} - Due date: {formatDate(dueDate)}
          </p>
        )}
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-900 dark:text-dark-8">Bank Account Details</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowBankDetails(!showBankDetails)}
          >
            {showBankDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showBankDetails && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4 dark:border-dark-3 dark:bg-dark-3/40">
            <p className="text-sm text-muted-foreground dark:text-dark-6">
              The amount is paid into the bank account:
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-slate-700 dark:text-dark-7">
                <Label>Bank / Reg. no.</Label>
                <Input
                  value={bankRegNo}
                  onChange={(e) => onBankRegNoChange(e.target.value)}
                  placeholder="---"
                />
              </div>
              <div className="space-y-2 text-slate-700 dark:text-dark-7">
                <Label>Account no.</Label>
                <Input
                  value={bankAccountNo}
                  onChange={(e) => onBankAccountNoChange(e.target.value)}
                  placeholder="---"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground dark:text-dark-6">
              Invoice no. {invoiceNumber} must be stated when making a bank transfer.
            </p>

            <div className="space-y-4 border-t pt-4 dark:border-dark-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-slate-700 dark:text-dark-7">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => onInterestRateChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.81"
                  />
                </div>
                <div className="space-y-2 text-slate-700 dark:text-dark-7">
                  <Label>Late Fee ({currency})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lateFee}
                    onChange={(e) => onLateFeeChange(parseFloat(e.target.value) || 0)}
                    placeholder="100.00"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground dark:text-dark-6">
                If payment is made after the due date, interest of {interestRate}% will be charged per month commenced, 
                as well as a fee of {formatCurrency(lateFee)}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Comments Toggle */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground dark:text-dark-6 dark:hover:text-dark-8"
        >
          {showComments ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          Show comments
        </Button>
        
        {showComments && (
          <div className="space-y-2">
            <Label>Comments</Label>
            <textarea
              className="w-full min-h-[100px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:placeholder:text-dark-6"
              placeholder="Enter any comments..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
