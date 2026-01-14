import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { checkInvoiceLimit, checkUserLimit, getPlanLimits } from '@/lib/plan-limits'
import { countInvoicesThisMonth, countOrganizationUsers, getOrganizationPlan } from '@/lib/plan-utils'

/**
 * GET /api/organizations/[id]/limits
 * Get current usage and limits for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = Number(id)

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const organization = await queryOne<{ subscription_plan: string }>(
      'SELECT subscription_plan FROM organizations WHERE id = $1',
      [organizationId]
    )

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const plan = organization.subscription_plan || 'free'
    const limits = getPlanLimits(plan)

    // Get current usage
    const invoiceCount = await countInvoicesThisMonth(organizationId)
    const userCount = await countOrganizationUsers(organizationId)

    // Check limits
    const invoiceLimitCheck = checkInvoiceLimit(invoiceCount, plan)
    const userLimitCheck = checkUserLimit(userCount, plan)

    return NextResponse.json({
      plan,
      limits: {
        users: {
          current: userLimitCheck.current,
          limit: userLimitCheck.limit,
          allowed: userLimitCheck.allowed,
        },
        invoices: {
          current: invoiceLimitCheck.current,
          limit: invoiceLimitCheck.limit,
          allowed: invoiceLimitCheck.allowed,
        },
      },
      features: limits.features,
      support: limits.support,
    })
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

