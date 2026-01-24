"use client"

import { useState } from "react"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card } from "@/components/card";
import { Button } from "@/components/ui-elements/button";
import {
  FileSpreadsheetIcon,
  HistoryIcon,
  RefreshCcwIcon,
  UploadIcon,
} from "lucide-react";
import { BankStatementUpload } from "@/components/bank/bank-statement-upload";
import { BankImportHistory } from "@/components/bank/bank-import-history";
import { useActiveOrganization } from "@/context/organization-context";
import { BankStatementUpload as BankStatementUploadType } from "@/lib/types";

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

const Page = () => {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = (upload: BankStatementUploadType) => {
    console.log('Bank statement uploaded:', upload)
    // TODO: Handle upload completion (e.g., show success message, update UI)
  }

  const handleImportComplete = () => {
    // Trigger refresh of import history
    setRefreshKey(prev => prev + 1)
  }

  const handleDownloadSample = () => {
    // Create sample CSV content
    const sampleCSV = `Dato;Tekst;Beløb;Saldo;Reference;Modpart
01-01-2024;Indbetaling fra kunde;5000,00;5000,00;REF001;Kunde A/S
02-01-2024;Betaling til leverandør;-2500,00;2500,00;REF002;Leverandør ApS
03-01-2024;Gebyr;-50,00;2450,00;REF003;Banken
04-01-2024;Renteindtægt;25,00;2475,00;REF004;Banken`

    // Create blob and download
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample-bank-statement.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isReady || !organizationIdAsNumber) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Bank statements" />
        <Card className="p-6">
          <p className="text-muted-foreground">
            Please select an organization to upload bank statements.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Bank statements" />

      <div className="grid gap-6 ">
        <Card className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-dark dark:text-white">
              Import bank statement
            </h3>
            <p className="text-body-sm text-gray-600 dark:text-gray-4">
              Upload a CSV or XLSX file from your Danish bank to import transactions. The system will
              automatically detect the format and show a preview before importing.
            </p>
          </div>

          <BankStatementUpload
            organizationId={organizationIdAsNumber}
            onUploadComplete={handleUploadComplete}
            onImportComplete={handleImportComplete}
          />

         
        </Card>
      </div>

      {/* Import History */}
      <BankImportHistory refreshKey={refreshKey} />
    </div>
  );
};

export default Page;