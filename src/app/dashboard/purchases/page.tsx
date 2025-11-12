
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PurchasesTable } from "@/components/Tables/purchases-table";
import { Button } from "@/components/ui-elements/button";

const Page = () => {
  return (
    <div className="space-y-10">
      <Breadcrumb pageName="Purchases" />

      <div className="flex items-center justify-end">
        <Link href="/dashboard/purchases/create">
          <Button
            label="Add Purchase"
            variant="primary"
            icon={<PlusIcon className="size-4" />}
          />
        </Link>
      </div>

      <PurchasesTable />
    </div>
  );
};

export default Page;