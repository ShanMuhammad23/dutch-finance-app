import { InvoiceTable } from '@/components/Tables/invoice-table'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Link from 'next/link'
import { Button } from '@/components/ui-elements/button'
import { PlusIcon } from 'lucide-react'
const page = () => {
  return (<div className='space-y-10'>
    <Breadcrumb pageName="Invoices" />
    <div className="flex items-center justify-end">
        <Link href="/dashboard/invoices/create">
            <Button label="Add Invoice" variant="primary" icon={<PlusIcon className="size-4" />} />
        </Link>

    </div>
    <InvoiceTable />
    </div>
  )
}

export default page