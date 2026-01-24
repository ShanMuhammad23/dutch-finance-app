"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BankStatementUpload } from "@/lib/types"
import { parseBankStatementFile } from "@/lib/bank-csv-parser"
import { BankStatementReview } from "./bank-statement-review"

interface BankStatementUploadProps {
  organizationId: number
  onUploadComplete?: (upload: BankStatementUpload) => void
  onImportComplete?: () => void
}

export function BankStatementUpload({ organizationId, onUploadComplete, onImportComplete }: BankStatementUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedData, setUploadedData] = useState<BankStatementUpload | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const bankFile = files.find(file => {
      const name = file.name.toLowerCase()
      return name.endsWith('.csv') || 
             name.endsWith('.xlsx') || 
             name.endsWith('.xls') ||
             file.type === 'text/csv' ||
             file.type === 'application/vnd.ms-excel' ||
             file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    if (bankFile) {
      await processFile(bankFile)
    } else {
      setError('Please upload a CSV or XLSX file')
    }
  }, [])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const csvFile = files[0]
    
    if (csvFile) {
      await processFile(csvFile)
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setUploadedData(null)

    try {
      // Validate file size (25 MB limit)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds 25 MB limit')
      }

      // Validate file type
      const fileName = file.name.toLowerCase()
      const isValidFile = fileName.endsWith('.csv') || 
                          fileName.endsWith('.xlsx') || 
                          fileName.endsWith('.xls') ||
                          file.type === 'text/csv' || 
                          file.type === 'application/vnd.ms-excel' ||
                          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                          file.type === 'text/plain'
      
      if (!isValidFile) {
        throw new Error('Please upload a CSV or XLSX file')
      }

      const parsed = await parseBankStatementFile(file)
      setUploadedData(parsed)
      onUploadComplete?.(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file')
    } finally {
      setIsProcessing(false)
    }
  }, [onUploadComplete])

  const handleReset = useCallback(() => {
    setUploadedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  if (uploadedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                File uploaded successfully
              </p>
              <p className="text-sm text-green-700 dark:text-green-200">
                {uploadedData.filename} • {uploadedData.transactions.length} transactions found
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-green-700 hover:text-green-900 dark:text-green-200 dark:hover:text-green-100"
          >
            <X className="h-4 w-4 mr-2" />
            Upload another
          </Button>
        </div>

        <BankStatementReview 
          upload={uploadedData}
          organizationId={organizationId}
          onImportComplete={onImportComplete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative rounded-xl border border-dashed bg-gray-2 px-6 py-10 text-center transition-colors dark:border-dark-3 dark:bg-dark-2",
          isDragging && "border-primary bg-primary/5 dark:bg-primary/10",
          error && "border-red-300 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 shadow-lg dark:bg-dark-2">
              <Upload className="h-12 w-12 text-primary" />
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Drop CSV file here
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-500/20 dark:text-red-200">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Upload area */}
        {!isDragging && (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
              {isProcessing ? (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              ) : (
                <Upload className="size-7 text-primary" />
              )}
            </div>

            <div className="mt-5 space-y-1.5">
              <p className="text-base font-medium text-dark dark:text-white">
                {isProcessing ? 'Processing CSV file...' : 'Drag and drop your bank statement CSV'}
              </p>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                Accepts CSV or XLSX files up to 25 MB. Supports formats from Danske Bank, Nordea, Jyske Bank, and others.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Select CSV file'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileInput}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          </>
        )}
      </div>

      {/* Format info */}
      <div className="rounded-lg border bg-slate-50 p-4 dark:border-dark-3 dark:bg-dark-2">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
          Supported file formats:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>File types: CSV, XLSX, XLS</li>
          <li>Date column: Dato, Date, Transaktionsdato</li>
          <li>Description column: Tekst, Beskrivelse, Description</li>
          <li>Amount column: Beløb, Amount (or separate Debit/Credit columns)</li>
          <li>Optional: Saldo (Balance), Reference, Modpart (Counterparty)</li>
        </ul>
      </div>
    </div>
  )
}

