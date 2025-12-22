"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Contact, CreateInvoiceInput, Invoice, InvoiceItem } from "@/lib/types"
import { useOrganizationContacts } from "@/lib/queries/contacts"
import { createInvoice } from "@/lib/queries/invoices"

type SubmitMode = "draft" | "sent"

interface UseInvoiceFormArgs {
  organizationId?: number
}

interface UseInvoiceFormResult {
  // State
  selectedContactId: number | undefined
  issueDate: string
  dueDate: string
  invoiceNumber: number
  paymentTerms: string
  bankRegNo: string
  bankAccountNo: string
  interestRate: number
  lateFee: number
  items: InvoiceItem[]
  contacts: Contact[]
  contactsLoading: boolean
  contactsError: unknown
  selectedContact: Contact | undefined

  // Setters
  setSelectedContactId: (id: number | undefined) => void
  setIssueDate: (date: string) => void
  setDueDate: (date: string) => void
  setInvoiceNumber: (value: number) => void
  setPaymentTerms: (terms: string) => void
  setBankRegNo: (value: string) => void
  setBankAccountNo: (value: string) => void
  setInterestRate: (value: number) => void
  setLateFee: (value: number) => void
  setItems: (items: InvoiceItem[]) => void

  // Actions
  handleContactCreated: (contact: Contact) => void
  handleSaveDraft: () => Promise<Invoice | undefined>
  handleSendInvoice: () => Promise<Invoice | undefined>
}

const DEFAULT_PAYMENT_TERMS = "Net 8 days"

const todayISO = () => {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(now.getTime() - timezoneOffset)
  return localDate.toISOString().split("T")[0]
}

const sanitizeItems = (items: InvoiceItem[]) =>
  items
    .filter((item) => !item.isHeadline)
    .map((item) => ({
      description: item.description.trim(),
      quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
      unit: item.unit || "",
      unit_price: Number.isFinite(item.unit_price) ? item.unit_price : 0,
      discount: Number.isFinite(item.discount) ? item.discount : 0,
    }))
    .filter((item) => item.description.length > 0)

export function useInvoiceForm({ organizationId }: UseInvoiceFormArgs): UseInvoiceFormResult {
  const router = useRouter()

  const [selectedContactId, setSelectedContactId] = useState<number | undefined>()
  const [issueDate, setIssueDate] = useState<string>(todayISO())
  const [dueDate, setDueDate] = useState<string>(todayISO())
  const [invoiceNumber, setInvoiceNumber] = useState<number>(1)
  const [paymentTerms, setPaymentTerms] = useState<string>(DEFAULT_PAYMENT_TERMS)
  const [bankRegNo, setBankRegNo] = useState<string>("")
  const [bankAccountNo, setBankAccountNo] = useState<string>("")
  const [interestRate, setInterestRate] = useState<number>(0.81)
  const [lateFee, setLateFee] = useState<number>(100)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [localContacts, setLocalContacts] = useState<Contact[]>([])

  const {
    data: contactsData = [],
    isLoading: contactsLoading,
    error: contactsError,
  } = useOrganizationContacts(organizationId)

  useEffect(() => {
    setLocalContacts(contactsData)
  }, [contactsData])

  const selectedContact = useMemo(
    () => localContacts.find((contact) => contact.id === selectedContactId),
    [localContacts, selectedContactId],
  )

  const handleContactCreated = useCallback((contact: Contact) => {
    setLocalContacts((prev) => {
      if (prev.some((existing) => existing.id === contact.id)) {
        return prev
      }
      return [...prev, contact]
    })
    setSelectedContactId(contact.id)
  }, [])

  const buildPayload = useCallback(
    (mode: SubmitMode): CreateInvoiceInput => {
      if (!organizationId) {
        throw new Error("Select an organization before creating invoices.")
      }

      if (!issueDate) {
        throw new Error("Issue date is required.")
      }

      const preparedItems = sanitizeItems(items)

      if (!preparedItems.length) {
        throw new Error("Add at least one invoice line before continuing.")
      }

      const payload: CreateInvoiceInput = {
        organization_id: organizationId,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        payment_terms: paymentTerms,
        comments: undefined,
        bank_reg_no: bankRegNo || undefined,
        bank_account_no: bankAccountNo || undefined,
        interest_rate: interestRate,
        late_fee: lateFee,
        invoice_number: invoiceNumber,
        status: mode,
        items: preparedItems,
      }

      // Explicitly include contact_id if a contact is selected
      if (selectedContactId !== undefined && selectedContactId !== null) {
        payload.contact_id = selectedContactId
      }

      return payload
    },
    [
      bankAccountNo,
      bankRegNo,
      dueDate,
      interestRate,
      invoiceNumber,
      issueDate,
      items,
      lateFee,
      organizationId,
      paymentTerms,
      selectedContactId,
    ],
  )

  const submit = useCallback(
    async (mode: SubmitMode) => {
      try {
        const payload = buildPayload(mode)
        const invoice = await createInvoice(payload)
        toast.success(mode === "draft" ? "Invoice saved as draft." : "Invoice sent successfully.")
        router.push("/dashboard/invoices")
        return invoice
      } catch (error) {
        const message =
          error instanceof Error ? error.message : mode === "draft" ? "Failed to save draft." : "Failed to send invoice."
        toast.error(message)
        throw error
      }
    },
    [buildPayload, router],
  )

  const handleSaveDraft = useCallback(() => submit("draft"), [submit])
  const handleSendInvoice = useCallback(() => submit("sent"), [submit])

  return {
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
    contacts: localContacts,
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
  }
}


