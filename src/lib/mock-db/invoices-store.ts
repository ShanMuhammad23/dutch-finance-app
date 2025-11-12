import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/invoice-utils"
import type { CreateInvoiceInput, Invoice, InvoiceItem } from "@/lib/types"

interface InvoicesStore {
  invoices: Invoice[]
  counter: number
}

const defaultInvoices: Invoice[] = [
  {
    id: 1,
    organization_id: 1,
    contact_id: 1,
    created_by: 1,
    invoice_number: 1,
    issue_date: "2025-01-15",
    due_date: "2025-01-23",
    payment_terms: "Net 8 days",
    status: "draft",
    comments: "",
    subtotal: 1000,
    discount_total: 0,
    tax_total: 0,
    total_amount: 1000,
    currency: "DKK",
    bank_reg_no: "",
    bank_account_no: "",
    interest_rate: 0.81,
    late_fee: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 1,
        invoice_id: 1,
        description: "Hunting equipment rental",
        quantity: 1,
        unit: "pcs.",
        unit_price: 1000,
        discount: 0,
        line_total: 1000,
      },
    ],
  },
]

const globalStore = globalThis as unknown as {
  __mockInvoicesStore?: InvoicesStore
}

const store: InvoicesStore =
  globalStore.__mockInvoicesStore ?? {
    invoices: defaultInvoices,
    counter: defaultInvoices.length + 1,
  }

if (!globalStore.__mockInvoicesStore) {
  globalStore.__mockInvoicesStore = store
}

const buildInvoiceItems = (invoiceId: number, items: CreateInvoiceInput["items"]): InvoiceItem[] =>
  items.map((item, index) => ({
    id: index + 1,
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    discount: item.discount ?? 0,
    line_total: calculateLineTotal(item.quantity, item.unit_price, item.discount ?? 0),
  }))

export function listInvoicesByOrganization(organizationId: number) {
  return store.invoices.filter((invoice) => invoice.organization_id === organizationId)
}

export function findInvoiceById(id: number) {
  return store.invoices.find((invoice) => invoice.id === id)
}

export function createInvoiceRecord(input: CreateInvoiceInput): Invoice {
  const id = store.counter++
  const now = new Date().toISOString()
  const items = buildInvoiceItems(id, input.items)
  const totals = calculateInvoiceTotals(items)

  const invoice: Invoice = {
    id,
    organization_id: input.organization_id,
    contact_id: input.contact_id,
    created_by: 1,
    invoice_number: input.invoice_number ?? id,
    issue_date: input.issue_date,
    due_date: input.due_date,
    payment_terms: input.payment_terms ?? "Net 8 days",
    status: input.status ?? "draft",
    comments: input.comments,
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    total_amount: totals.total_amount,
    currency: input.currency ?? "DKK",
    bank_reg_no: input.bank_reg_no,
    bank_account_no: input.bank_account_no,
    interest_rate: input.interest_rate ?? 0.81,
    late_fee: input.late_fee ?? 100,
    created_at: now,
    updated_at: now,
    items,
  }

  store.invoices.push(invoice)

  return invoice
}

export function updateInvoiceRecord(id: number, updates: Partial<CreateInvoiceInput>) {
  const index = store.invoices.findIndex((invoice) => invoice.id === id)
  if (index === -1) {
    return undefined
  }

  const existing = store.invoices[index]
  const items = updates.items ? buildInvoiceItems(id, updates.items) : existing.items ?? []
  const totals = calculateInvoiceTotals(items)
  const updated: Invoice = {
    ...existing,
    organization_id: updates.organization_id ?? existing.organization_id,
    contact_id: updates.contact_id ?? existing.contact_id,
    invoice_number: updates.invoice_number ?? existing.invoice_number,
    issue_date: updates.issue_date ?? existing.issue_date,
    due_date: updates.due_date ?? existing.due_date,
    payment_terms: updates.payment_terms ?? existing.payment_terms,
    comments: updates.comments ?? existing.comments,
    currency: updates.currency ?? existing.currency,
    bank_reg_no: updates.bank_reg_no ?? existing.bank_reg_no,
    bank_account_no: updates.bank_account_no ?? existing.bank_account_no,
    interest_rate: updates.interest_rate ?? existing.interest_rate,
    late_fee: updates.late_fee ?? existing.late_fee,
    status: updates.status ?? existing.status,
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    total_amount: totals.total_amount,
    items,
    updated_at: new Date().toISOString(),
  }

  store.invoices[index] = updated

  return updated
}

export function removeInvoice(id: number) {
  const index = store.invoices.findIndex((invoice) => invoice.id === id)
  if (index === -1) {
    return false
  }

  store.invoices.splice(index, 1)
  return true
}


