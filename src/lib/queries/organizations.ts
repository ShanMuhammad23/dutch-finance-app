import { useQuery } from "@tanstack/react-query";
import type { Organization } from "@/lib/types";

export interface CreateOrganizationInput {
  business_type: string;
  company_name: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  email?: string;
  attention_person?: string;
  vat_number?: string;
  currency?: string;
  subscription_plan?: string;
  data_processing_agreement?: boolean;
}

export interface CVRCompanyData {
  company_name: string;
  vat_number: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
}

// Fetch all organizations for the current user
export async function getUserOrganizations(userId: number | string): Promise<Organization[]> {
  const response = await fetch(`/api/organizations?userId=${encodeURIComponent(userId)}`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to fetch organizations");
  }

  return payload;
}

// Create a new organization (only owner can create)
export async function createOrganization(
  input: CreateOrganizationInput,
  userId: number | string,
): Promise<Organization> {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      userId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create organization');
  }
  
  return response.json();
}

// Get single organization by ID (with ownership check)
export async function getOrganization(
  organizationId: number,
  userId: number | string,
): Promise<Organization> {
  const response = await fetch(`/api/organizations/${organizationId}?userId=${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch organization');
  }
  
  return response.json();
}

// Update organization (only owner can update)
export async function updateOrganization(
  organizationId: number,
  userId: number | string,
  updates: Partial<CreateOrganizationInput>
): Promise<Organization> {
  const response = await fetch(`/api/organizations/${organizationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...updates,
      userId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update organization');
  }
  
  return response.json();
}

// Delete organization (only owner can delete)
export async function deleteOrganization(
  organizationId: number,
  userId: number | string,
): Promise<boolean> {
  const response = await fetch(`/api/organizations/${organizationId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete organization');
  }
  
  return true;
}

// Fetch company data from CVR API (Danish Business Register)
export async function fetchCVRData(cvrNumber: string): Promise<CVRCompanyData | null> {
  try {
    const response = await fetch(`https://cvrapi.dk/api?vat=${cvrNumber}&country=dk`);
    
    if (!response.ok) {
      throw new Error('CVR lookup failed');
    }
    
    const data = await response.json();
    
    return {
      company_name: data.name || '',
      vat_number: data.vat || cvrNumber,
      address_line: data.address || '',
      postal_code: data.zipcode || '',
      city: data.city || '',
      country: 'Denmark',
    };
  } catch (error) {
    console.error('Error fetching CVR data:', error);
    return null;
  }
}

export function useUserOrganizations(userId?: string | number) {
  return useQuery({
    queryKey: ["organizations", userId],
    queryFn: () => getUserOrganizations(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

