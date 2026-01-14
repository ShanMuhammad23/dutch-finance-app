/**
 * Validation utilities for plan limits
 * Use these functions before performing actions that might exceed plan limits
 */

import { checkUserLimit, checkInvoiceLimit, getLimitErrorMessage } from './plan-limits'
import { countOrganizationUsers, countInvoicesThisMonth, getOrganizationPlan } from './plan-utils'

/**
 * Validate if an organization can create an invoice
 * Returns validation result with error message if limit exceeded
 */
export async function validateInvoiceCreation(
  organizationId: number
): Promise<{ allowed: boolean; error?: string; current?: number; limit?: number | null }> {
  const plan = await getOrganizationPlan(organizationId)
  const currentCount = await countInvoicesThisMonth(organizationId)
  const limitCheck = checkInvoiceLimit(currentCount, plan)

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      error: getLimitErrorMessage('invoices', plan, limitCheck.current, limitCheck.limit),
      current: limitCheck.current,
      limit: limitCheck.limit,
    }
  }

  return { allowed: true }
}

/**
 * Validate if an organization can add a user
 * Returns validation result with error message if limit exceeded
 */
export async function validateUserAddition(
  organizationId: number
): Promise<{ allowed: boolean; error?: string; current?: number; limit?: number | null }> {
  const plan = await getOrganizationPlan(organizationId)
  const currentCount = await countOrganizationUsers(organizationId)
  const limitCheck = checkUserLimit(currentCount, plan)

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      error: getLimitErrorMessage('users', plan, limitCheck.current, limitCheck.limit),
      current: limitCheck.current,
      limit: limitCheck.limit,
    }
  }

  return { allowed: true }
}

