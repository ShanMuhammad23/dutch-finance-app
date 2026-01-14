"use server";

import { NextRequest, NextResponse } from "next/server";

import { queryMany, queryOne } from "@/lib/db";
import { CreateProductInput, Product, ProductAccountCode } from "@/lib/types";
import { auth } from '../auth/[...nextauth]/route';
import { logActivityFromRequest } from '@/lib/activity-log';

const ACCOUNT_CODES: Record<ProductAccountCode, string> = {
  "1000": "Quota",
  "1010": "Quota, Passive members",
  "1100": "Activity allowance",
  "1110": "Coaching allowance",
  "1120": "Course and training grants",
  "1130": "Other grants",
  "1200": "Sponsorship income",
  "1210": "Income from conventions, events, etc.",
  "1220": "Other Income",
  "1230": "Reminder fees",
  "9000": "Interest income",
  "9010": "Financial income, other",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const parsedId = Number(organizationId);

    if (Number.isNaN(parsedId)) {
      return NextResponse.json(
        { error: "Organization ID must be a valid number" },
        { status: 400 },
      );
    }

    const data = await queryMany<Product>(
      "SELECT * FROM products WHERE organization_id = $1 ORDER BY updated_at DESC",
      [parsedId]
    );

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'product',
        {
          organization_id: parsedId,
          description: `Viewed products list`,
          details: { organization_id: parsedId, count: data.length },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductInput = await request.json();

    if (
      !body.organization_id ||
      !body.name ||
      typeof body.price_excl_vat !== "number" ||
      Number.isNaN(body.price_excl_vat)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!(body.account_code in ACCOUNT_CODES)) {
      return NextResponse.json(
        { error: "Invalid account code" },
        { status: 400 },
      );
    }

    const insertPayload = {
      organization_id: body.organization_id,
      name: body.name,
      product_code: body.product_code ?? null,
      quantity: typeof body.quantity === "number" ? body.quantity : 1,
      unit: body.unit ?? "stk.",
      price_excl_vat: body.price_excl_vat,
      account_code: body.account_code,
      comment: body.comment ?? null,
    };

    const data = await queryOne<Product>(
      `INSERT INTO products (organization_id, name, product_code, quantity, unit, price_excl_vat, account_code, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        insertPayload.organization_id,
        insertPayload.name,
        insertPayload.product_code,
        insertPayload.quantity,
        insertPayload.unit,
        insertPayload.price_excl_vat,
        insertPayload.account_code,
        insertPayload.comment,
      ]
    );

    if (!data) {
      console.error("Error creating product: No data returned");
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 },
      );
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'CREATE',
        'product',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Created product: ${data.name}`,
          details: {
            product_id: data.id,
            name: data.name,
            price_excl_vat: data.price_excl_vat,
            account_code: data.account_code,
            organization_id: data.organization_id,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data as Product, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/products:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}


