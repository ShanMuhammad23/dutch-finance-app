'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card } from "@/components/card";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { RadioInput } from "@/components/FormElements/radio";
import { Select } from "@/components/FormElements/select";
import { Button } from "@/components/ui-elements/button";
import { useActiveOrganization } from "@/context/organization-context";
import { createPurchase } from "@/lib/queries/purchases";
import { CreatePurchaseInput } from "@/lib/types";
import {
  BadgeCheckIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

const inventoryOptions = [
  { value: "none", label: "No inventory impact" },
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software licenses" },
  { value: "office", label: "Office supplies" },
];

const accountOptions = [
  { value: "operating", label: "5500 · Operating expenses" },
  { value: "marketing", label: "6100 · Marketing & promotion" },
  { value: "utilities", label: "6400 · Utilities" },
  { value: "custom", label: "Create custom account…" },
];

const purchaseTypes = [
  {
    value: "cash",
    label: "The purchase is paid for immediately (cash purchase)",
    helper:
      "Register this as a cash or card payment and the amount will post to your bank or petty cash account right away.",
  },
  {
    value: "credit",
    label: "The purchase is paid for later (credit purchase)",
    helper:
      "Track this as a liability until you settle the supplier invoice at a later date.",
  },
];

type PaymentType = "cash" | "credit";

type LineItem = {
  id: string;
  lineNo: number;
  description: string;
  amountInclVat: string;
  vatAmount: string;
  accountCode: string;
  inventoryCategory: string;
};

const generateLineId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `line-${Math.random().toString(36).slice(2, 11)}`;
};

