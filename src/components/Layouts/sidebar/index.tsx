"use client";

import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useActiveOrganization } from "@/context/organization-context";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

// Icons (using lucide-react icons from the user's code)
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  Receipt,
  FileSpreadsheet,
  Users2,
  Landmark,
  Puzzle,
  Building2,
  User2,
  LogOut,
} from "lucide-react";

type NavigationItem = {
  title: string;
  icon: LucideIcon;
  url?: string;
  items?: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
};

// Navigation structure based on user's requirements
const navigationData: NavigationItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "The Assistant",
    url: "/calendar",
    icon: Bot,
  },
  {
    title: "Invoices",
    url: "/dashboard/invoices",
    icon: Receipt,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: FileSpreadsheet,
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: Users2,
  },
  {
    title: "Bank",
    url: "/dashboard/bank",
    icon: Landmark,
  },
  {
    title: "Purchases",
    url: "/dashboard/purchases",
    icon: Puzzle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { data: session, status } = useSession();
  const {
    organizations,
    isLoading: isOrganizationsLoading,
    activeOrganization,
    selectedOrganizationId,
    selectOrganization,
  } = useActiveOrganization();
  const [isOrganizationMenuOpen, setIsOrganizationMenuOpen] = useState(false);
  const organizationDropdownRef = useClickOutside<HTMLDivElement>(() => setIsOrganizationMenuOpen(false));

  const currentUser = {
    name: session?.user?.name ?? "Guest",
    email: session?.user?.email ?? "",
    role: session?.user?.role ?? "",
  };

  const isSessionLoading = status === "loading";
  const organizationOptions = useMemo(
    () =>
      organizations?.map((organization) => ({
        id: String(organization.id),
        name: organization.company_name,
        subtitle: organization.country || organization.city || organization.business_type,
      })) ?? [],
    [organizations]
  );
  const activeOrganizationOption = useMemo(
    () => organizationOptions.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizationOptions, selectedOrganizationId],
  );

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  useEffect(() => {
    // Keep collapsible open when its subpage is active
    navigationData.forEach((item) => {
      if (item.items) {
        item.items.forEach((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              setExpandedItems((prev) => [...prev, item.title]);
            }
          }
        });
      }
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col">
          {/* Organization Switcher */}
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-800">
            <div ref={organizationDropdownRef} className="relative w-full">
              <button
                type="button"
                onClick={() => {
                  if (organizationOptions.length) {
                    setIsOrganizationMenuOpen((prev) => !prev);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-gray-700",
                  organizationOptions.length
                    ? "border-gray-200 bg-gray-50 hover:border-primary/60 dark:bg-gray-900"
                    : "cursor-not-allowed opacity-60",
                )}
                aria-haspopup="listbox"
                aria-expanded={isOrganizationMenuOpen}
                disabled={!organizationOptions.length}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                 
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {isOrganizationsLoading
                      ? "Loading organizations..."
                      : activeOrganizationOption?.name ?? "No organization"}
                  </span>
                  {!isOrganizationsLoading && activeOrganizationOption?.subtitle && (
                    <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {activeOrganizationOption.subtitle}
                    </span>
                  )}
                </span>

                <ChevronUp
                  className={cn(
                    "ml-auto h-4 w-4 text-gray-500 transition-transform dark:text-gray-400",
                    isOrganizationMenuOpen ? "rotate-0" : "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOrganizationMenuOpen && organizationOptions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <ul className="max-h-60 overflow-y-auto py-2" role="listbox">
                    {organizationOptions.map((organization) => {
                      const isActive = organization.id === selectedOrganizationId;
                      return (
                        <li key={organization.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800",
                              isActive &&
                                "bg-primary/10 font-semibold text-primary hover:bg-primary/20 dark:text-primary",
                            )}
                            onClick={() => {
                              selectOrganization(organization.id);
                              setIsOrganizationMenuOpen(false);
                            }}
                            role="option"
                            aria-selected={isActive}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              <Building2 className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col text-left">
                              <span className="truncate">{organization.name}</span>
                              {organization.subtitle && (
                                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {organization.subtitle}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1  pl-[25px] pr-[7px]">
            <div className="relative pr-4.5">
              <Link
                href={"/"}
                onClick={() => isMobile && toggleSidebar()}
                className="px-0 py-2.5 min-[850px]:py-0"
              >
              </Link>

              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
                >
                  <span className="sr-only">Close Menu</span>
                  <ArrowLeftIcon className="ml-auto size-7" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
              <nav role="navigation" aria-label="Main navigation">
                <ul className="space-y-2">
                  {navigationData.map((item) => (
                    <li key={item.title}>
                      {item.items && item.items.length > 0 ? (
                        <div>
                          <MenuItem
                            isActive={item.items.some(
                              ({ url }) => url === pathname,
                            )}
                            onClick={() => toggleExpanded(item.title)}
                          >
                            <item.icon
                              className="size-6 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{item.title}</span>
                            <ChevronUp
                              className={cn(
                                "ml-auto rotate-180 transition-transform duration-200",
                                expandedItems.includes(item.title) && "rotate-0",
                              )}
                              aria-hidden="true"
                            />
                          </MenuItem>

                          {expandedItems.includes(item.title) && (
                            <ul
                              className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                              role="menu"
                            >
                              {item.items.map((subItem) => (
                                <li key={subItem.title} role="none">
                                  <MenuItem
                                    as="link"
                                    href={subItem.url}
                                    isActive={pathname === subItem.url}
                                  >
                                    <subItem.icon
                                      className="size-5 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>{subItem.title}</span>
                                  </MenuItem>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <MenuItem
                          className="flex items-center gap-3 py-3"
                          as="link"
                          href={item.url!}
                          isActive={pathname === item.url}
                        >
                          <item.icon
                            className="size-6 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{item.title}</span>
                        </MenuItem>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Footer with User Profile */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {isSessionLoading ? "Loading..." : currentUser.name}
                </span>
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {currentUser.email || ""}
                </span>
                {currentUser.role && (
                  <span className="mt-1 truncate text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {currentUser.role}
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                className="flex-shrink-0 rounded-md p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
