"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivityLogs } from "@/lib/queries/activity-logs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrganization } from "@/context/organization-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <TableRow key={index} className="text-base font-medium text-dark dark:text-white">
          <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function getActionBadgeColor(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "UPDATE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "VIEW":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    case "LOGIN":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "LOGOUT":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "EXPORT":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "IMPORT":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

function getEntityTypeLabel(entityType: string) {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("da-DK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

type ActivityLogsViewProps = {
  className?: string;
};

export function ActivityLogsView({ className }: ActivityLogsViewProps) {
  const { organizationIdAsNumber } = useActiveOrganization();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const {
    data,
    isPending: isLoading,
    isError,
    error,
  } = useActivityLogs({
    organizationId: organizationIdAsNumber ?? undefined,
    entityType: entityTypeFilter || undefined,
    action: actionFilter || undefined,
    limit,
    offset: page * limit,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Activity Log
          </h1>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Complete audit trail for Danish bookkeeping compliance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          <option value="">All Entity Types</option>
          <option value="user">User</option>
          <option value="invoice">Invoice</option>
          <option value="purchase">Purchase</option>
          <option value="contact">Contact</option>
          <option value="product">Product</option>
          <option value="organization">Organization</option>
          <option value="auth">Authentication</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="VIEW">View</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="EXPORT">Export</option>
          <option value="IMPORT">Import</option>
        </select>
      </div>

      {isError && (
        <div className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
          {error?.message || "Unable to load activity logs right now."}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase">
              <TableHead className="pl-5 sm:pl-6 xl:pl-7.5 !text-left">
                Timestamp
              </TableHead>
              <TableHead className="!text-left">User</TableHead>
              <TableHead className="!text-left">Action</TableHead>
              <TableHead className="!text-left">Entity</TableHead>
              <TableHead className="!text-left">Description</TableHead>
              <TableHead className="!text-left">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-gray-500 dark:text-dark-6"
                >
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="text-base font-medium text-dark dark:text-white"
                >
                  <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {log.user_name || "Unknown"}
                      </span>
                      {log.user_email && (
                        <span className="text-xs text-gray-500 dark:text-dark-6">
                          {log.user_email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
                        getActionBadgeColor(log.action),
                      )}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{getEntityTypeLabel(log.entity_type)}</span>
                      {log.entity_id && (
                        <span className="text-xs text-gray-500 dark:text-dark-6">
                          ID: {log.entity_id}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="truncate">{log.description}</span>
                  </TableCell>
                  <TableCell>
                    {log.ip_address || (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-dark-6">
            Showing {page * limit + 1} to{" "}
            {Math.min((page + 1) * limit, pagination.total)} of{" "}
            {pagination.total} entries
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

