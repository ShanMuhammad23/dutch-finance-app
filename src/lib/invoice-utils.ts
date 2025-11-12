import type { InvoiceItem } from "@/lib/types"

export type CalculableInvoiceItem = Pick<InvoiceItem, "quantity" | "unit_price" | "discount">

export function calculateLineTotal(quantity: number, unitPrice: number, discount: number = 0): number {
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0
  const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0
  const normalizedDiscount = Number.isFinite(discount) ? discount : 0

  const subtotal = safeQuantity * safeUnitPrice
  const discountAmount = subtotal * (normalizedDiscount / 100)

  return Number((subtotal - discountAmount).toFixed(2))
}

export function calculateInvoiceTotals(items: CalculableInvoiceItem[]) {
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.unit_price, item.discount ?? 0)
  }, 0)

  const taxTotal = 0

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_total: 0,
    tax_total: taxTotal,
    total_amount: Number((subtotal + taxTotal).toFixed(2)),
  }
}


