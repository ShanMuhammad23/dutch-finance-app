"use client"

import { useQuery } from '@tanstack/react-query'
import { useActiveOrganization } from '@/context/organization-context'

interface PlanLimitsResponse {
  plan: string
  limits: {
    users: {
      current: number
      limit: number | null
      allowed: boolean
    }
    invoices: {
      current: number
      limit: number | null
      allowed: boolean
    }
  }
  features: Record<string, boolean>
  support: string
}

async function fetchPlanLimits(organizationId: number): Promise<PlanLimitsResponse> {
  const response = await fetch(`/api/organizations/${organizationId}/limits`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch plan limits')
  }
  
  return response.json()
}

/**
 * Hook to get current plan limits and usage for the active organization
 */
export function usePlanLimits() {
  const { organizationIdAsNumber, isReady } = useActiveOrganization()

  return useQuery<PlanLimitsResponse>({
    queryKey: ['plan-limits', organizationIdAsNumber],
    queryFn: () => fetchPlanLimits(organizationIdAsNumber!),
    enabled: isReady && !!organizationIdAsNumber,
    staleTime: 1000 * 60, // 1 minute
  })
}

