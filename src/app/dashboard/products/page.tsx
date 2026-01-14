"use client";

import { useState, useRef } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card } from "@/components/card";
import ProductsTable from "@/components/products/ProductsTable";
import { Button } from "@/components/ui-elements/button";
import {
  DownloadIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useActiveOrganization } from "@/context/organization-context";
import { useOrganizationProducts, createProduct } from "@/lib/queries/products";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Product, CreateProductInput, ProductAccountCode } from "@/lib/types";

const page = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterAccountCode, setFilterAccountCode] = useState<ProductAccountCode | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    organizationIdAsNumber,
    isReady,
  } = useActiveOrganization();

  const { data: products = [], isLoading: isLoadingProducts } = useOrganizationProducts(organizationIdAsNumber ?? undefined);

  const handleFilterClick = () => {
    setShowFilter(!showFilter);
  };

  const handleAllClick = () => {
    setFilterName("");
    setFilterAccountCode("");
    setShowFilter(false);
    toast.success("Filters cleared");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    if (!organizationIdAsNumber) {
      toast.error("Please select an organization first");
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must have at least a header row and one data row");
        return;
      }

      // Parse CSV line handling quoted values
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim()); // Add last field
        return result;
      };

      const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
      
      // Expected CSV format: name, product_code, quantity, unit, price_excl_vat, account_code, comment
      const nameIndex = headers.findIndex((h) => h === "name" || h === "product name");
      const productCodeIndex = headers.findIndex((h) => h === "product_code" || h === "product code" || h === "code");
      const quantityIndex = headers.findIndex((h) => h === "quantity" || h === "qty");
      const unitIndex = headers.findIndex((h) => h === "unit");
      const priceIndex = headers.findIndex((h) => h === "price_excl_vat" || h === "price" || h === "price (excl. vat)");
      const accountCodeIndex = headers.findIndex((h) => h === "account_code" || h === "account code");
      const commentIndex = headers.findIndex((h) => h === "comment" || h === "comments");

      if (nameIndex === -1 || priceIndex === -1 || accountCodeIndex === -1) {
        toast.error("CSV must contain: name, price_excl_vat, and account_code columns");
        return;
      }

      const validAccountCodes: ProductAccountCode[] = [
        "1000", "1010", "1100", "1110", "1120", "1130",
        "1200", "1210", "1220", "1230", "9000", "9010"
      ];

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        const name = values[nameIndex];
        const priceExclVat = parseFloat(values[priceIndex]);
        const accountCode = values[accountCodeIndex] as ProductAccountCode;

        if (!name || !name.trim()) {
          errorCount++;
          errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }

        if (isNaN(priceExclVat) || priceExclVat < 0) {
          errorCount++;
          errors.push(`Row ${i + 1}: Invalid price`);
          continue;
        }

        if (!validAccountCodes.includes(accountCode)) {
          errorCount++;
          errors.push(`Row ${i + 1}: Invalid account code "${accountCode}"`);
          continue;
        }

        const productInput: CreateProductInput = {
          organization_id: organizationIdAsNumber,
          name: name.trim(),
          product_code: productCodeIndex !== -1 ? values[productCodeIndex] || null : null,
          quantity: quantityIndex !== -1 ? parseInt(values[quantityIndex]) || 1 : 1,
          unit: unitIndex !== -1 ? values[unitIndex] || "stk." : "stk.",
          price_excl_vat: priceExclVat,
          account_code: accountCode,
          comment: commentIndex !== -1 ? values[commentIndex] || null : null,
        };

        try {
          await createProduct(productInput);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Failed to create product"}`);
        }
      }

      // Invalidate queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ["products", organizationIdAsNumber] });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} product(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} product(s). ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import products");
    }
  };

  const handleExportClick = () => {
    if (!organizationIdAsNumber) {
      toast.error("Please select an organization first");
      return;
    }

    if (isLoadingProducts) {
      toast.error("Please wait while products are loading");
      return;
    }

    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    // Filter products if filters are active
    let filteredProducts = products;
    if (filterName) {
      filteredProducts = filteredProducts.filter((p) =>
        p.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    if (filterAccountCode) {
      filteredProducts = filteredProducts.filter((p) => p.account_code === filterAccountCode);
    }

    if (filteredProducts.length === 0) {
      toast.error("No products match the current filters");
      return;
    }

    // Create CSV content
    const headers = ["name", "product_code", "quantity", "unit", "price_excl_vat", "account_code", "comment"];
    const csvRows = [
      headers.join(","),
      ...filteredProducts.map((product) =>
        [
          `"${product.name.replace(/"/g, '""')}"`,
          product.product_code ? `"${product.product_code.replace(/"/g, '""')}"` : "",
          product.quantity.toString(),
          product.unit ? `"${product.unit.replace(/"/g, '""')}"` : "",
          product.price_excl_vat.toString(),
          product.account_code,
          product.comment ? `"${product.comment.replace(/"/g, '""')}"` : "",
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredProducts.length} product(s)`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Products" />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/products/create">
              <Button
                label="Create new product"
                icon={<PlusIcon className="size-4" />}
                variant="primary"
                size="small"
                className="px-6"
              />
            </Link>
            <Button
              label="Filter"
              icon={<SlidersHorizontalIcon className="size-4" />}
              variant={showFilter ? "primary" : "outlineDark"}
              size="small"
              className="px-6"
              onClick={handleFilterClick}
            />
            <Button
              label="All"
              variant="outlinePrimary"
              size="small"
              className="px-6"
              onClick={handleAllClick}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              label="Import products"
              icon={<UploadIcon className="size-4" />}
              variant="outlineDark"
              size="small"
              className="px-6"
              onClick={handleImportClick}
            />
            <Button
              label="Export products"
              icon={<DownloadIcon className="size-4" />}
              variant="outlineDark"
              size="small"
              className="px-6"
              onClick={handleExportClick}
            />
          </div>
        </div>

        {showFilter && (
          <div className="mt-4 rounded-lg border border-stroke bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-dark dark:text-white">Filter Products</h3>
              <button
                onClick={() => setShowFilter(false)}
                className="text-dark-6 hover:text-dark dark:text-white/70 dark:hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Product Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Account Code
                </label>
                <select
                  value={filterAccountCode}
                  onChange={(e) => setFilterAccountCode(e.target.value as ProductAccountCode | "")}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="">All Account Codes</option>
                  <option value="1000">1000 - Quota</option>
                  <option value="1010">1010 - Quota, Passive members</option>
                  <option value="1100">1100 - Activity allowance</option>
                  <option value="1110">1110 - Coaching allowance</option>
                  <option value="1120">1120 - Course and training grants</option>
                  <option value="1130">1130 - Other grants</option>
                  <option value="1200">1200 - Sponsorship income</option>
                  <option value="1210">1210 - Income from conventions, events, etc.</option>
                  <option value="1220">1220 - Other Income</option>
                  <option value="1230">1230 - Reminder fees</option>
                  <option value="9000">9000 - Interest income</option>
                  <option value="9010">9010 - Financial income, other</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ProductsTable 
        filterName={filterName}
        filterAccountCode={filterAccountCode}
      />
    </div>
  );
};

export default page;

