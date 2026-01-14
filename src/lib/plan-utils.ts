/**
 * Utility functions for checking plan limits
 */

import { queryOne } from '@/lib/db'

/**
 * Count invoices created in the current month for an organization
 */
export async function countInvoicesThisMonth(organizationId: number): Promise<number> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM invoices 
     WHERE organization_id = $1 
     AND created_at >= $2 
     AND created_at <= $3`,
    [organizationId, firstDayOfMonth.toISOString(), lastDayOfMonth.toISOString()]
  )
  
  return result ? parseInt(result.count, 10) : 0
}

/**
 * Count users associated with an organization
 * Currently counts the creator, but can be extended when organization_members table is added
 */
export async function countOrganizationUsers(organizationId: number): Promise<number> {
  // For now, each organization has one user (the creator)
  // When organization_members table is added, this should count all members
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT created_by) as count 
     FROM organizations 
     WHERE id = $1`,
    [organizationId]
  )
  
  return result ? parseInt(result.count, 10) : 1
}

/**
 * Get organization subscription plan
 */
export async function getOrganizationPlan(organizationId: number): Promise<string> {
  const result = await queryOne<{ subscription_plan: string }>(
    `SELECT subscription_plan 
     FROM organizations 
     WHERE id = $1`,
    [organizationId]
  )
  
  return result?.subscription_plan || 'free'
}

