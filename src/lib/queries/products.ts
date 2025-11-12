"use client";

import { useQuery } from "@tanstack/react-query";

import { CreateProductInput, Product } from "@/lib/types";

async function fetchOrganizationProducts(organizationId: number): Promise<Product[]> {
  const response = await fetch(`/api/products?organizationId=${organizationId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch products");
  }

  return response.json();
}

export function useOrganizationProducts(organizationId?: number) {
  return useQuery<Product[]>({
    queryKey: ["products", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return fetchOrganizationProducts(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
}

export async function getOrganizationProducts(organizationId: number) {
  return fetchOrganizationProducts(organizationId);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create product");
  }

  return response.json();
}


