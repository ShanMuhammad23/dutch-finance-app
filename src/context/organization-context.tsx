"use client";

import { useUserOrganizations } from "@/lib/queries/organizations";
import { Organization } from "@/lib/queries/organizations";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type OrganizationContextValue = {
  organizations: Organization[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  selectedOrganizationId: string | null;
  organizationIdAsNumber: number | null;
  activeOrganization: Organization | null;
  selectOrganization: (organizationId: string) => void;
  refetch: () => Promise<unknown>;
  userId: string | number | null;
  isReady: boolean;
};

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const STORAGE_KEY = "activeOrganizationId";

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const {
    data: organizations = [],
    isLoading: isOrganizationsLoading,
    isFetching,
    error,
    refetch,
  } = useUserOrganizations(userId);

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate selection from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedOrganizationId(stored);
    }
    setHasHydrated(true);
  }, []);

  // Ensure selected organization is valid
  useEffect(() => {
    if (!hasHydrated) return;

    if (!organizations.length) {
      setSelectedOrganizationId(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    if (
      selectedOrganizationId &&
      organizations.some((organization) => String(organization.id) === selectedOrganizationId)
    ) {
      return;
    }

    const fallbackId = String(organizations[0].id);
    setSelectedOrganizationId(fallbackId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, fallbackId);
    }
  }, [organizations, hasHydrated, selectedOrganizationId]);

  // Persist selection
  useEffect(() => {
    if (!selectedOrganizationId || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, selectedOrganizationId);
  }, [selectedOrganizationId]);

  const selectOrganization = useCallback((organizationId: string) => {
    setSelectedOrganizationId(organizationId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, organizationId);
    }
  }, []);

  const activeOrganization = useMemo(() => {
    if (!selectedOrganizationId) return null;
    return organizations.find((organization) => String(organization.id) === selectedOrganizationId) ?? null;
  }, [organizations, selectedOrganizationId]);

  const organizationIdAsNumber = useMemo(() => {
    if (!selectedOrganizationId) return null;
    const parsed = Number(selectedOrganizationId);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    if (typeof activeOrganization?.id === "number") {
      return activeOrganization.id;
    }
    return null;
  }, [selectedOrganizationId, activeOrganization]);

  const isLoading = status === "loading" || isOrganizationsLoading || !hasHydrated;
  const isReady = Boolean(selectedOrganizationId && activeOrganization);

  const contextValue: OrganizationContextValue = useMemo(
    () => ({
      organizations,
      isLoading,
      isFetching,
      error,
      selectedOrganizationId,
      organizationIdAsNumber,
      activeOrganization,
      selectOrganization,
      refetch,
      userId: userId ?? null,
      isReady,
    }),
    [
      organizations,
      isLoading,
      isFetching,
      error,
      selectedOrganizationId,
      organizationIdAsNumber,
      activeOrganization,
      selectOrganization,
      refetch,
      userId,
      isReady,
    ],
  );

  return <OrganizationContext.Provider value={contextValue}>{children}</OrganizationContext.Provider>;
}

const missingProviderValue: OrganizationContextValue = {
  organizations: [],
  isLoading: true,
  isFetching: false,
  error: null,
  selectedOrganizationId: null,
  organizationIdAsNumber: null,
  activeOrganization: null,
  selectOrganization: () => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Attempted to select organization without OrganizationProvider mounted.");
    }
  },
  refetch: () => Promise.resolve(undefined),
  userId: null,
  isReady: false,
};

export function useActiveOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("useActiveOrganization called outside of OrganizationProvider. Returning fallback value.");
    }
    return missingProviderValue;
  }
  return context;
}


