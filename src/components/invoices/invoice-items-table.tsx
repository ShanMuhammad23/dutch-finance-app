"use client"

import { Plus, Trash2, Type, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InvoiceItem, Product } from "@/lib/types"
import { calculateLineTotal } from "@/lib/invoice-utils"
import { useState, useEffect, useRef } from "react"

interface InvoiceItemsTableProps {
  items: InvoiceItem[]
  onItemsChange: (items: InvoiceItem[]) => void
  products?: Product[]
  productsLoading?: boolean
}

export function InvoiceItemsTable({ items, onItemsChange, products = [], productsLoading = false }: InvoiceItemsTableProps) {
  const [productSelectorsOpen, setProductSelectorsOpen] = useState<Record<number, boolean>>({})
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const [dropdownPositions, setDropdownPositions] = useState<Record<number, { top: number; left: number }>>({})

  // Calculate dropdown position and close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(productSelectorsOpen).forEach((key) => {
        const index = Number(key)
        const ref = dropdownRefs.current[index]
        const buttonRef = buttonRefs.current[index]
        if (
          ref && 
          buttonRef &&
          !ref.contains(event.target as Node) && 
          !buttonRef.contains(event.target as Node) &&
          productSelectorsOpen[index]
        ) {
          setProductSelectorsOpen((prev) => ({ ...prev, [index]: false }))
        }
      })
    }

    const updatePositions = () => {
      const newPositions: Record<number, { top: number; left: number }> = {}
      Object.keys(productSelectorsOpen).forEach((key) => {
        const index = Number(key)
        const buttonRef = buttonRefs.current[index]
        if (buttonRef && productSelectorsOpen[index]) {
          const rect = buttonRef.getBoundingClientRect()
          // Fixed positioning is relative to viewport, so use getBoundingClientRect directly
          newPositions[index] = {
            top: rect.bottom + 4,
            left: rect.left,
          }
        }
      })
      if (Object.keys(newPositions).length > 0) {
        setDropdownPositions(newPositions)
      }
    }

    if (Object.keys(productSelectorsOpen).some(key => productSelectorsOpen[Number(key)])) {
      updatePositions()
      window.addEventListener("scroll", updatePositions, true)
      window.addEventListener("resize", updatePositions)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", updatePositions, true)
      window.removeEventListener("resize", updatePositions)
    }
  }, [productSelectorsOpen])

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

  const handleProductSelect = (index: number, product: Product) => {
    const updatedItems = [...items]
    const item = updatedItems[index]
    
    if (!item.isHeadline) {
      // Populate invoice item fields from product
      item.description = product.name
      item.unit_price = product.price_excl_vat
      item.unit = product.unit || "pcs."
      item.quantity = product.quantity > 0 ? product.quantity : 1
      
      // Recalculate line total
      item.line_total = calculateLineTotal(item.quantity, item.unit_price, item.discount || 0)
      
      onItemsChange(updatedItems)
    }
    
    // Close the product selector
    setProductSelectorsOpen({ ...productSelectorsOpen, [index]: false })
  }

  const toggleProductSelector = (index: number) => {
    const isOpening = !productSelectorsOpen[index]
    setProductSelectorsOpen({ ...productSelectorsOpen, [index]: isOpening })
    
    // Calculate position when opening
    if (isOpening) {
      setTimeout(() => {
        const buttonRef = buttonRefs.current[index]
        if (buttonRef) {
          const rect = buttonRef.getBoundingClientRect()
          // Fixed positioning is relative to viewport, so use getBoundingClientRect directly
          setDropdownPositions({
            ...dropdownPositions,
            [index]: {
              top: rect.bottom + 4,
              left: rect.left,
            },
          })
        }
      }, 0)
    }
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
                    <div className="relative flex gap-2">
                      {products.length > 0 && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProductSelector(index)}
                            className="h-9 w-9 p-0 flex-shrink-0"
                            title="Select product"
                            ref={(el) => {
                              buttonRefs.current[index] = el
                            }}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          {productSelectorsOpen[index] && dropdownPositions[index] && (
                            <div 
                              className="fixed z-[9999] max-h-60 w-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2"
                              style={{
                                top: `${dropdownPositions[index].top}px`,
                                left: `${dropdownPositions[index].left}px`,
                              }}
                              ref={(el) => {
                                dropdownRefs.current[index] = el
                              }}
                            >
                              {productsLoading ? (
                                <div className="p-3 text-sm text-muted-foreground">Loading products...</div>
                              ) : products.length === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground">No products available</div>
                              ) : (
                                <div className="py-1">
                                  {products.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => handleProductSelect(index, product)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-dark-3"
                                    >
                                      <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Intl.NumberFormat('da-DK', {
                                          style: 'currency',
                                          currency: 'DKK',
                                          minimumFractionDigits: 2,
                                        }).format(product.price_excl_vat)}
                                        {product.unit && ` • ${product.unit}`}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Enter description"
                        className="flex-1"
                      />
                    </div>
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
