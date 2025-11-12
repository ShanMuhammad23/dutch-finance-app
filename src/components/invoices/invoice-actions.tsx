"use client"

// Removed shadcn UI imports; using Tailwind-only containers and buttons
import { Save, Send, Eye } from "lucide-react"

interface InvoiceActionsProps {
  onSaveDraft: () => void
  onSendInvoice: () => void
  onPreview?: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function InvoiceActions({
  onSaveDraft,
  onSendInvoice,
  onPreview,
  disabled = false,
  isLoading = false,
}: InvoiceActionsProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={disabled || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-8 dark:hover:bg-dark-3"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving…' : 'Save as Draft'}</span>
        </button>
        <button
          type="button"
          onClick={onSendInvoice}
          disabled={disabled || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-indigo-900/30 dark:hover:shadow-indigo-900/40"
        >
          <Send className="h-4 w-4" />
          <span>{isLoading ? 'Sending…' : 'Send Invoice'}</span>
        </button>
        {onPreview && (
          <button
            type="button"
            disabled={disabled}
            onClick={onPreview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-dark-6 dark:hover:bg-dark-3"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
        )}
      </div>
    </div>
  )
}
