"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui-elements/button";
import { useActiveOrganization } from "@/context/organization-context";
import { useOrganizationPurchases } from "@/lib/queries/purchases";
import { cn } from "@/lib/utils";

function formatCurrency(value: number, currency: string = "DKK") {
  try {
    return new Intl.NumberFormat("en-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("MMM DD, YYYY") : value;
}

const paymentTypeStyles: Record<
  "cash" | "credit",
  { label: string; className: string }
> = {
  cash: {
    label: "Cash",
    className: "bg-[#219653]/[0.08] text-[#219653]",
  },
  credit: {
    label: "Credit",
    className: "bg-[#FFA70B]/[0.08] text-[#FFA70B]",
  },
};

const statusStyles: Record<
  "draft" | "approved",
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 dark:bg-dark-3 dark:text-white/70",
  },
  approved: {
    label: "Approved",
    className: "bg-[#2563EB]/[0.1] text-[#2563EB]",
  },
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} className="border-[#eee] dark:border-dark-3">
          <TableCell className="min-w-[120px] xl:pl-7.5">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="xl:pr-7.5">
            <Skeleton className="h-6 w-24 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function PurchasesTable() {
  const {
    organizationIdAsNumber,
    isReady,
    isLoading: isOrganizationLoading,
    activeOrganization,
  } = useActiveOrganization();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrganizationPurchases(organizationIdAsNumber ?? undefined);

  const purchases = data ?? [];
  const showSkeleton = isOrganizationLoading || !isReady || isLoading || isFetching;
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <>
      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Attachment preview"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[120px] xl:pl-7.5">#</TableHead>
            <TableHead>Attachment Date</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Attachment</TableHead>
            <TableHead>Payment Type</TableHead>
            <TableHead>Total (incl. VAT)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton && <SkeletonRows />}

          {!showSkeleton && isError && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-10 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-slate-600 dark:text-white/70">
                  <p>We couldn&apos;t load the purchases for this organization.</p>
                  {error instanceof Error && (
                    <p className="text-xs text-[#D34053]">{error.message}</p>
                  )}
                  <Button
                    label="Try again"
                    size="small"
                    variant="outlineDark"
                    onClick={() => refetch()}
                  />
                </div>
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton && !isError && purchases.length === 0 && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-12 text-center">
                <div className="mx-auto max-w-lg space-y-2 text-sm text-slate-600 dark:text-white/70">
                  <p className="font-medium text-dark dark:text-white">
                    No purchases found
                  </p>
                  <p>
                    {activeOrganization
                      ? `Purchases for ${activeOrganization.company_name} will appear here once you create them.`
                      : "Select an organization to see its purchases."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton &&
            !isError &&
            purchases.map((purchase) => {
              const paymentTypeMeta = paymentTypeStyles[purchase.payment_type];
              const statusMeta = statusStyles[purchase.status];

              return (
                <TableRow
                  key={purchase.id}
                  className="border-[#eee] dark:border-dark-3"
                >
                  <TableCell className="min-w-[120px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white">
                      {purchase.id.toString().padStart(4, "0")}
                    </h5>
                  </TableCell>

                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {formatDate(purchase.attachment_date)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="text-body-sm font-medium">{purchase.supplier_name}</p>
                    {purchase.description && (
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {purchase.description}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    {purchase.attachment_url ? (
                      <button
                        onClick={() => setPreviewImage(purchase.attachment_url!)}
                        className="group relative flex items-center justify-center overflow-hidden rounded-lg border border-stroke bg-gray-50 transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                        aria-label={`View attachment: ${purchase.attachment_name || "attachment"}`}
                      >
                        <Image
                          src={purchase.attachment_url}
                          alt={purchase.attachment_name || "Purchase attachment"}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover transition group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                      </button>
                    ) : (
                      <span className="text-body-sm text-slate-400 dark:text-white/40">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div
                      className={cn(
                        "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium capitalize",
                        paymentTypeMeta.className,
                      )}
                    >
                      {paymentTypeMeta.label}
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="text-body-sm font-medium">
                      {formatCurrency(purchase.amount_incl_vat)}
                    </p>
                  </TableCell>

                  <TableCell className="xl:pr-7.5">
                    <div
                      className={cn(
                        "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium capitalize",
                        statusMeta.className,
                      )}
                    >
                      {statusMeta.label}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
    </>
  );
}

