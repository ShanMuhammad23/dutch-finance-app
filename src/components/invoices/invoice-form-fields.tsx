"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "./date-picker"
import { ContactSelector } from "./contact-selector"
import { Contact } from "@/lib/types"

interface InvoiceFormFieldsProps {
  selectedContactId?: number
  onContactSelect: (contactId: number | undefined) => void
  contacts: Contact[]
  organizationId: number
  onContactCreated: (contact: Contact) => void
  issueDate: string
  onIssueDateChange: (date: string) => void
  invoiceNumber: number
  onInvoiceNumberChange: (number: number) => void
}

export function InvoiceFormFields({
  selectedContactId,
  onContactSelect,
  contacts,
  organizationId,
  onContactCreated,
  issueDate,
  onIssueDateChange,
  invoiceNumber,
  onInvoiceNumberChange,
}: InvoiceFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Contact Selection */}
      <ContactSelector
        contacts={contacts}
        selectedContactId={selectedContactId}
        onContactSelect={onContactSelect}
        organizationId={organizationId}
        onContactCreated={onContactCreated}
      />

      {/* Date and Invoice Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DatePicker
          label="Date"
          value={issueDate}
          onChange={onIssueDateChange}
          required
        />
        <div className="space-y-2">
          <Label>Invoice number</Label>
          <Input
            type="number"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
      </div>
    </div>
  )
}
