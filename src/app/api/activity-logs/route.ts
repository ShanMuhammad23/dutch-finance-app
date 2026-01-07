import { NextRequest, NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'
import { auth } from '@/lib/auth-config'

// GET - Fetch activity logs with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only owner/admin can view activity logs
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with filters
    let query = `
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email,
        o.company_name as organization_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN organizations o ON al.organization_id = o.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (organizationId) {
      query += ` AND al.organization_id = $${paramIndex}`
      params.push(Number(organizationId))
      paramIndex++
    }

    if (entityType) {
      query += ` AND al.entity_type = $${paramIndex}`
      params.push(entityType)
      paramIndex++
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`
      params.push(action)
      paramIndex++
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const data = await queryMany<any>(query, params)

    // Parse JSON details if present
    const transformedData = data.map((log: any) => ({
      ...log,
      details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null,
    }))

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      WHERE 1=1
    `
    const countParams: any[] = []
    let countParamIndex = 1

    if (organizationId) {
      countQuery += ` AND al.organization_id = $${countParamIndex}`
      countParams.push(Number(organizationId))
      countParamIndex++
    }

    if (entityType) {
      countQuery += ` AND al.entity_type = $${countParamIndex}`
      countParams.push(entityType)
      countParamIndex++
    }

    if (action) {
      countQuery += ` AND al.action = $${countParamIndex}`
      countParams.push(action)
    }

    const countResult = await queryMany<{ total: string }>(countQuery, countParams)
    const total = parseInt(countResult[0]?.total || '0')

    return NextResponse.json(
      {
        logs: transformedData,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/activity-logs:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

