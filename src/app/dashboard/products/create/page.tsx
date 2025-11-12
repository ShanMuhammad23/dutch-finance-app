"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { Card } from "@/components/card";
import { Button } from "@/components/ui-elements/button";
import { useActiveOrganization } from "@/context/organization-context";
import { createProduct } from "@/lib/queries/products";
import { ProductAccountCode, CreateProductInput } from "@/lib/types";

const accountOptions: { value: ProductAccountCode; label: string }[] = [
  { value: "1000", label: "1000 · Quota" },
  { value: "1010", label: "1010 · Quota, Passive members" },
  { value: "1100", label: "1100 · Activity allowance" },
  { value: "1110", label: "1110 · Coaching allowance" },
  { value: "1120", label: "1120 · Course and training grants" },
  { value: "1130", label: "1130 · Other grants" },
  { value: "1200", label: "1200 · Sponsorship income" },
  {
    value: "1210",
    label: "1210 · Income from conventions, events, etc.",
  },
  { value: "1220", label: "1220 · Other Income" },
  { value: "1230", label: "1230 · Reminder fees" },
  { value: "9000", label: "9000 · Interest income" },
  { value: "9010", label: "9010 · Financial income, other" },
];

function parseDecimal(input: string) {
  if (!input) return 0;
  const normalized = input.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const defaultFormState = {
  name: "",
  productCode: "",
  quantity: "1,00",
  unit: "stk.",
  priceExclVat: "0,00",
  accountCode: "1000" as ProductAccountCode,
  comment: "",
};

const Page = () => {
  const {
    organizationIdAsNumber,
    activeOrganization,
    isReady,
    isLoading: isOrganizationLoading,
  } = useActiveOrganization();

  const [formState, setFormState] = useState(defaultFormState);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["products", data.organization_id],
      });
      setSubmissionError(null);
      setSubmissionSuccess("Product created successfully.");
      setFormState(defaultFormState);
    },
    onError: (error) => {
      if (error instanceof Error) {
        setSubmissionError(error.message);
        return;
      }
      setSubmissionError("Unexpected error occurred");
    },
  });

  const isPending = createProductMutation.isPending;
  const canSubmit = Boolean(
    organizationIdAsNumber && isReady && !isOrganizationLoading,
  );

  const parsedValues = useMemo(() => {
    const quantity = parseDecimal(formState.quantity);
    const price = parseDecimal(formState.priceExclVat);
    return {
      quantity,
      price,
    };
  }, [formState.quantity, formState.priceExclVat]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError(null);
    setSubmissionSuccess(null);

    if (!organizationIdAsNumber) {
      setSubmissionError("Select an organization before creating a product.");
      return;
    }

    if (!formState.name.trim()) {
      setSubmissionError("Product name is required.");
      return;
    }

    const payload: CreateProductInput = {
      organization_id: organizationIdAsNumber,
      name: formState.name.trim(),
      product_code: formState.productCode.trim() || null,
      quantity: parsedValues.quantity || 1,
      unit: formState.unit.trim() || "stk.",
      price_excl_vat: parsedValues.price,
      account_code: formState.accountCode,
      comment: formState.comment.trim() || null,
    };

    try {
      await createProductMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Create product" />

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {activeOrganization && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.08] px-4 py-3 text-sm text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary/80">
              Creating product for{" "}
              <span className="font-semibold text-dark dark:text-white">
                {activeOrganization.company_name}
              </span>
            </div>
          )}

          {!canSubmit && (
            <div className="rounded-lg border border-dashed border-[#FFA70B]/30 bg-[#FFA70B]/[0.08] px-4 py-3 text-sm text-[#8A4B00] dark:border-[#FFA70B]/40 dark:bg-[#FFA70B]/10 dark:text-[#FFD8A3]">
              Select an organization to enable product creation.
            </div>
          )}
        </div>

        {submissionError && (
          <div className="rounded-lg border border-[#D34053]/30 bg-[#D34053]/[0.12] px-4 py-3 text-sm text-[#7A1524] dark:border-[#D34053]/40 dark:bg-[#D34053]/20 dark:text-[#F2B8C4]">
            {submissionError}
          </div>
        )}

        {submissionSuccess && (
          <div className="rounded-lg border border-[#219653]/30 bg-[#219653]/[0.12] px-4 py-3 text-sm text-[#124127] dark:border-[#219653]/40 dark:bg-[#219653]/20 dark:text-[#B8E1C7]">
            {submissionSuccess}
          </div>
        )}

        <Card className="space-y-6 p-5 sm:p-6 lg:p-8">
          <header className="space-y-1">
            <h3 className="text-xl font-semibold text-dark dark:text-white">
              Product details
            </h3>
            <p className="text-body-sm text-gray-600 dark:text-gray-4">
              Add the product information, pricing, and account mapping.
            </p>
          </header>

          <section className="grid gap-5 md:grid-cols-2">
            <InputGroup
              label="Name"
              placeholder="Product name"
              type="text"
              required
              value={formState.name}
              handleChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />

            <InputGroup
              label="Product code"
              placeholder="Product code (optional)"
              type="text"
              value={formState.productCode}
              handleChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  productCode: event.target.value,
                }))
              }
            />

            <InputGroup
              label="Number"
              placeholder="1,00"
              type="text"
              value={formState.quantity}
              handleChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  quantity: event.target.value,
                }))
              }
            />

            <InputGroup
              label="Unit"
              placeholder="stk."
              type="text"
              value={formState.unit}
              handleChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  unit: event.target.value,
                }))
              }
            />

            <InputGroup
              label="Price excluding VAT"
              placeholder="0,00"
              type="text"
              required
              value={formState.priceExclVat}
              handleChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  priceExclVat: event.target.value,
                }))
              }
            />

            <Select
              label="Account"
              items={accountOptions}
              value={formState.accountCode}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  accountCode: value as ProductAccountCode,
                }))
              }
            />
          </section>

          <TextAreaGroup
            label="Comment on the product"
            placeholder="Add any internal notes or context"
            value={formState.comment}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                comment: event.target.value,
              }))
            }
            rows={5}
          />
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            label="Reset"
            variant="outlineDark"
            disabled={isPending}
            onClick={() => {
              setFormState(defaultFormState);
              setSubmissionError(null);
              setSubmissionSuccess(null);
            }}
          />
          <Button
            type="submit"
            label={isPending ? "Saving..." : "Create product"}
            variant="primary"
            disabled={!canSubmit || isPending}
          />
        </div>
      </form>
    </div>
  );
};

export default Page;


