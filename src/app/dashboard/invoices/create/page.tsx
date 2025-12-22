"use client"

import { useMemo, useState } from "react"

import { InvoiceFormFields } from "@/components/invoices/invoice-form-fields"
import { InvoiceItemsTable } from "@/components/invoices/invoice-items-table"
import { InvoiceSummary } from "@/components/invoices/invoice-summary"
import { InvoiceActions } from "@/components/invoices/invoice-actions"
import { ContactInfoDisplay } from "@/components/invoices/contact-info-display"
import { useActiveOrganization } from "@/context/organization-context"
import { useInvoiceForm } from "@/hooks/use-invoice-form"
import { useOrganizationProducts } from "@/lib/queries/products"

export default function InvoicesPage() {
  const { organizationIdAsNumber, isLoading: organizationLoading, isReady, activeOrganization } = useActiveOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data: products = [], isLoading: productsLoading } = useOrganizationProducts(
    organizationIdAsNumber ?? undefined
  )

  const {
    selectedContactId,
    issueDate,
    dueDate,
    invoiceNumber,
    paymentTerms,
    bankRegNo,
    bankAccountNo,
    interestRate,
    lateFee,
    items,
    contacts,
    contactsLoading,
    contactsError,
    selectedContact,
    setSelectedContactId,
    setIssueDate,
    setDueDate,
    setInvoiceNumber,
    setPaymentTerms,
    setBankRegNo,
    setBankAccountNo,
    setInterestRate,
    setLateFee,
    setItems,
    handleContactCreated,
    handleSaveDraft,
    handleSendInvoice,
  } = useInvoiceForm({ organizationId: organizationIdAsNumber ?? undefined })

  const hasValidLineItems = useMemo(
    () => items.some((item) => !item.isHeadline && item.description.trim().length > 0),
    [items],
  )
  const isFormValid = Boolean(selectedContactId && hasValidLineItems)

  if (organizationLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 w-32 rounded-md bg-slate-200/70 animate-pulse" />
        <div className="h-96 w-full rounded-2xl border bg-slate-100/60 animate-pulse" />
      </div>
    )
  }

  if (!isReady || !organizationIdAsNumber) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">No organization selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose or create an organization before creating invoices.
          </p>
        </div>
      </div>
    )
  }

  const handleSaveDraftWithLoading = async () => {
    setIsSubmitting(true)
    try {
      await handleSaveDraft()
    } catch {
      // Toast feedback handled in hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendInvoiceWithLoading = async () => {
    setIsSubmitting(true)
    try {
      await handleSendInvoice()
    } catch {
      // Toast feedback handled in hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create invoice</h1>
        {activeOrganization && (
          <p className="text-sm text-muted-foreground">
            Issuing on behalf of <span className="font-medium text-slate-700 dark:text-dark-6">{activeOrganization.company_name}</span>
          </p>
        )}
      </div>

      {!!contactsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          We couldn&apos;t load contacts for this organization. Try again or add a new contact manually.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2 dark:bg-none">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Invoice details</h2>
            </div>
            <div className="space-y-6">
              <InvoiceFormFields
                selectedContactId={selectedContactId}
                onContactSelect={setSelectedContactId}
                contacts={contacts}
                organizationId={organizationIdAsNumber}
                onContactCreated={handleContactCreated}
                issueDate={issueDate}
                onIssueDateChange={setIssueDate}
                invoiceNumber={invoiceNumber}
                onInvoiceNumberChange={setInvoiceNumber}
              />
            </div>
            {contactsLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading contacts…</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-0 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <div className="p-6">
              <InvoiceItemsTable 
                items={items} 
                onItemsChange={setItems}
                products={products}
                productsLoading={productsLoading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Summary</h2>
            </div>
            <InvoiceSummary
              items={items}
              paymentTerms={paymentTerms}
              onPaymentTermsChange={setPaymentTerms}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
              bankRegNo={bankRegNo}
              onBankRegNoChange={setBankRegNo}
              bankAccountNo={bankAccountNo}
              onBankAccountNoChange={setBankAccountNo}
              interestRate={interestRate}
              onInterestRateChange={setInterestRate}
              lateFee={lateFee}
              onLateFeeChange={setLateFee}
              invoiceNumber={invoiceNumber}
            />
          </div>

          <InvoiceActions
            onSaveDraft={handleSaveDraftWithLoading}
            onSendInvoice={handleSendInvoiceWithLoading}
            disabled={!isFormValid || isSubmitting}
            isLoading={isSubmitting}
          />
        </div>
      </div>

      {selectedContact && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <ContactInfoDisplay contact={selectedContact} />
        </div>
      )}
    </div>
  )
}