const createEmptyLine = (lineNo: number): LineItem => ({
  id: generateLineId(),
  lineNo,
  description: "",
  amountInclVat: "",
  vatAmount: "",
  accountCode: "",
  inventoryCategory: "",
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("da-DK", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const parseCurrency = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Page = () => {
  const {
    organizationIdAsNumber,
    activeOrganization,
    isReady,
    isLoading: isOrganizationLoading,
  } = useActiveOrganization();

  const [formState, setFormState] = useState({
    attachmentDate: "",
    supplierName: "",
    inventory: "",
    account: "",
    amountInclVat: "0,00",
    vatAmount: "0,00",
    description: "",
    paymentType: "cash" as PaymentType,
  });
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine(1)]);
  const [submissionIntent, setSubmissionIntent] = useState<"draft" | "approved">(
    "draft",
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAnotherRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["purchases", variables.organization_id],
      });

      toast.success(
        variables.status === "approved"
          ? "Purchase approved successfully"
          : "Purchase saved as draft",
      );

      setLines([createEmptyLine(1)]);
      setFormState((prev) => ({
        ...prev,
        supplierName: "",
        attachmentDate: "",
        description: "",
        inventory: "",
        account: "",
        amountInclVat: "0,00",
        vatAmount: "0,00",
      }));
      setSubmissionIntent("draft");
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setAttachmentPath(null);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
    },
  });

  const isPending = createPurchaseMutation.isPending;
  const canSubmit = Boolean(organizationIdAsNumber && isReady && !isOrganizationLoading);

  const totals = useMemo(() => {
    const total = lines.reduce(
      (acc, line) => acc + parseCurrency(line.amountInclVat),
      0,
    );
    const vat = lines.reduce(
      (acc, line) => acc + parseCurrency(line.vatAmount),
      0,
    );

    return {
      total,
      vat,
      subtotal: Math.max(total - vat, 0),
      formattedTotal: formatCurrency(total),
      formattedVat: formatCurrency(vat),
      formattedSubtotal: formatCurrency(Math.max(total - vat, 0)),
    };
  }, [lines]);

  useEffect(() => {
    const formattedTotal = totals.formattedTotal.replace(".", ",");
    const formattedVat = totals.formattedVat.replace(".", ",");

    setFormState((prev) => {
      if (
        prev.amountInclVat === formattedTotal &&
        prev.vatAmount === formattedVat
      ) {
        return prev;
      }

      return {
        ...prev,
        amountInclVat: formattedTotal,
        vatAmount: formattedVat,
      };
    });
  }, [totals]);

  const handleFormFieldChange = (
    field: keyof typeof formState,
    value: string | PaymentType,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddLine = () => {
    setLines((prev) => {
      const nextLineNo = prev.length + 1;
      return [...prev, createEmptyLine(nextLineNo)];
    });
  };

  const handleRemoveLine = (lineId: string) => {
    setLines((prev) => {
      const filtered = prev.filter((line) => line.id !== lineId);
      return filtered.map((line, index) => ({
        ...line,
        lineNo: index + 1,
      }));
    });
  };

  const handleLineChange = (
    lineId: string,
    field: keyof Omit<LineItem, "id" | "lineNo">,
    value: string,
  ) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only images (JPG, PNG, GIF, WEBP) are allowed.");
      return;
    }

    // Validate file size (20 MB max)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 20 MB limit.");
      return;
    }

    setAttachmentFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setAttachmentPath(null);
  };

  const uploadAttachment = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/purchases/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to upload attachment");
    }

    const data = await response.json();
    return data.filePath;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationIdAsNumber) {
      toast.error("Please select an organization before creating a purchase");
      return;
    }

    try {
      // Upload attachment if a file is selected
      let uploadedFilePath = attachmentPath;
      if (attachmentFile && !attachmentPath) {
        setIsUploading(true);
        try {
          uploadedFilePath = await uploadAttachment(attachmentFile);
          setAttachmentPath(uploadedFilePath);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to upload attachment";
          toast.error(errorMessage);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const payload: CreatePurchaseInput = {
        organization_id: organizationIdAsNumber,
        supplier_name: formState.supplierName,
        payment_type: formState.paymentType,
        attachment_date: formState.attachmentDate,
        inventory_category:
          formState.inventory === "none" ? null : formState.inventory,
        account_code:
          formState.account === "custom" ? null : formState.account || null,
        amount_incl_vat: totals.total,
        vat_amount: totals.vat,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        description: formState.description,
        status: submissionIntent,
        attachment_file: uploadedFilePath,
        attachment_name: attachmentFile?.name || null,
        lines: lines.map((line) => ({
          line_no: line.lineNo,
          description: line.description,
          amount_incl_vat: parseCurrency(line.amountInclVat),
          vat_amount: parseCurrency(line.vatAmount),
          account_code:
            line.accountCode === "custom" ? null : line.accountCode || null,
          inventory_category:
            line.inventoryCategory === "none"
              ? null
              : line.inventoryCategory || null,
        })),
      };

      await createPurchaseMutation.mutateAsync(payload);
    } catch (error) {
      // Error is already handled in onError callback
      console.error("Failed to create purchase:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Create purchase" />

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {activeOrganization && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.08] px-4 py-3 text-sm text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary/80">
              Creating purchase for{" "}
              <span className="font-semibold text-dark dark:text-white">
                {activeOrganization.company_name}
              </span>
            </div>
          )}

          {!canSubmit && (
            <div className="rounded-lg border border-dashed border-[#FFA70B]/30 bg-[#FFA70B]/[0.08] px-4 py-3 text-sm text-[#8A4B00] dark:border-[#FFA70B]/40 dark:bg-[#FFA70B]/10 dark:text-[#FFD8A3]">
              Select an organization to enable purchase creation.
            </div>
          )}
        </div>

        <Card className="space-y-8 p-5 sm:p-6 lg:p-8">
          <header className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-dark dark:text-white">
                New purchase
              </h3>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                Capture the supplier details, payment timing, and how the amount
                should be booked.
              </p>
            </div>

            <Button
              label="Create note (0)"
              icon={<PlusIcon className="size-4" />}
              variant="outlinePrimary"
              size="small"
              type="button"
            />
          </header>

          <section className="grid gap-6">
            {!attachmentPreview ? (
              <div className="rounded-xl border border-dashed border-gray-4 bg-gray-2/60 px-6 py-8 text-center dark:border-dark-3 dark:bg-dark-2/50">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
                  <UploadIcon className="size-6 text-primary" />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-medium text-dark dark:text-white">
                    Attach file
                  </p>
                  <p className="text-body-sm text-gray-600 dark:text-gray-4">
                    Upload a new voucher. JPG, PNG, GIF, WEBP up to 20 MB.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    label="Upload file"
                    size="small"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={attachmentPreview}
                      alt="Attachment preview"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark dark:text-white truncate">
                      {attachmentFile?.name}
                    </p>
                    <p className="text-body-sm text-gray-600 dark:text-gray-4 mt-1">
                      {attachmentFile
                        ? `${(attachmentFile.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </p>
                  </div>
                  <Button
                    label="Remove"
                    variant="outlineDark"
                    size="small"
                    type="button"
                    icon={<XIcon className="size-4" />}
                    onClick={handleRemoveAttachment}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-dark dark:text-white">
              Payment timing
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {purchaseTypes.map((type) => (
                <div
                  key={type.value}
                  className="rounded-lg border border-stroke bg-white p-5 shadow-sm transition hover:border-primary/60 dark:border-dark-3 dark:bg-gray-dark"
                >
                  <RadioInput
                    label={type.label}
                    name="paymentTiming"
                    value={type.value}
                    minimal
                    checked={formState.paymentType === type.value}
                    onChange={(value) =>
                      handleFormFieldChange(
                        "paymentType",
                        value as PaymentType,
                      )
                    }
                  />
                  <p className="mt-2 pl-7 text-body-sm text-gray-600 dark:text-gray-4">
                    {type.helper}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <InputGroup
              label="Attachment date"
              type="date"
              placeholder="Select date"
              required
              value={formState.attachmentDate}
              handleChange={(event) =>
                handleFormFieldChange("attachmentDate", event.target.value)
              }
            />
            <InputGroup
              label="Purchased from"
              type="text"
              placeholder="Enter supplier name"
              required
              value={formState.supplierName}
              handleChange={(event) =>
                handleFormFieldChange("supplierName", event.target.value)
              }
            />
            <Select
              label="Inventory"
              placeholder="Select inventory"
              items={inventoryOptions}
              value={formState.inventory}
              onValueChange={(value) =>
                handleFormFieldChange("inventory", value)
              }
            />
            <InputGroup
              label="Amount incl. VAT"
              type="text"
              placeholder="0,00"
              required
              value={formState.amountInclVat}
              handleChange={(event) =>
                handleFormFieldChange("amountInclVat", event.target.value)
              }
            />
            <InputGroup
              label="VAT"
              type="text"
              placeholder="0,00"
              value={formState.vatAmount}
              handleChange={(event) =>
                handleFormFieldChange("vatAmount", event.target.value)
              }
            />
            <Select
              label="Account"
              placeholder="Select account"
              items={accountOptions}
              value={formState.account}
              onValueChange={(value) => handleFormFieldChange("account", value)}
            />
          </section>

          <section className="space-y-5">
            {lines.map((line) => (
              <Card
                key={line.id}
                className="space-y-5 border border-stroke p-5 dark:border-dark-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BadgeCheckIcon className="size-5 text-primary" />
                    <p className="font-semibold text-dark dark:text-white">
                      Line No. {line.lineNo}
                    </p>
                  </div>
                  {lines.length > 1 && (
                    <Button
                      label="Remove"
                      variant="outlineDark"
                      size="small"
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                    />
                  )}
                </div>

                <TextAreaGroup
                  label='Describe what you bought – e.g. "grocery purchase", "flowers"'
                  placeholder="Write your own text if necessary."
                  value={line.description}
                  onChange={(event) =>
                    handleLineChange(line.id, "description", event.target.value)
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <InputGroup
                    label="Amount incl. VAT"
                    type="text"
                    placeholder="0,00"
                    value={line.amountInclVat}
                    handleChange={(event) =>
                      handleLineChange(
                        line.id,
                        "amountInclVat",
                        event.target.value,
                      )
                    }
                  />
                  <InputGroup
                    label="VAT amount"
                    type="text"
                    placeholder="0,00"
                    value={line.vatAmount}
                    handleChange={(event) =>
                      handleLineChange(
                        line.id,
                        "vatAmount",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label="Inventory"
                    placeholder="Select inventory"
                    items={inventoryOptions}
                    value={line.inventoryCategory}
                    onValueChange={(value) =>
                      handleLineChange(line.id, "inventoryCategory", value)
                    }
                  />
                  <Select
                    label="Account"
                    placeholder="Select account"
                    items={accountOptions}
                    value={line.accountCode}
                    onValueChange={(value) =>
                      handleLineChange(line.id, "accountCode", value)
                    }
                  />
                </div>
              </Card>
            ))}

            <Button
              label="Create new line"
              icon={<PlusIcon className="size-4" />}
              variant="outlineDark"
              size="small"
              type="button"
              onClick={handleAddLine}
            />
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-stroke bg-gray-2/40 p-5 dark:border-dark-3 dark:bg-dark-2/40">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between text-body-sm text-dark dark:text-gray-3">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark dark:text-white">
                    {totals.formattedSubtotal} DKK
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-dark dark:text-gray-3">
                  <span>Total DKK</span>
                  <span className="text-lg font-semibold text-primary">
                    {totals.formattedTotal}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                label={isPending || isUploading ? "Saving..." : "Save draft"}
                variant="outlineDark"
                size="small"
                type="submit"
                icon={
                  isPending || isUploading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <FileTextIcon className="size-4" />
                  )
                }
                disabled={isPending || isUploading || !canSubmit}
                onClick={() => setSubmissionIntent("draft")}
              />
              <Button
                label={isPending || isUploading ? "Approving..." : "Approve"}
                size="small"
                type="submit"
                icon={
                  isPending || isUploading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : undefined
                }
                disabled={isPending || isUploading || !canSubmit}
                onClick={() => setSubmissionIntent("approved")}
              />
            </div>
          </section>
        </Card>

        <div className="grid gap-6">
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-dark dark:text-white">
                Attachments
              </h4>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                Keep a tidy audit trail by linking all supporting documents to
                the purchase. You can always return later to add more files.
              </p>
            </div>
            <Button
              label="Attach another file"
              variant="outlineDark"
              size="small"
              icon={<UploadIcon className="size-4" />}
              type="button"
              onClick={() => fileInputAnotherRef.current?.click()}
            />
            <input
              ref={fileInputAnotherRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </Card>
        </div>
      </form>
    </div>
  );
};

export default Page;
