"use client"

import { Plus, Trash2, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InvoiceItem } from "@/lib/types"
import { calculateLineTotal } from "@/lib/invoice-utils"

interface InvoiceItemsTableProps {
  items: InvoiceItem[]
  onItemsChange: (items: InvoiceItem[]) => void
}

export function InvoiceItemsTable({ items, onItemsChange }: InvoiceItemsTableProps) {
  const addNewItem = () => {
    const newItem: InvoiceItem = {
      description: "",
      quantity: 1,
      unit: "pcs.",
      unit_price: 0,
      discount: 0,
      line_total: calculateLineTotal(1, 0, 0),
    }
    onItemsChange([...items, newItem])
  }

  const addHeadline = () => {
    const headlineItem: InvoiceItem = {
      description: "",
      quantity: 0,
      unit: "",
      unit_price: 0,
      discount: 0,
      isHeadline: true,
    }
    onItemsChange([...items, headlineItem])
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: number | string) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate line total if it's not a headline
    if (!updatedItems[index].isHeadline && field !== 'line_total') {
      const { quantity, unit_price, discount } = updatedItems[index]
      updatedItems[index].line_total = calculateLineTotal(quantity, unit_price, discount)
    }
    
    onItemsChange(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onItemsChange(updatedItems)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-4 text-slate-800 dark:text-dark-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Faktura</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHeadline}
            className="flex items-center gap-2"
          >
            <Type className="h-4 w-4" />
            Create a headline
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewItem}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create new line
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-dark-3 dark:bg-dark-2">
        <table className="w-full">
          <thead className="bg-muted/50 dark:bg-dark-3">
            <tr>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Description</th>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Number</th>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Unit</th>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Unit price</th>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Discount</th>
              <th className="p-3 text-left font-medium text-slate-700 dark:text-dark-8">Price</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-slate-200 dark:border-dark-3">
                <td className="p-3">
                  {item.isHeadline ? (
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Headline"
                      className="bg-muted/30 font-semibold dark:bg-dark-3/60"
                    />
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Enter description"
                    />
                  )}
                </td>
                <td className="p-3">
                  {!item.isHeadline && (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  )}
                </td>
                <td className="p-3">
                  {!item.isHeadline && (
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="pcs."
                      className="w-20"
                    />
                  )}
                </td>
                <td className="p-3">
                  {!item.isHeadline && (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  )}
                </td>
                <td className="p-3">
                  {!item.isHeadline && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-16"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {!item.isHeadline && item.line_total !== undefined && (
                    <span className="font-medium">
                      {formatCurrency(item.line_total)}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground dark:text-dark-6">
            No items added yet. Click &quot;Create new line&quot; to get started.
          </div>
        )}
      </div>
    </div>
  )
}
