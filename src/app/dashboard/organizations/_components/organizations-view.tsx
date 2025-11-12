"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrganization } from "@/context/organization-context";
import { cn } from "@/lib/utils";
import { Building2, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeText(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value;
}

export function OrganizationsView() {
  const {
    organizations,
    isLoading,
    isFetching,
    error,
    selectedOrganizationId,
    selectOrganization,
    refetch,
    userId,
  } = useActiveOrganization();

  const isEmpty = !isLoading && organizations.length === 0;

  const organizationCards = useMemo(
    () =>
      organizations.map((organization) => {
        const organizationId = String(organization.id);
        const isActive = organizationId === selectedOrganizationId;
        return (
          <Card
            key={organizationId}
            className="flex h-full flex-col gap-5 p-6 transition hover:shadow-md"
          >
            <header className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-dark dark:text-white">
                  {organization.company_name}
                </h2>
                <p className="text-sm text-dark-6 dark:text-dark-6">
                  {normalizeText(organization.business_type)}
                </p>
              </div>

              {isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Active
                </span>
              )}
            </header>

            <dl className="space-y-3 text-sm text-dark-6 dark:text-dark-6">
              <InfoRow label="Country" value={normalizeText(organization.country)} />
              <InfoRow
                label="City"
                value={normalizeText(organization.city)}
              />
              <InfoRow
                label="VAT number"
                value={normalizeText(organization.vat_number)}
              />
              <InfoRow
                label="Subscription plan"
                value={normalizeText(organization.subscription_plan)}
              />
              <InfoRow
                label="Status"
                value={normalizeText(organization.status)}
              />
              <InfoRow
                label="Last updated"
                value={formatDate(organization.updated_at)}
              />
            </dl>

            <footer className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => selectOrganization(organizationId)}
                disabled={isActive}
                className={cn(
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "cursor-default border border-primary/40 bg-primary/10 text-primary"
                    : "border border-stroke text-dark hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white",
                )}
              >
                {isActive ? "Current organization" : "Set as active"}
              </button>

              {organization.email && (
                <Link
                  href={`mailto:${organization.email}`}
                  className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                >
                  Contact admin
                </Link>
              )}
            </footer>
          </Card>
        );
      }),
    [organizations, selectOrganization, selectedOrganizationId],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-dark dark:text-white">
            Organizations
          </h1>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Review every organization linked to your account and choose the one you want to work with.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isFetching || !userId}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white",
          )}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              isFetching && "animate-spin",
            )}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
          Unable to load organizations right now. Please try again.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((__, skeletonIndex) => (
                  <Skeleton key={skeletonIndex} className="h-3 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isEmpty && (
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            No organizations yet
          </h2>
          <p className="max-w-md text-sm text-dark-6 dark:text-dark-6">
            When an organization is created for your account, it will show up here. Get in touch with your administrator if you think something is missing.
          </p>
        </Card>
      )}

      {!isLoading && !isEmpty && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizationCards}
        </div>
      )}
    </section>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-sm font-medium text-dark dark:text-white">{label}</dt>
      <dd className="text-right text-sm text-dark-6 dark:text-dark-6">{value}</dd>
    </div>
  );
}

