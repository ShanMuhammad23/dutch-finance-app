"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { Card } from "@/components/card";
import { Button } from "@/components/ui-elements/button";
import { useActiveOrganization } from "@/context/organization-context";
import { updateProduct } from "@/lib/queries/products";
import { ProductAccountCode } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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

function parseDecimal(input: string | undefined) {
  if (!input) return 0;
  const normalized = input.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const {
    organizationIdAsNumber,
    activeOrganization,
    isReady,
    isLoading: isOrganizationLoading,
  } = useActiveOrganization();

  const [formState, setFormState] = useState({
    name: "",
    productCode: "",
    quantity: "1,00",
    unit: "stk.",
    priceExclVat: "0,00",
    accountCode: "1000" as ProductAccountCode,
    comment: "",
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
    enabled: !!productId && !Number.isNaN(productId),
  });

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      setFormState({
        name: product.name || "",
        productCode: product.product_code || "",
        quantity: formatDecimal(product.quantity || 1),
        unit: product.unit || "stk.",
        priceExclVat: formatDecimal(product.price_excl_vat || 0),
        accountCode: product.account_code || "1000",
        comment: product.comment || "",
      });
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: (data: Partial<typeof formState>) =>
      updateProduct(productId, {
        name: data.name,
        product_code: data.productCode || null,
        quantity: parseDecimal(data.quantity),
        unit: data.unit,
        price_excl_vat: parseDecimal(data.priceExclVat),
        account_code: data.accountCode,
        comment: data.comment || null,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["products", data.organization_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", productId],
      });
      setSubmissionError(null);
      setSubmissionSuccess("Product updated successfully.");
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1500);
    },
    onError: (error) => {
      if (error instanceof Error) {
        setSubmissionError(error.message);
        return;
      }
      setSubmissionError("Unexpected error occurred");
    },
  });

  const isPending = updateProductMutation.isPending;
  const canSubmit = Boolean(
    organizationIdAsNumber && isReady && !isOrganizationLoading && product,
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
      setSubmissionError("Select an organization before updating a product.");
      return;
    }

    if (!formState.name.trim()) {
      setSubmissionError("Product name is required.");
      return;
    }

    try {
      await updateProductMutation.mutateAsync(formState);
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Edit product" />
        <Card className="p-5 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Edit product" />
        <Card className="p-5 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <p className="text-dark dark:text-white">Product not found</p>
            <Button
              type="button"
              label="Back to products"
              variant="outlineDark"
              onClick={() => router.push("/dashboard/products")}
              className="mt-4"
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Edit product" />

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {activeOrganization && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.08] px-4 py-3 text-sm text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary/80">
              Editing product for{" "}
              <span className="font-semibold text-dark dark:text-white">
                {activeOrganization.company_name}
              </span>
            </div>
          )}

          {!canSubmit && (
            <div className="rounded-lg border border-dashed border-[#FFA70B]/30 bg-[#FFA70B]/[0.08] px-4 py-3 text-sm text-[#8A4B00] dark:border-[#FFA70B]/40 dark:bg-[#FFA70B]/10 dark:text-[#FFD8A3]">
              Select an organization to enable product editing.
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
              Update the product information, pricing, and account mapping.
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
            label="Cancel"
            variant="outlineDark"
            disabled={isPending}
            onClick={() => router.push("/dashboard/products")}
          />
          <Button
            type="submit"
            label={isPending ? "Saving..." : "Update product"}
            variant="primary"
            disabled={!canSubmit || isPending}
          />
        </div>
      </form>
    </div>
  );
};

export default Page;

