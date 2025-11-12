"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { Plus, Building2, User, Loader2, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Contact, CreateContactInput } from "@/lib/types"
import { useCreateContact } from "@/lib/queries/contacts"
import { toast } from "sonner"

interface ContactSelectorProps {
  contacts: Contact[]
  selectedContactId?: number
  onContactSelect: (contactId: number | undefined) => void
  organizationId: number
  onContactCreated?: (contact: Contact) => void
}

export function ContactSelector({
  contacts,
  selectedContactId,
  onContactSelect,
  organizationId,
  onContactCreated,
}: ContactSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const createContact = useCreateContact(organizationId)
  const dialogBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDialogOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }

    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isDialogOpen])

  const selectedContact = contacts.find(c => c.id === selectedContactId)

  const handleCreateContact = async (contactData: CreateContactInput) => {
    try {
      const newContact = await createContact.mutateAsync(contactData)
      onContactCreated?.(newContact)
      onContactSelect(newContact.id)
      setIsDialogOpen(false)
      toast.success("Contact created successfully")
    } catch (error) {
      toast.error("Failed to create contact")
      console.error(error)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Contact</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <select
              value={selectedContactId?.toString() ?? ""}
              onChange={(event) => {
                const value = event.target.value
                if (value === "") {
                  onContactSelect(undefined)
                  return
                }

                if (value === "no-contacts") return
                onContactSelect(parseInt(value, 10))
              }}
              className="w-full appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <option value="" disabled>
                --- Select contact ---
              </option>
              {contacts.length === 0 ? (
                <option value="no-contacts" disabled>
                  No contacts
                </option>
              ) : (
                contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))
              )}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground dark:text-dark-6">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => setIsDialogOpen(true)}
          aria-label="Create new contact"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedContact && (
        <div className="text-sm text-muted-foreground dark:text-dark-6">
          {selectedContact.contact_type === 'company' ? (
            <Building2 className="inline h-4 w-4 mr-1" />
          ) : (
            <User className="inline h-4 w-4 mr-1" />
          )}
          {selectedContact.name}
          {selectedContact.email && ` • ${selectedContact.email}`}
        </div>
      )}

      {isDialogOpen && (
        <Fragment>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsDialogOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-dark-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-dark-8">Create New Contact</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted dark:text-dark-6 dark:hover:bg-dark-3"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div ref={dialogBodyRef} className="max-h-[70vh] overflow-y-auto px-4 py-3">
                <CreateContactForm
                  organizationId={organizationId}
                  onSubmit={handleCreateContact}
                  isLoading={createContact.isPending}
                  onCancel={() => setIsDialogOpen(false)}
                  onContactCreated={onContactCreated}
                />
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )
}

interface CreateContactFormProps {
  organizationId: number
  onSubmit: (data: CreateContactInput) => void
  isLoading: boolean
  onCancel?: () => void
  onContactCreated?: (contact: Contact) => void
}

export function CreateContactForm({ organizationId, onSubmit, isLoading, onCancel }: CreateContactFormProps) {
  const [contactType, setContactType] = useState<'company' | 'individual'>('company')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line: '',
    postal_code: '',
    city: '',
    country: 'Denmark',
    vat_number: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      organization_id: organizationId,
      contact_type: contactType,
      ...formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-4 text-slate-800 dark:text-dark-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Contact Type</label>
        <div className="relative">
          <select
            value={contactType}
            onChange={(event) =>
              setContactType(event.target.value as 'company' | 'individual')
            }
            className="w-full appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="company">Company</option>
            <option value="individual">Individual</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground dark:text-dark-6">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800 dark:text-dark-7">
          {contactType === 'company' ? 'Company Name' : 'Full Name'}
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          placeholder={contactType === 'company' ? 'Company Name' : 'Full Name'}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          placeholder="email@example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          placeholder="+45 12 34 56 78"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Address</label>
        <input
          type="text"
          value={formData.address_line}
          onChange={(e) => setFormData(prev => ({ ...prev, address_line: e.target.value }))}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          placeholder="Street address"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-dark-7">Postal Code</label>
          <input
            type="text"
            value={formData.postal_code}
            onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            placeholder="1234"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-dark-7">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            placeholder="Copenhagen"
          />
        </div>
      </div>

      {contactType === 'company' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-dark-7">VAT Number</label>
          <input
            type="text"
            value={formData.vat_number}
            onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            placeholder="DK12345678"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          {isLoading ? 'Creating...' : 'Create Contact'}
        </Button>
      </div>
    </form>
  )
}
