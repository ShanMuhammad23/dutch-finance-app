"use client"

import { useQuery } from '@tanstack/react-query'
import { getInvoice } from '@/lib/queries/invoices'
import { useActiveOrganization } from '@/context/organization-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id ? parseInt(params.id as string) : null
  const { activeOrganization } = useActiveOrganization()

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: !!invoiceId,
  })

  const handleDownloadPDF = () => {
    if (!invoiceId) return
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
  }

  const handleSendEmail = async () => {
    if (!invoiceId || !invoice?.contact?.email) {
      toast.error('Contact email is required to send invoice')
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      toast.success('Invoice sent successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invoice')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load invoice</p>
          <Link
            href="/dashboard/invoices"
            className="mt-4 inline-flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Link>
        </div>
      </div>
    )
  }

  // Use organization from invoice if available, otherwise fall back to activeOrganization
  const organization = (invoice as any).organization || activeOrganization
  const contact = invoice.contact
  const items = invoice.items || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Link>
          <div className="flex gap-3">
            {contact?.email && (
              <button
                onClick={handleSendEmail}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <div>
              {organization?.logo && (
                <img
                  src={organization.logo.startsWith('/') ? organization.logo : `/attachments/${organization.logo}`}
                  alt={organization.company_name}
                  className="h-16 mb-4"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {organization?.company_name || 'Company Name'}
              </h1>
              {organization?.address_line && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {organization.address_line}
                  {organization.postal_code && `, ${organization.postal_code}`}
                  {organization.city && ` ${organization.city}`}
                  {organization.country && `, ${organization.country}`}
                </p>
              )}
              {organization?.vat_number && (
                <p className="text-gray-600 dark:text-gray-400">VAT: {organization.vat_number}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">INVOICE</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Invoice #: <span className="font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Issue Date: <span className="font-semibold text-gray-900 dark:text-white">{formatDate(invoice.issue_date)}</span>
              </p>
              {invoice.due_date && (
                <p className="text-gray-600 dark:text-gray-400">
                  Due Date: <span className="font-semibold text-gray-900 dark:text-white">{formatDate(invoice.due_date)}</span>
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                Status: <span className="font-semibold text-gray-900 dark:text-white capitalize">{invoice.status}</span>
              </p>
            </div>
          </div>

          {/* Bill To */}
          {contact && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bill To:</h3>
              <p className="text-gray-900 dark:text-white font-medium">{contact.name}</p>
              {contact.email && (
                <p className="text-gray-600 dark:text-gray-400">{contact.email}</p>
              )}
              {contact.phone && (
                <p className="text-gray-600 dark:text-gray-400">{contact.phone}</p>
              )}
              {contact.address_line && (
                <p className="text-gray-600 dark:text-gray-400">
                  {contact.address_line}
                  {contact.postal_code && `, ${contact.postal_code}`}
                  {contact.city && ` ${contact.city}`}
                  {contact.country && `, ${contact.country}`}
                </p>
              )}
              {contact.vat_number && (
                <p className="text-gray-600 dark:text-gray-400">VAT: {contact.vat_number}</p>
              )}
            </div>
          )}

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Description
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Quantity
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Unit
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Unit Price
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Discount
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white">
                      {item.description}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {item.unit}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.unit_price, invoice.currency)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {item.discount}%
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                      {formatCurrency(item.line_total || 0, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {invoice.discount_total > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    -{formatCurrency(invoice.discount_total, invoice.currency)}
                  </span>
                </div>
              )}
              {invoice.tax_total > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(invoice.tax_total, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 mt-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h3>
            {invoice.bank_reg_no && invoice.bank_account_no && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Bank Account: {invoice.bank_reg_no} - {invoice.bank_account_no}
              </p>
            )}
            {invoice.payment_terms && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Payment Terms: {invoice.payment_terms}
              </p>
            )}
            <div className="mt-4">
              {invoice.payment_link ? (
                <a
                  href={invoice.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-medium"
                >
                  Payment Link
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-lg opacity-60 cursor-not-allowed font-medium"
                >
                  Payment Link
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          {invoice.comments && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comments</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{invoice.comments}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

