
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card } from "@/components/card";
import { Button } from "@/components/ui-elements/button";
import {
  FileSpreadsheetIcon,
  HistoryIcon,
  RefreshCcwIcon,
  UploadIcon,
} from "lucide-react";

const guideItems = [
  {
    icon: FileSpreadsheetIcon,
    title: "Prepare your statement",
    description:
      "Export a CSV, OFX, or QIF file with clear headers for date, description, debit, and credit columns.",
  },
  {
    icon: RefreshCcwIcon,
    title: "Map columns once",
    description:
      "We will remember your column mapping so future uploads match automatically and stay consistent.",
  },
  {
    icon: HistoryIcon,
    title: "Review before posting",
    description:
      "Inspect the transaction preview to reconcile amounts and flag duplicates before finalizing the import.",
  },
];

const page = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Bank statements" />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-dark dark:text-white">
              Import bank statement
            </h3>
            <p className="text-body-sm text-gray-600 dark:text-gray-4">
              Upload a supported bank export to reconcile transactions. You can
              also paste a secure bank feed link once it&apos;s available.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-gray-4 bg-gray-2 px-6 py-10 text-center hover:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
              <UploadIcon className="size-7 text-primary" />
            </div>

            <div className="mt-5 space-y-1.5">
              <p className="text-base font-medium text-dark dark:text-white">
                Drag and drop your statement file
              </p>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                Accepts CSV, OFX, or QIF up to 25 MB. Multiple accounts? Upload
                them one at a time.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                label="Select file"
                icon={<UploadIcon className="size-4" />}
                size="small"
              />
              <Button
                label="Use bank feed link"
                variant="outlineDark"
                size="small"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {guideItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-lg border border-stroke bg-white px-4 py-5 text-left dark:border-dark-3 dark:bg-gray-dark"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>

                  <div className="space-y-1">
                    <p className="font-semibold text-dark dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-body-sm text-gray-600 dark:text-gray-4">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HistoryIcon className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-dark dark:text-white">
                  Recent imports
                </p>
                <p className="text-body-sm text-gray-600 dark:text-gray-4">
                  Once you start importing statements, you&apos;ll see the most
                  recent uploads, their status, and any issues highlighted here.
                </p>
              </div>
            </div>
            <Button
              label="View history"
              variant="outlineDark"
              size="small"
              className="w-full"
            />
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <p className="font-semibold text-dark dark:text-white">
                Need a template?
              </p>
              <p className="text-body-sm text-gray-600 dark:text-gray-4">
                Download our sample CSV structure to match your bank export, or
                share it with your finance team before uploading.
              </p>
            </div>
            <Button
              label="Download sample CSV"
              icon={<FileSpreadsheetIcon className="size-4" />}
              variant="outlinePrimary"
              size="small"
              className="w-full"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default page;