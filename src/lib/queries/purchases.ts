"use client";

import { useQuery } from "@tanstack/react-query";

import { CreatePurchaseInput, Purchase } from "@/lib/types";

async function fetchOrganizationPurchases(organizationId: number): Promise<Purchase[]> {
  const response = await fetch(`/api/purchases?organizationId=${organizationId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch purchases");
  }

  return response.json();
}

export function useOrganizationPurchases(organizationId?: number) {
  return useQuery<Purchase[]>({
    queryKey: ["purchases", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return fetchOrganizationPurchases(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
}

export async function getOrganizationPurchases(organizationId: number) {
  return fetchOrganizationPurchases(organizationId);
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const response = await fetch("/api/purchases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create purchase");
  }

  return response.json();
}

