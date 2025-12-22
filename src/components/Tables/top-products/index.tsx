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
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} className="text-base font-medium text-dark dark:text-white">
          <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="pr-5 text-right sm:pr-6 xl:pr-7.5">
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function TopProducts() {
  const {
    organizationIdAsNumber,
    isReady,
    isLoading: isOrganizationLoading,
  } = useActiveOrganization();

  const {
    data,
    isLoading,
    isFetching,
  } = useOrganizationProducts(organizationIdAsNumber ?? undefined);

  const products = data ?? [];
  const showSkeleton = isOrganizationLoading || !isReady || isLoading || isFetching;
  
  // Show top 4 products (or all if less than 4)
  const topProducts = products.slice(0, 4);

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="px-6 py-4 sm:px-7 sm:py-5 xl:px-8.5">
        <h2 className="text-2xl font-bold text-dark dark:text-white">
          Top Products
        </h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-t text-base [&>th]:h-auto [&>th]:py-3 sm:[&>th]:py-4.5">
            <TableHead className="min-w-[120px] pl-5 sm:pl-6 xl:pl-7.5">
              Product Name
            </TableHead>
            <TableHead>Account Code</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="pr-5 text-right sm:pr-6 xl:pr-7.5">
              Total Value
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton && <SkeletonRows />}

          {!showSkeleton && topProducts.length === 0 && (
            <TableRow className="text-base font-medium text-dark dark:text-white">
              <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-600 dark:text-white/70">
                No products found
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton &&
            topProducts.map((product) => {
              const totalValue = product.price_excl_vat * product.quantity;
              return (
                <TableRow
                  className="text-base font-medium text-dark dark:text-white"
                  key={product.id}
                >
                  <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
                    <div>{product.name}</div>
                  </TableCell>

                  <TableCell>{product.account_code || "—"}</TableCell>

                  <TableCell>{formatCurrency(product.price_excl_vat, "DKK")}</TableCell>

                  <TableCell>{product.quantity}</TableCell>

                  <TableCell className="pr-5 text-right text-green-light-1 sm:pr-6 xl:pr-7.5">
                    {formatCurrency(totalValue, "DKK")}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
