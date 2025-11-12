"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const user = session?.user;

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName="Profile" />

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-8 sm:px-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-5 font-bold text-dark dark:text-white">
                Account Overview
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-6">
                Review your profile details pulled from the authenticated session.
              </p>
            </div>

            <dl className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Name
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.name ?? "Not available"}
                </dd>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Email
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.email ?? "Not available"}
                </dd>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Role
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.role ?? "Not assigned"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
