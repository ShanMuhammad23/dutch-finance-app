/**
 * Plan Limits Configuration
 * Defines limits for each subscription plan
 */

export type SubscriptionPlan = 'free' | 'basic' | 'plus' | 'pro'

export interface PlanLimits {
  maxUsers: number | null // null = unlimited
  maxInvoicesPerMonth: number | null // null = unlimited
  maxRevenuePerYear?: number | null // in DKK, null = unlimited
  features: {
    basicOCR: boolean
    advancedOCR?: boolean
    bankFeeds?: boolean
    peppolEInvoice?: boolean
    workflows?: boolean
    advancedWorkflows?: boolean
    multiCurrency?: boolean
    apiWebhooks?: boolean
    accountantPortal?: boolean
    aiAssistant?: boolean
    batchImports?: boolean
    auditExports?: boolean
    customRoles?: boolean
    advancedAnalytics?: boolean
  }
  support: 'email' | 'phone' | 'priority'
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxUsers: 1,
    maxInvoicesPerMonth:3,
    maxRevenuePerYear: 100000, // 100k DKK/year
    features: {
      basicOCR: true,
      advancedOCR: false,
      bankFeeds: false,
      peppolEInvoice: false,
      workflows: false,
      advancedWorkflows: false,
      multiCurrency: false,
      apiWebhooks: false,
      accountantPortal: false,
      aiAssistant: false,
      batchImports: false,
      auditExports: false,
      customRoles: false,
      advancedAnalytics: false,
    },
    support: 'email',
  },
  basic: {
    maxUsers: 2,
    maxInvoicesPerMonth: 50,
    maxRevenuePerYear: null,
    features: {
      basicOCR: true,
      advancedOCR: false,
      bankFeeds: true,
      peppolEInvoice: true,
      workflows: false,
      advancedWorkflows: false,
      multiCurrency: false,
      apiWebhooks: false,
      accountantPortal: false,
      aiAssistant: false,
      batchImports: false,
      auditExports: false,
      customRoles: false,
      advancedAnalytics: false,
    },
    support: 'email',
  },
  plus: {
    maxUsers: 5,
    maxInvoicesPerMonth: null, // unlimited
    maxRevenuePerYear: null,
    features: {
      basicOCR: true,
      advancedOCR: false,
      bankFeeds: true,
      peppolEInvoice: true,
      workflows: true,
      advancedWorkflows: false,
      multiCurrency: true,
      apiWebhooks: true,
      accountantPortal: true,
      aiAssistant: false,
      batchImports: false,
      auditExports: false,
      customRoles: false,
      advancedAnalytics: false,
    },
    support: 'phone',
  },
  pro: {
    maxUsers: null, // unlimited
    maxInvoicesPerMonth: null, // unlimited
    maxRevenuePerYear: null,
    features: {
      basicOCR: true,
      advancedOCR: true,
      bankFeeds: true,
      peppolEInvoice: true,
      workflows: true,
      advancedWorkflows: true,
      multiCurrency: true,
      apiWebhooks: true,
      accountantPortal: true,
      aiAssistant: true,
      batchImports: true,
      auditExports: true,
      customRoles: true,
      advancedAnalytics: true,
    },
    support: 'priority',
  },
}

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(plan: string): PlanLimits {
  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.free
}

/**
 * Check if a plan allows unlimited users
 */
export function hasUnlimitedUsers(plan: string): boolean {
  const limits = getPlanLimits(plan)
  return limits.maxUsers === null
}

/**
 * Check if a plan allows unlimited invoices
 */
export function hasUnlimitedInvoices(plan: string): boolean {
  const limits = getPlanLimits(plan)
  return limits.maxInvoicesPerMonth === null
}

/**
 * Check if user count exceeds plan limit
 */
export function checkUserLimit(
  currentUserCount: number,
  plan: string
): { allowed: boolean; limit: number | null; current: number } {
  const limits = getPlanLimits(plan)
  
  if (limits.maxUsers === null) {
    return { allowed: true, limit: null, current: currentUserCount }
  }
  
  return {
    allowed: currentUserCount < limits.maxUsers,
    limit: limits.maxUsers,
    current: currentUserCount,
  }
}

/**
 * Check if invoice count exceeds plan limit for current month
 */
export function checkInvoiceLimit(
  currentInvoiceCount: number,
  plan: string
): { allowed: boolean; limit: number | null; current: number } {
  const limits = getPlanLimits(plan)
  
  if (limits.maxInvoicesPerMonth === null) {
    return { allowed: true, limit: null, current: currentInvoiceCount }
  }
  
  return {
    allowed: currentInvoiceCount < limits.maxInvoicesPerMonth,
    limit: limits.maxInvoicesPerMonth,
    current: currentInvoiceCount,
  }
}

/**
 * Get user-friendly error message for limit exceeded
 */
export function getLimitErrorMessage(
  limitType: 'users' | 'invoices',
  plan: string,
  current: number,
  limit: number | null
): string {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
  
  if (limitType === 'users') {
    if (limit === null) {
      return 'Unlimited users allowed'
    }
    return `Your ${planName} plan allows up to ${limit} user${limit > 1 ? 's' : ''}. You currently have ${current} user${current !== 1 ? 's' : ''}. Please upgrade your plan to add more users.`
  }
  
  if (limitType === 'invoices') {
    if (limit === null) {
      return 'Unlimited invoices allowed'
    }
    return `Your ${planName} plan allows up to ${limit} invoices per month. You have already created ${current} invoice${current !== 1 ? 's' : ''} this month. Please upgrade your plan to create more invoices.`
  }
  
  return 'Limit exceeded'
}

