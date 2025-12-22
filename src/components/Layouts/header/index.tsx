"use client";

import Image from "next/image";
import Link from "next/link";
import { useActiveOrganization } from "@/context/organization-context";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { QuickCreate } from "./quick-create";

function getLogoSrc(logo?: string | null) {
  if (!logo) return null;
  if (logo.startsWith("/") || logo.includes("/")) return logo;
  return `/attachments/${logo}`;
}

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const { activeOrganization } = useActiveOrganization();
  const activeLogoSrc = getLogoSrc(activeOrganization?.logo);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-2 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          {activeLogoSrc ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-md border border-stroke bg-white dark:border-stroke-dark dark:bg-gray-dark">
              <Image
                src={activeLogoSrc}
                alt={`${activeOrganization?.company_name ?? "Organization"} logo`}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <Image
              src={"/images/logo/logo-icon.svg"}
              width={32}
              height={32}
              alt=""
              role="presentation"
            />
          )}
        </Link>
      )}

      <div className="flex items-center gap-3 max-xl:hidden">
        {activeLogoSrc && (
          <div className="relative h-9 w-9 overflow-hidden rounded-md border border-stroke bg-white dark:border-stroke-dark dark:bg-gray-dark">
            <Image
              src={activeLogoSrc}
              alt={`${activeOrganization?.company_name ?? "Organization"} logo`}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
        )}
        <div>
          <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
            {activeOrganization?.company_name ?? "Finance App"}
          </h1>
          <p className="font-medium">
            {activeOrganization
              ? activeOrganization.country || activeOrganization.city || "Active organization"
              : "Manage.Track.Grow"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <QuickCreate />

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
