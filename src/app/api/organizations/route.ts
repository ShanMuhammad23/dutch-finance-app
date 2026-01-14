import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { auth } from '../auth/[...nextauth]/route';
import { logActivityFromRequest } from '@/lib/activity-log';

// GET all organizations for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = await queryMany(
      'SELECT * FROM organizations WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'organization',
        {
          description: `Viewed organizations list`,
          details: { user_id: userId, count: data.length },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...organizationData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!organizationData.business_type || !organizationData.company_name) {
      return NextResponse.json(
        { error: 'Business type and company name are required' },
        { status: 400 }
      );
    }

    // Build INSERT query dynamically
    const fields = Object.keys(organizationData)
    const values = Object.values(organizationData)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const fieldNames = fields.join(', ')

    const data = await queryOne(
      `INSERT INTO organizations (${fieldNames}, created_by)
       VALUES (${placeholders}, $${fields.length + 1})
       RETURNING *`,
      [...values, userId]
    );

    if (!data) {
      console.error('Error creating organization: No data returned');
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'CREATE',
        'organization',
        {
          entity_id: data.id,
          organization_id: data.id,
          description: `Created organization: ${data.company_name}`,
          details: {
            organization_id: data.id,
            company_name: data.company_name,
            business_type: data.business_type,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

