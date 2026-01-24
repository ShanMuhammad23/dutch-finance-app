"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useOrganizationProducts, deleteProduct } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ProductAccountCode } from "@/lib/types";

interface ProductsTableProps {
  filterName?: string;
  filterAccountCode?: ProductAccountCode | "";
}

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

const ProductsTable = ({ filterName = "", filterAccountCode = "" }: ProductsTableProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);

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

  const allProducts = data ?? [];
  
  // Apply filters
  let products = allProducts;
  if (filterName) {
    products = products.filter((p) =>
      p.name.toLowerCase().includes(filterName.toLowerCase())
    );
  }
  if (filterAccountCode) {
    products = products.filter((p) => p.account_code === filterAccountCode);
  }

  const showSkeleton = isOrganizationLoading || !isReady || isLoading || isFetching;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", organizationIdAsNumber] });
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  const handleEdit = (productId: number) => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  const handleDeleteClick = (product: { id: number; name: string }) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton && <SkeletonRows />}

          {!showSkeleton && isError && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-10 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-slate-600 dark:text-white/70">
                  <p>We couldn&apos;t load the products for this organization.</p>
                  {error instanceof Error && (
                    <p className="text-xs text-[#D34053]">{error.message}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                  >
                    Try again
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!showSkeleton && !isError && products.length === 0 && (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-12 text-center">
                <div className="mx-auto max-w-lg space-y-2 text-sm text-slate-600 dark:text-white/70">
                  <p className="font-medium text-dark dark:text-white">
                    {filterName || filterAccountCode
                      ? "No products match the current filters"
                      : "No products found"}
                  </p>
                  <p>
                    {filterName || filterAccountCode
                      ? "Try adjusting your filters or click 'All' to clear them."
                      : activeOrganization
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product.id)}
                      className="h-8 w-8"
                      title="Edit product"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick({ id: product.id, name: product.name })}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete product"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsTable;
