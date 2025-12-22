"use client";

import { Dropdown, DropdownContent, DropdownTrigger, DropdownClose } from "@/components/ui/dropdown";
import Link from "next/link";
import { useState } from "react";
import { 
  PlusIcon, 
  FileTextIcon, 
  ShoppingCartIcon, 
  PackageIcon, 
  UserPlusIcon 
} from "lucide-react";

const menuItems = [
  {
    label: "New Invoice",
    href: "/dashboard/invoices/create",
    icon: FileTextIcon,
  },
  {
    label: "New Purchase",
    href: "/dashboard/purchases/create",
    icon: ShoppingCartIcon,
  },
  {
    label: "New Product",
    href: "/dashboard/products/create",
    icon: PackageIcon,
  },
  {
    label: "New User",
    href: "/dashboard/users",
    icon: UserPlusIcon,
  },
];

export function QuickCreate() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded-lg border border-stroke bg-primary p-2.5 text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-dark-3 dark:ring-offset-gray-dark">
       <div className="flex items-center gap-2">
       <PlusIcon className="h-5 w-5" aria-hidden="true" />
       <span className="text-base font-medium">Create</span>
       </div>
        
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-w-[12rem]"
        align="end"
      >
        <h2 className="sr-only">Quick create menu</h2>

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownClose key={item.href}>
                <Link
                  href={item.href}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-base font-medium">{item.label}</span>
                </Link>
              </DropdownClose>
            );
          })}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

