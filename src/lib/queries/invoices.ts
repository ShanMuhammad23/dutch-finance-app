'use client'

import { useQuery } from '@tanstack/react-query'
import { Invoice, CreateInvoiceInput, Contact, CreateContactInput } from '@/lib/types'
import { calculateInvoiceTotals, calculateLineTotal } from '@/lib/invoice-utils'

async function fetchOrganizationInvoices(organizationId: number): Promise<Invoice[]> {
  const response = await fetch(`/api/invoices?organizationId=${organizationId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch invoices');
  }

  return response.json();
}

export function useOrganizationInvoices(organizationId?: number) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      return fetchOrganizationInvoices(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch all invoices for an organization
export async function getOrganizationInvoices(organizationId: number): Promise<Invoice[]> {
  return fetchOrganizationInvoices(organizationId);
}

// Get single invoice by ID
export async function getInvoice(invoiceId: number): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${invoiceId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch invoice');
  }
  
  return response.json();
}

// Create a new invoice
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create invoice');
  }
  
  return response.json();
}

// Update invoice
export async function updateInvoice(
  invoiceId: number,
  updates: Partial<CreateInvoiceInput>
): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${invoiceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update invoice');
  }
  
  return response.json();
}

// Delete invoice
export async function deleteInvoice(invoiceId: number): Promise<boolean> {
  const response = await fetch(`/api/invoices/${invoiceId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete invoice');
  }
  
  return true;
}

// Fetch all contacts for an organization
export async function getOrganizationContacts(organizationId: number): Promise<Contact[]> {
  const response = await fetch(`/api/contacts?organizationId=${organizationId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contacts');
  }
  
  return response.json();
}

// Create a new contact
export async function createContact(input: CreateContactInput): Promise<Contact> {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create contact');
  }
  
  return response.json();
}

// Get single contact by ID
export async function getContact(contactId: number): Promise<Contact> {
  const response = await fetch(`/api/contacts/${contactId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contact');
  }
  
  return response.json();
}

// Update contact
export async function updateContact(
  contactId: number,
  updates: Partial<CreateContactInput>
): Promise<Contact> {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update contact');
  }
  
  return response.json();
}

// Delete contact
export async function deleteContact(contactId: number): Promise<boolean> {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete contact');
  }
  
  return true;
}

// Utility function to calculate line total
export { calculateLineTotal, calculateInvoiceTotals }
