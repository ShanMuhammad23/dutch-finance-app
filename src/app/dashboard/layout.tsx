import { Sidebar } from "@/components/Layouts/sidebar";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { Header } from "@/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
    <NextTopLoader color="#5750F1" showSpinner={false} />

    <div className="flex min-h-screen">
      <Sidebar />

      <div className="min-w-0 flex-1 flex flex-col bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate min-w-0 flex-1 overflow-x-auto p-4 md:p-6 2xl:p-10">
          <div className="mx-auto min-w-0 w-full max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  )
}

export default DashboardLayout