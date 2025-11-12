
const page = () => {
    return (
<div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
    <h1 className="text-white text-2xl">Pricing</h1>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <div className="relative overflow-hidden rounded-[10px] bg-white px-5 py-11 text-center shadow-1 dark:bg-gray-dark dark:shadow-card md:px-9 xl:px-12.5">
            <div className="mb-7.5 border-b border-stroke pb-7.5 dark:border-dark-3"><span className="mb-3 block text-heading-6 font-bold text-dark dark:text-white">Starter (Free)</span>
            </div>
            <ul className="mb-9 flex flex-col gap-3.5 ">
                <li className="font-medium text-dark dark:text-white">Revenue ≤ 100k DKK/year </li>
                <li className="font-medium text-dark dark:text-white">≤ 10 invoices/month</li>
                <li className="font-medium text-dark dark:text-white">1 user</li>
                <li className="font-medium text-dark dark:text-white">Basic OCR</li>
                <li className="font-medium text-dark dark:text-white">Email Support</li>
            </ul>
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white xl:text-[42px] xl:leading-[1.21]"><sup className="-right-2 -top-4.5 text-xl font-medium">DK</sup><span> 0.00  </span><span className="text-base font-medium">/month</span></h2>
            <button className="mt-6 flex w-full justify-center rounded-[7px] border border-primary px-[35px] py-[11px] font-bold text-primary hover:bg-primary hover:text-white ">Buy Now</button>
        </div>
        <div className="relative overflow-hidden rounded-[10px] bg-white px-5 py-11 text-center shadow-1 dark:bg-gray-dark dark:shadow-card md:px-9 xl:px-12.5">
            <p className="absolute -right-9 top-5 inline-flex rotate-45 bg-primary px-12 py-2 text-base font-medium text-white">Popular</p>
            <div className="mb-7.5 border-b border-stroke pb-7.5 dark:border-dark-3"><span className="mb-3 block text-heading-6 font-bold text-dark dark:text-white">Basic</span>
            </div>
            <ul className="mb-9 flex flex-col gap-3.5">
                <li className="font-medium text-dark dark:text-white">2 Users</li>
                <li className="font-medium text-dark dark:text-white">≤ 50 invoices/month</li>
                <li className="font-medium text-dark dark:text-white">Peppol e-invoice</li>
                <li className="font-medium text-dark dark:text-white">basic OCR 50 docs/mo</li>
                <li className="font-medium text-dark dark:text-white">Email Support</li>
            </ul>
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white xl:text-[42px] xl:leading-[1.21]"><sup className="-right-2 -top-4.5 text-xl font-medium">DK</sup><span> 99.00 </span><span className="text-base font-medium">/month</span></h2>
            <button className="mt-6 flex w-full justify-center rounded-[7px] border border-primary px-[35px] py-[11px] font-bold  hover:bg-primary hover:text-white bg-primary text-white">Buy Now</button>
            <p className="mt-3 font-medium">1 month free trial</p>
        </div>
        <div className="relative overflow-hidden rounded-[10px] bg-white px-5 py-11 text-center shadow-1 dark:bg-gray-dark dark:shadow-card md:px-9 xl:px-12.5">
            <div className="mb-7.5 border-b border-stroke pb-7.5 dark:border-dark-3"><span className="mb-3 block text-heading-6 font-bold text-dark dark:text-white">Plus</span>
            </div>
            <ul className="mb-9 flex flex-col gap-3.5">
                <li className="font-medium text-dark dark:text-white">5 Users</li>
                <li className="font-medium text-dark dark:text-white">No invoice limits</li>
                <li className="font-medium text-dark dark:text-white">Unlimited basic OCR</li>
                <li className="font-medium text-dark dark:text-white">Approvals</li>
                <li className="font-medium text-dark dark:text-white">Advanced bank rules</li>
                <li className="font-medium text-dark dark:text-white">Multi-currency</li>
                <li className="font-medium text-dark dark:text-white">API & webhooks</li>
                <li className="font-medium text-dark dark:text-white">Accountant portal</li>                
                <li className="font-medium text-dark dark:text-white">phone/chat support</li>                

            </ul>
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white xl:text-[42px] xl:leading-[1.21]"><sup className="-right-2 -top-4.5 text-xl font-medium">DK</sup><span> 149.00 </span><span className="text-base font-medium">/month</span></h2>
            <button className="mt-6 flex w-full justify-center rounded-[7px] border border-primary px-[35px] py-[11px] font-bold text-primary hover:bg-primary hover:text-white ">Buy Now</button>
        </div>
        <div className="relative overflow-hidden rounded-[10px] bg-white px-5 py-11 text-center shadow-1 dark:bg-gray-dark dark:shadow-card md:px-9 xl:px-12.5">
            <div className="mb-7.5 border-b border-stroke pb-7.5 dark:border-dark-3"><span className="mb-3 block text-heading-6 font-bold text-dark dark:text-white">Pro</span>
            </div>
            <ul className="mb-9 flex flex-col gap-3.5">
                <li className="font-medium text-dark dark:text-white">Unlimited Users</li>
                <li className="font-medium text-dark dark:text-white">Advanced analytics</li>
                <li className="font-medium text-dark dark:text-white">Custom roles</li>
                <li className="font-medium text-dark dark:text-white">Approvals</li>
                <li className="font-medium text-dark dark:text-white">Custom workflows (if/then)</li>
                <li className="font-medium text-dark dark:text-white">Batch imports</li>
                <li className="font-medium text-dark dark:text-white">Audit exports</li>
                <li className="font-medium text-dark dark:text-white">Priority support/SLA</li>                
                <li className="font-medium text-dark dark:text-white">Accountant portal</li>                
                <li className="font-medium text-dark dark:text-white">AI assistant</li>                

            </ul>
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white xl:text-[42px] xl:leading-[1.21]"><sup className="-right-2 -top-4.5 text-xl font-medium">DK</sup><span> 199.00 </span><span className="text-base font-medium">/month</span></h2>
            <button className="mt-6 flex w-full justify-center rounded-[7px] border border-primary px-[35px] py-[11px] font-bold text-primary hover:bg-primary hover:text-white ">Buy Now</button>
        </div>
    </div>
   
</div>    )
}

export default page