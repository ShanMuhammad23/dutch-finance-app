'use client'

import { useQuery } from '@tanstack/react-query'
import { getOrganizationInvoices } from '@/lib/queries/invoices'
import { Invoice } from '@/lib/types'
import { AlertCircle, Eye, Edit, Download, Trash2, Search, ChevronLeft, ChevronRight, Check, X, ArrowLeftRight, Archive, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { getStatusColor } from '@/lib/invoiceUtils'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface InvoicesTableProps {
  organizationId: number
}

const INVOICE_STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as const

export function InvoicesTable({ organizationId }: InvoicesTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set())
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', organizationId],
    queryFn: () => getOrganizationInvoices(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
  })

  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    
    let filtered = selectedStatus === 'all' 
      ? invoices 
      : invoices.filter(invoice => invoice.status === selectedStatus)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toString().includes(query) ||
        invoice.contact?.name?.toLowerCase().includes(query) ||
        invoice.contact?.email?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [invoices, selectedStatus, searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [selectedStatus, searchQuery])

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality not implemented yet')
  }

  const handleDelete = async (id: number) => {
    try {
      // TODO: Implement delete functionality
      toast.info('Delete functionality not implemented yet')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete invoice')
    }
  }

  const handleArchive = async (id: number) => {
    try {
      // TODO: Implement archive functionality
      toast.info('Archive functionality not implemented yet')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive invoice')
    }
  }

  const toggleSelectInvoice = (id: number) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedInvoices(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedInvoices.size === paginatedInvoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(paginatedInvoices.map(inv => inv.id)))
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-500 bg-emerald-100/60 dark:bg-gray-800'
      case 'cancelled':
        return 'text-red-500 bg-red-100/60 dark:bg-gray-800'
      case 'overdue':
        return 'text-red-500 bg-red-100/60 dark:bg-gray-800'
      case 'sent':
        return 'text-blue-500 bg-blue-100/60 dark:bg-gray-800'
      case 'draft':
        return 'text-gray-500 bg-gray-100/60 dark:bg-gray-800'
      default:
        return 'text-gray-500 bg-gray-100/60 dark:bg-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check width={12} height={12} />
      case 'cancelled':
      case 'overdue':
        return <X width={12} height={12} />
      case 'sent':
        return <ArrowLeftRight width={12} height={12} />
      case 'draft':
        return <FileText width={12} height={12} />
      default:
        return <FileText width={12} height={12} />
    }
  }

  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return '??'
    const parts = name.trim().split(' ').filter(n => n.length > 0)
    if (parts.length === 0) return '??'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <section className="container px-4 mx-auto">
        <div className="flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        Invoice
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        Customer
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th scope="col" className="relative py-3.5 px-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
            {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container px-4 mx-auto">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center bg-white dark:bg-gray-900">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Failed to load invoices</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {error.message || 'Something went wrong while fetching invoices'}
          </p>
        </div>
      </section>
    )
  }

  if (!filteredInvoices || filteredInvoices.length === 0) {
    const hasInvoices = invoices && invoices.length > 0
    const hasFilters = selectedStatus !== 'all' || searchQuery.trim()
    
    return (
      <section className="container px-4 mx-auto">
        <div className="flex gap-4 flex-wrap justify-between items-center mb-4">
          <div className="flex items-center px-4 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 overflow-hidden max-w-xs w-full">
            <Search className="fill-gray-600 dark:fill-gray-400 mr-2 w-4 h-4 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none bg-transparent text-slate-600 dark:text-gray-300 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="text-slate-900 dark:text-gray-200 font-medium flex items-center px-4 py-2 rounded-md bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 overflow-hidden cursor-pointer transition"
          >
            <Download className="w-4 h-4 mr-2 fill-current inline" size={16} />
            Export
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {INVOICE_STATUSES.map((status) => {
            const isActive = selectedStatus === status
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`${isActive ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'} inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium capitalize transition`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center shadow-sm">
          <div className="mb-3 text-6xl">📄</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">
            {hasFilters ? 'No matching invoices found' : 'No invoices found'}
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {hasFilters
              ? 'Try adjusting your search or filter criteria.'
              : hasInvoices
                ? "You haven't created any invoices yet."
                : "You haven't created any invoices yet."}
          </p>
          <Link href="/dashboard/invoices/create" className="inline-flex">
            <span className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Create Your First Invoice
            </span>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="container px-4 mx-auto">
      <div className="flex gap-4 flex-wrap justify-between items-center mb-4">
        <div className="flex items-center px-4 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 overflow-hidden max-w-xs w-full">
          <Search className="fill-gray-600 dark:fill-gray-400 mr-2 w-4 h-4 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none bg-transparent text-slate-600 dark:text-gray-300 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="text-slate-900 dark:text-gray-200 font-medium flex items-center px-4 py-2 rounded-md bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 overflow-hidden cursor-pointer transition"
        >
          <Download className="w-4 h-4 mr-2 fill-current inline" size={16} />
          Export
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {INVOICE_STATUSES.map((status) => {
          const isActive = selectedStatus === status
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`${isActive ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'} inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium capitalize transition`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-x-3">
                        <Checkbox
                          checked={selectedInvoices.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="text-blue-500 border-gray-300 rounded dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"
                        />
                        <button 
                          className="flex items-center gap-x-2"
                          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        >
                          <span>Invoice</span>
                          <svg className="h-3" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.13347 0.0999756H2.98516L5.01902 4.79058H3.86226L3.45549 3.79907H1.63772L1.24366 4.79058H0.0996094L2.13347 0.0999756ZM2.54025 1.46012L1.96822 2.92196H3.11227L2.54025 1.46012Z" fill="currentColor" stroke="currentColor" strokeWidth="0.1" />
                            <path d="M0.722656 9.60832L3.09974 6.78633H0.811638V5.87109H4.35819V6.78633L2.01925 9.60832H4.43446V10.5617H0.722656V9.60832Z" fill="currentColor" stroke="currentColor" strokeWidth="0.1" />
                            <path d="M8.45558 7.25664V7.40664H8.60558H9.66065C9.72481 7.40664 9.74667 7.42274 9.75141 7.42691C9.75148 7.42808 9.75146 7.42993 9.75116 7.43262C9.75001 7.44265 9.74458 7.46304 9.72525 7.49314C9.72522 7.4932 9.72518 7.49326 9.72514 7.49332L7.86959 10.3529L7.86924 10.3534C7.83227 10.4109 7.79863 10.418 7.78568 10.418C7.77272 10.418 7.73908 10.4109 7.70211 10.3534L7.70177 10.3529L5.84621 7.49332C5.84617 7.49325 5.84612 7.49318 5.84608 7.49311C5.82677 7.46302 5.82135 7.44264 5.8202 7.43262C5.81989 7.42993 5.81987 7.42808 5.81994 7.42691C5.82469 7.42274 5.84655 7.40664 5.91071 7.40664H6.96578H7.11578V7.25664V0.633865C7.11578 0.42434 7.29014 0.249976 7.49967 0.249976H8.07169C8.28121 0.249976 8.45558 0.42434 8.45558 0.633865V7.25664Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3" />
                          </svg>
                        </button>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      Date
            </th>
                    <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
              Status
            </th>
                    <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      Customer
            </th>
                    <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
              Amount
            </th>
                    <th scope="col" className="relative py-3.5 px-4">
                      <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                  {paginatedInvoices.map((invoice: Invoice) => {
                    const contactName = invoice.contact?.name || 'Unknown Contact'
                    const contactEmail = invoice.contact?.email || ''
                    return (
                      <tr key={invoice.id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          <div className="inline-flex items-center gap-x-3">
                            <Checkbox
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                              className="text-blue-500 border-gray-300 rounded dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"
                            />
                            <span>#{invoice.invoice_number}</span>
                </div>
              </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                          {formatDateShort(invoice.issue_date)}
              </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 ${getStatusBadgeStyle(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <h2 className="text-sm font-normal capitalize">{invoice.status}</h2>
                          </div>
              </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex items-center gap-x-2">
                            <div className="object-cover w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                              {getInitials(contactName)}
                            </div>
                            <div>
                              <h2 className="text-sm font-medium text-gray-800 dark:text-white">{contactName}</h2>
                              {contactEmail && (
                                <p className="text-xs font-normal text-gray-600 dark:text-gray-400">{contactEmail}</p>
                              )}
                            </div>
                          </div>
              </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                {formatCurrency(invoice.total_amount, invoice.currency)}
              </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-x-6">
                  <button
                              onClick={() => handleArchive(invoice.id)}
                              className="text-gray-500 transition-colors duration-200 dark:hover:text-indigo-500 dark:text-gray-300 hover:text-indigo-500 focus:outline-none"
                            >
                              Archive
                  </button>
                  <button
                    onClick={() => {
                                // TODO: Implement download for specific invoice
                                toast.info(`Download invoice #${invoice.invoice_number}`)
                    }}
                              className="text-blue-500 transition-colors duration-200 hover:text-indigo-500 focus:outline-none"
                  >
                              Download
                  </button>
                </div>
              </td>
            </tr>
                    )
                  })}
        </tbody>
      </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center px-5 py-2 text-sm text-gray-700 dark:text-gray-200 capitalize transition-colors duration-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md gap-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>previous</span>
        </button>

        <div className="items-center hidden md:flex gap-x-3">
          {(() => {
            const pages: (number | 'ellipsis')[] = []
            
            if (totalPages <= 7) {
              // Show all pages
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
              }
            } else {
              // Always show first page
              pages.push(1)
              
              if (currentPage <= 4) {
                // Show first 5 pages, then ellipsis, then last page
                for (let i = 2; i <= 5; i++) {
                  pages.push(i)
                }
                pages.push('ellipsis')
                pages.push(totalPages)
              } else if (currentPage >= totalPages - 3) {
                // Show first page, ellipsis, then last 5 pages
                pages.push('ellipsis')
                for (let i = totalPages - 4; i <= totalPages; i++) {
                  pages.push(i)
                }
              } else {
                // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
                pages.push('ellipsis')
                pages.push(currentPage - 1)
                pages.push(currentPage)
                pages.push(currentPage + 1)
                pages.push('ellipsis')
                pages.push(totalPages)
              }
            }
            
            return pages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500 dark:text-gray-300">
                    ...
                  </span>
                )
              }
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 ${
                    currentPage === page
                      ? 'text-blue-500 dark:bg-gray-800 bg-blue-100/60'
                      : 'text-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            })
          })()}
        </div>

        <button
          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center px-5 py-2 text-sm text-gray-700 dark:text-gray-200 capitalize transition-colors duration-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md gap-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  )
}
