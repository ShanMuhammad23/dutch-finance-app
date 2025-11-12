"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { OrganizationProvider } from "@/context/organization-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </OrganizationProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
