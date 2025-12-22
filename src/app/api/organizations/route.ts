import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

