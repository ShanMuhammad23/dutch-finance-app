

import { queryOne } from '@/lib/db'


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


export async function countOrganizationUsers(organizationId: number): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT created_by) as count 
     FROM organizations 
     WHERE id = $1`,
    [organizationId]
  )
  
  return result ? parseInt(result.count, 10) : 1
}


export async function getOrganizationPlan(organizationId: number): Promise<string> {
  const result = await queryOne<{ subscription_plan: string }>(
    `SELECT subscription_plan 
     FROM organizations 
     WHERE id = $1`,
    [organizationId]
  )
  
  return result?.subscription_plan || 'free'
}

