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
import { useOrganizationProducts } from "@/lib/queries/products";
import { Button } from "@/components/ui-elements/button";

function formatCurrency(value: number, currency: string = "DKK") {
  try {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="border-[#eee] dark:border-dark-3">
          <TableCell className="min-w-[140px] xl:pl-7.5">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-24 ml-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-28 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

const ProductsTable = () => {
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
  } = useOrganizationProducts(organizationIdAsNumber ?? undefined);

  const products = data ?? [];
  const showSkeleton = isOrganizationLoading || !isReady || isLoading || isFetching;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">Product code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Price (excl. VAT)</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Account code</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton && <SkeletonRows />}

          {!showSkeleton && isError && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={6} className="py-10 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-slate-600 dark:text-white/70">
                  <p>We couldn&apos;t load the products for this organization.</p>
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

          {!showSkeleton && !isError && products.length === 0 && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={6} className="py-12 text-center">
                <div className="mx-auto max-w-lg space-y-2 text-sm text-slate-600 dark:text-white/70">
                  <p className="font-medium text-dark dark:text-white">
                    No products found
                  </p>
                  <p>
                    {activeOrganization
                      ? `Products for ${activeOrganization.company_name} will appear here once you create them.`
                      : "Select an organization to see its products."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton &&
            !isError &&
            products.map((product) => (
              <TableRow key={product.id} className="border-[#eee] dark:border-dark-3">
                <TableCell className="min-w-[140px] font-medium text-dark dark:text-white xl:pl-7.5">
                  {product.product_code || `PRD-${product.id.toString().padStart(4, "0")}`}
                </TableCell>
                <TableCell className="text-dark dark:text-white">{product.name}</TableCell>
                <TableCell className="text-body-sm text-neutral-500 dark:text-neutral-400">
                  {product.unit || "—"}
                </TableCell>
                <TableCell className="text-right text-dark dark:text-white">
                  {formatCurrency(product.price_excl_vat, "DKK")}
                </TableCell>
                <TableCell className="text-right text-dark dark:text-white">
                  {product.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-dark dark:text-white">
                  {product.account_code || "—"}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
