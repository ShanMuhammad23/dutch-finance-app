"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrganization } from "@/context/organization-context";
import { useOrganizationInvoices } from "@/lib/queries/invoices";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-elements/button";
import dayjs from "dayjs";

function formatCurrency(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)}${currency ? ` ${currency}` : ""}`;
  }
}

function getDueDateStyle(dueDate?: string | null) {
  if (!dueDate) {
    return {
      label: "No due date",
      className: "bg-slate-100 text-slate-600 dark:bg-dark-3 dark:text-white/70",
    };
  }

  const due = dayjs(dueDate);
  if (!due.isValid()) {
    return {
      label: dueDate,
      className: "bg-slate-100 text-slate-600 dark:bg-dark-3 dark:text-white/70",
    };
  }

  const today = dayjs();
  if (due.isBefore(today, "day")) {
    return {
      label: due.format("MMM DD, YYYY"),
      className: "bg-[#D34053]/[0.08] text-[#D34053]",
    };
  }

  if (due.isSame(today, "day")) {
    return {
      label: due.format("MMM DD, YYYY"),
      className: "bg-[#FFA70B]/[0.08] text-[#FFA70B]",
    };
  }

  return {
    label: due.format("MMM DD, YYYY"),
    className: "bg-[#219653]/[0.08] text-[#219653]",
  };
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} className="border-[#eee] dark:border-dark-3">
          <TableCell className="min-w-[155px] xl:pl-7.5">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-32 rounded-full" />
          </TableCell>
          <TableCell className="xl:pr-7.5">
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell className="xl:pr-7.5">
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell className="xl:pr-7.5">
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function InvoiceTable() {
  const { organizationIdAsNumber, isReady, isLoading: isOrganizationLoading, activeOrganization } =
    useActiveOrganization();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrganizationInvoices(organizationIdAsNumber ?? undefined);

  const invoices = data ?? [];
  const showSkeleton = isOrganizationLoading || !isReady || isLoading || isFetching;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[155px] xl:pl-7.5">#</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton && <SkeletonRows />}

          {!showSkeleton && isError && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={6} className="py-10 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-slate-600 dark:text-white/70">
                  <p>We couldn&apos;t load the invoices for this organization.</p>
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

          {!showSkeleton && !isError && invoices.length === 0 && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={6} className="py-12 text-center">
                <div className="mx-auto max-w-lg space-y-2 text-sm text-slate-600 dark:text-white/70">
                  <p className="font-medium text-dark dark:text-white">
                    No invoices found
                  </p>
                  <p>
                    {activeOrganization
                      ? `Invoices for ${activeOrganization.company_name} will appear here once you create them.`
                      : "Select an organization to see its invoices."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton &&
            !isError &&
            invoices.map((invoice) => {
              const dueDateMeta = getDueDateStyle(invoice.due_date);
              const issueDate = invoice.issue_date
                ? dayjs(invoice.issue_date).format("MMM DD, YYYY")
                : "—";
              const description =
                invoice.items?.find((item) => item.description)?.description ??
                invoice.comments ??
                "—";
              const customer = invoice.contact?.name ?? "—";
              const formattedTotal = formatCurrency(invoice.total_amount ?? 0, invoice.currency);

              return (
                <TableRow key={invoice.id} className="border-[#eee] dark:border-dark-3">
                  <TableCell className="min-w-[155px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white">
                      {invoice.invoice_number ?? invoice.id}
                    </h5>
                  </TableCell>

                  <TableCell>
                    <p className="text-dark dark:text-white">{issueDate}</p>
                  </TableCell>

                  <TableCell>
                    <div
                      className={cn(
                        "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                        dueDateMeta.className,
                      )}
                    >
                      {dueDateMeta.label}
                    </div>
                  </TableCell>

                  <TableCell className="xl:pr-7.5">
                    <p className="mt-[3px] text-body-sm font-medium">{description}</p>
                  </TableCell>

                  <TableCell className="xl:pr-7.5">
                    <p className="mt-[3px] text-body-sm font-medium">{customer}</p>
                  </TableCell>

                  <TableCell className="xl:pr-7.5">
                    <p className="mt-[3px] text-body-sm font-medium">{formattedTotal}</p>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
