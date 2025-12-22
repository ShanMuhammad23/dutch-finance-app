import { queryOne } from './db'
import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

export type ActivityAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'

export type ActivityEntity = 
  | 'user'
  | 'invoice'
  | 'purchase'
  | 'contact'
  | 'product'
  | 'organization'
  | 'auth'

export interface ActivityLogInput {
  action: ActivityAction
  entity_type: ActivityEntity
  entity_id?: number | null
  user_id: number
  organization_id?: number | null
  description: string
  details?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
}

/**
 * Log an activity for audit trail (Danish bookkeeping compliance)
 * This creates an immutable record of all system activities
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    // Ensure activity_logs table exists (create if not)
    // In production, this should be done via migration
    await queryOne(
      `INSERT INTO activity_logs (
        action,
        entity_type,
        entity_id,
        user_id,
        organization_id,
        description,
        details,
        ip_address,
        user_agent,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id`,
      [
        input.action,
        input.entity_type,
        input.entity_id ?? null,
        input.user_id,
        input.organization_id ?? null,
        input.description,
        input.details ? JSON.stringify(input.details) : null,
        input.ip_address ?? null,
        input.user_agent ?? null,
      ]
    )
  } catch (error: any) {
    // If table doesn't exist, log error but don't break the application
    // In production, ensure table is created via migration
    if (error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      console.warn('Activity log table does not exist. Please run migration to create it.')
      return
    }
    console.error('Error logging activity:', error)
    // Don't throw - activity logging should not break the main flow
  }
}

/**
 * Helper to extract IP address from request
 */
export function getIpAddress(request: Request | NextRequest): string | null {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    return forwarded?.split(',')[0]?.trim() || realIp || null
  } catch {
    return null
  }
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request | NextRequest): string | null {
  try {
    return request.headers.get('user-agent') || null
  } catch {
    return null
  }
}

/**
 * Create activity log entry from session and request
 */
export async function logActivityFromRequest(
  action: ActivityAction,
  entity_type: ActivityEntity,
  options: {
    entity_id?: number | null
    organization_id?: number | null
    description: string
    details?: Record<string, any>
    request?: Request | NextRequest
    session?: Session | null
  }
): Promise<void> {
  if (!options.session?.user?.id) {
    console.warn('Cannot log activity: No user session')
    return
  }

  const ipAddress = options.request ? getIpAddress(options.request) : null
  const userAgent = options.request ? getUserAgent(options.request) : null

  await logActivity({
    action,
    entity_type,
    entity_id: options.entity_id ?? null,
    user_id: Number(options.session.user.id),
    organization_id: options.organization_id ?? null,
    description: options.description,
    details: options.details ?? null,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}

