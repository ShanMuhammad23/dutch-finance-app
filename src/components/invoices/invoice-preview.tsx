"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, FileImage } from "lucide-react"
import { InvoiceItem, Contact, Organization } from "@/lib/types"
import { calculateInvoiceTotals } from "@/lib/invoice-utils"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface InvoicePreviewProps {
  organization: Organization | null
  contact: Contact | null
  invoiceNumber: number
  issueDate: string
  dueDate: string
  paymentTerms: string
  items: InvoiceItem[]
  currency?: string
  bankRegNo?: string
  bankAccountNo?: string
  interestRate?: number
  lateFee?: number
  comments?: string
  onFilesDropped?: (files: File[]) => void
}

export function InvoicePreview({
  organization,
  contact,
  invoiceNumber,
  issueDate,
  dueDate,
  paymentTerms,
  items,
  currency = 'DKK',
  bankRegNo,
  bankAccountNo,
  interestRate = 0.81,
  lateFee = 100,
  comments,
  onFilesDropped,
}: InvoicePreviewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('application/pdf')
      )
      if (validFiles.length > 0) {
        setDroppedFiles(prev => [...prev, ...validFiles])
        onFilesDropped?.(validFiles)
      }
    }
  }, [onFilesDropped])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('application/pdf')
      )
      if (validFiles.length > 0) {
        setDroppedFiles(prev => [...prev, ...validFiles])
        onFilesDropped?.(validFiles)
      }
    }
  }, [onFilesDropped])

  const removeFile = useCallback((index: number) => {
    setDroppedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white p-8 shadow-sm transition-all dark:border-dark-3 dark:bg-dark-2",
        isDragging && "border-primary border-2 bg-primary/5 dark:bg-primary/10"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-8 shadow-lg dark:bg-dark-2">
            <Upload className="h-12 w-12 text-primary" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Drop files here to attach
            </p>
            <p className="text-sm text-muted-foreground">
              Images or PDF files
            </p>
          </div>
        </div>
      )}

      {/* Invoice Preview Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6 dark:border-dark-3">
          <div className="space-y-2">
            {organization?.logo && (
              <div className="relative h-16 w-48">
                <Image
                  src={`/attachments/${organization.logo}`}
                  alt={organization.company_name || 'Logo'}
                  fill
                  className="object-contain"
                  unoptimized
                  onError={(e) => {
                    // Hide logo if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {organization?.company_name || 'Company Name'}
              </h1>
              {organization?.address_line && (
                <p className="text-sm text-muted-foreground">
                  {organization.address_line}
                  {organization.postal_code && organization.city && 
                    `, ${organization.postal_code} ${organization.city}`
                  }
                </p>
              )}
              {organization?.vat_number && (
                <p className="text-sm text-muted-foreground">
                  CVR-nr. {organization.vat_number}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Invoice #{invoiceNumber}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Issue date: {formatDate(issueDate)}
            </p>
            {dueDate && (
              <p className="text-sm text-muted-foreground">
                Due date: {formatDate(dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Bill To */}
        {contact && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Bill To
            </h3>
            <div className="text-slate-900 dark:text-white">
              <p className="font-semibold">{contact.name}</p>
              {contact.address_line && (
                <p className="text-sm text-muted-foreground">
                  {contact.address_line}
                  {contact.postal_code && contact.city && 
                    `, ${contact.postal_code} ${contact.city}`
                  }
                </p>
              )}
              {contact.vat_number && (
                <p className="text-sm text-muted-foreground">
                  CVR-nr. {contact.vat_number}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="overflow-hidden rounded-lg border dark:border-dark-3">
          <table className="w-full">
            <thead className="bg-muted/50 dark:bg-dark-3">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Description
                </th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Qty
                </th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Unit
                </th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Unit Price
                </th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Discount
                </th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700 dark:text-dark-8">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-t dark:border-dark-3",
                    item.isHeadline && "bg-muted/30 dark:bg-dark-3/60"
                  )}
                >
                  <td className="p-3">
                    <span className={item.isHeadline ? "font-semibold" : ""}>
                      {item.description || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {!item.isHeadline && item.quantity}
                  </td>
                  <td className="p-3">
                    {!item.isHeadline && item.unit}
                  </td>
                  <td className="p-3 text-right">
                    {!item.isHeadline && formatCurrency(item.unit_price)}
                  </td>
                  <td className="p-3 text-right">
                    {!item.isHeadline && item.discount > 0 && `${item.discount}%`}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {!item.isHeadline && item.line_total !== undefined && formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  -{formatCurrency(totals.discount_total)}
                </span>
              </div>
            )}
            {totals.tax_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(totals.tax_total)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold text-slate-900 dark:border-dark-3 dark:text-white">
              <span>Total {currency}</span>
              <span>{formatCurrency(totals.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {paymentTerms && (
          <div className="space-y-2 border-t pt-4 dark:border-dark-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Payment Terms
            </h3>
            <p className="text-sm text-muted-foreground">{paymentTerms}</p>
            {dueDate && (
              <p className="text-sm text-muted-foreground">
                Due date: {formatDate(dueDate)}
              </p>
            )}
          </div>
        )}

        {/* Bank Details */}
        {(bankRegNo || bankAccountNo) && (
          <div className="space-y-2 border-t pt-4 dark:border-dark-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Bank Account Details
            </h3>
            <p className="text-sm text-muted-foreground">
              Bank / Reg. no.: {bankRegNo || '---'}
            </p>
            <p className="text-sm text-muted-foreground">
              Account no.: {bankAccountNo || '---'}
            </p>
            <p className="text-sm text-muted-foreground">
              Invoice no. {invoiceNumber} must be stated when making a bank transfer.
            </p>
          </div>
        )}

        {/* Comments */}
        {comments && (
          <div className="space-y-2 border-t pt-4 dark:border-dark-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Comments
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {comments}
            </p>
          </div>
        )}

        {/* Dropped Files Display */}
        {droppedFiles.length > 0 && (
          <div className="space-y-2 border-t pt-4 dark:border-dark-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Attachments
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {droppedFiles.map((file, index) => (
                <div
                  key={index}
                  className="group relative flex items-center gap-2 rounded-lg border bg-muted/30 p-3 dark:border-dark-3 dark:bg-dark-3/40"
                >
                  {file.type.startsWith('image/') ? (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-slate-200 dark:bg-dark-3">
                      <FileImage className="h-6 w-6 text-slate-600 dark:text-dark-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-dark-3 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drop Zone Indicator */}
        {!isDragging && droppedFiles.length === 0 && (
          <div className="flex items-center justify-center border-t border-dashed pt-6 dark:border-dark-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-dark-3 dark:hover:border-primary"
            >
              <Upload className="h-4 w-4" />
              <span>Click or drag files here to attach</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}

