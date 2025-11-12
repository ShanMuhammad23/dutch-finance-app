import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card } from "@/components/card";
import ProductsTable from "@/components/products/ProductsTable";
import { Button } from "@/components/ui-elements/button";
import {
  DownloadIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";

const page = () => {
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
              variant="outlineDark"
              size="small"
              className="px-6"
            />
            <Button
              label="All"
              variant="outlinePrimary"
              size="small"
              className="px-6"
            />
            <Button
              label="Import products"
              icon={<UploadIcon className="size-4" />}
              variant="outlineDark"
              size="small"
              className="px-6"
            />
            <Button
              label="Export products"
              icon={<DownloadIcon className="size-4" />}
              variant="outlineDark"
              size="small"
              className="px-6"
            />
          </div>
        </div>
      </Card>

      <ProductsTable />
    </div>
  );
};

export default page;

