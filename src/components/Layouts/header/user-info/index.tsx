"use client";

import { ChevronUpIcon } from "@/assets/icons";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { Building2 } from "lucide-react";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) {
      return {
        name: "Guest",
        email: "",
        image: "/images/user/user-03.png",
        role: "",
      };
    }

    return {
      name: session.user.name ?? "Unknown User",
      email: session.user.email ?? "",
      role: session.user.role ?? "",
    };
  }, [session?.user]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: "/auth/sign-in" });
  };

  const isLoading = status === "loading";

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{isLoading ? "Loading..." : user.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {isLoading ? "Loading..." : user.name}
            </div>

            <div className="leading-none text-gray-6">
              {user.email || "Account"}
            </div>
            {user.role && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:bg-dark-3 dark:text-dark-6">
                {user.role}
              </span>
            )}
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/dashboard/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/dashboard/organizations"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />

            <span className="mr-auto text-base font-medium">
              Organizations
            </span>
          </Link>

          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleSignOut}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
