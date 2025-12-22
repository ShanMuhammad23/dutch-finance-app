"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateContact,
  useDeleteContact,
  useOrganizationContacts,
  useUpdateContact,
} from "@/lib/queries/contacts";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useActiveOrganization } from "@/context/organization-context";
import { toast } from "sonner";

type FormState = {
  contact_type: Contact["contact_type"];
  name: string;
  email: string;
  phone: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  vat_number: string;
};

const emptyFormState: FormState = {
  contact_type: "company",
  name: "",
  email: "",
  phone: "",
  address_line: "",
  postal_code: "",
  city: "",
  country: "",
  vat_number: "",
};

type ContactsViewProps = {
  className?: string;
};

export function ContactsView({ className }: ContactsViewProps) {
  const {
    organizationIdAsNumber,
    isLoading: isOrganizationLoading,
    isReady,
    activeOrganization,
  } = useActiveOrganization();
  const organizationId = organizationIdAsNumber ?? undefined;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const {
    data: contacts = [],
    isPending: isContactsLoading,
    isError,
    error,
  } = useOrganizationContacts(organizationId);

  const createContact = useCreateContact(organizationId);
  const updateContact = useUpdateContact(organizationId);
  const deleteContact = useDeleteContact(organizationId);

  const isSubmitting = createContact.isPending || updateContact.isPending;

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
    setFormState(emptyFormState);
    setFormError(null);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormState({
      contact_type: contact.contact_type,
      name: contact.name ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      address_line: contact.address_line ?? '',
      postal_code: contact.postal_code ?? '',
      city: contact.city ?? '',
      country: contact.country ?? '',
      vat_number: contact.vat_number ?? '',
    });
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!organizationId) {
      setFormError("Select an organization before creating contacts.");
      return;
    }

    if (!formState.name.trim()) {
      setFormError("Name is required");
      return;
    }

    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          id: editingContact.id,
          contact_type: formState.contact_type,
          name: formState.name.trim(),
          email: formState.email.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          address_line: formState.address_line.trim() || undefined,
          postal_code: formState.postal_code.trim() || undefined,
          city: formState.city.trim() || undefined,
          country: formState.country.trim() || undefined,
          vat_number: formState.vat_number.trim() || undefined,
        });
      } else {
        await createContact.mutateAsync({
          organization_id: organizationId,
          contact_type: formState.contact_type,
          name: formState.name.trim(),
          email: formState.email.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          address_line: formState.address_line.trim() || undefined,
          postal_code: formState.postal_code.trim() || undefined,
          city: formState.city.trim() || undefined,
          country: formState.country.trim() || "Denmark",
          vat_number: formState.vat_number.trim() || undefined,
        });
      }

      closeForm();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    if (!organizationId) {
      setFormError("Select an organization before deleting contacts.");
      return;
    }
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete || !organizationId) return;

    try {
      await deleteContact.mutateAsync(contactToDelete.id);
      toast.success("Contact deleted successfully", {
        description: `"${contactToDelete.name}" has been removed.`,
      });
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete contact. Please try again.";
      toast.error("Failed to delete contact", {
        description: message,
      });
    }
  };

  const showLoadingState = isOrganizationLoading || isContactsLoading;
  const organizationLabel =
    activeOrganization?.company_name || (isOrganizationLoading ? "Loading organization…" : "your organization");

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            {isReady
              ? `Manage people and companies tied to ${organizationLabel}.`
              : "Select an organization from the sidebar to manage its contacts."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingContact(null);
            setFormState(emptyFormState);
            setIsFormOpen((prev) => !prev);
            setFormError(null);
          }}
          disabled={!isReady}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
        >
          {isFormOpen && !editingContact ? "Close form" : "New contact"}
        </button>
      </div>

      {(isError || formError) && (
        <div className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
          {formError || error?.message || "Unable to load contacts right now."}
        </div>
      )}

      {isFormOpen && isReady && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 grid grid-cols-1 gap-4 rounded-lg border border-stroke p-4 dark:border-dark-3 lg:grid-cols-2"
        >
          <FormField label="Contact type">
            <select
              name="contact_type"
              value={formState.contact_type}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </select>
          </FormField>

          <FormField label="Name" required>
            <input
              name="name"
              type="text"
              placeholder="Acme Inc."
              value={formState.name}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </FormField>

          <FormField label="Email">
            <input
              name="email"
              type="email"
              placeholder="hello@example.com"
              value={formState.email}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="Phone">
            <input
              name="phone"
              type="tel"
              placeholder="+45 12 34 56 78"
              value={formState.phone}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="Address">
            <input
              name="address_line"
              type="text"
              placeholder="Street and number"
              value={formState.address_line}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="Postal code">
            <input
              name="postal_code"
              type="text"
              placeholder="1234"
              value={formState.postal_code}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="City">
            <input
              name="city"
              type="text"
              placeholder="Copenhagen"
              value={formState.city}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="Country">
            <input
              name="country"
              type="text"
              placeholder="Denmark"
              value={formState.country}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <FormField label="VAT number">
            <input
              name="vat_number"
              type="text"
              placeholder="DK12345678"
              value={formState.vat_number}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </FormField>

          <div className="col-span-full flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {editingContact ? "Update contact" : "Create contact"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>VAT</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {showLoadingState && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm">
                  Loading contacts…
                </TableCell>
              </TableRow>
            )}

            {!showLoadingState && !isReady && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm">
                  Select an organization to view its contacts.
                </TableCell>
              </TableRow>
            )}

            {!showLoadingState && isReady && sortedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm">
                  No contacts yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}

            {sortedContacts.map((contact) => (
              <TableRow key={contact.id} className="text-sm">
                <TableCell className="font-medium text-dark dark:text-white">
                  <div>{contact.name}</div>
                  {contact.email && (
                    <div className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                      {contact.email}
                    </div>
                  )}
                </TableCell>
                <TableCell className="capitalize">{contact.contact_type}</TableCell>
                <TableCell>{contact.email || '—'}</TableCell>
                <TableCell>{contact.phone || '—'}</TableCell>
                <TableCell>{contact.city || '—'}</TableCell>
                <TableCell>{contact.country || '—'}</TableCell>
                <TableCell>{contact.vat_number || '—'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleEdit(contact)}
                    className="rounded-md border border-stroke px-3 py-1 text-xs font-medium uppercase tracking-wide text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(contact)}
                    className="rounded-md border border-stroke px-3 py-1 text-xs font-medium uppercase tracking-wide text-red transition hover:border-red hover:bg-red/10 hover:text-red"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contactToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setContactToDelete(null);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteContact.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-red px-4 py-2 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {deleteContact.isPending ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-dark dark:text-white">
      <span>
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </span>
      {children}
    </label>
  );
}


