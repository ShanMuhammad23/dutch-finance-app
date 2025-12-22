'use client'

import { useQuery } from '@tanstack/react-query'

export interface ActivityLog {
  id: number
  action: string
  entity_type: string
  entity_id: number | null
  user_id: number
  organization_id: number | null
  description: string
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
  organization_name: string | null
}

export interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface UseActivityLogsOptions {
  organizationId?: number
  entityType?: string
  action?: string
  limit?: number
  offset?: number
  enabled?: boolean
}

export function useActivityLogs(options: UseActivityLogsOptions = {}) {
  const {
    organizationId,
    entityType,
    action,
    limit = 100,
    offset = 0,
    enabled = true,
  } = options

  return useQuery<ActivityLogsResponse>({
    queryKey: ['activity-logs', organizationId, entityType, action, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', String(organizationId))
      if (entityType) params.append('entityType', entityType)
      if (action) params.append('action', action)
      params.append('limit', String(limit))
      params.append('offset', String(offset))

      const response = await fetch(`/api/activity-logs?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch activity logs')
      }
      return response.json()
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  })
}

