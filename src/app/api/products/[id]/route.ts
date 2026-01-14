"use server";

import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { Product, ProductAccountCode } from "@/lib/types";
import { auth } from '../../auth/[...nextauth]/route';
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

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const data = await queryOne<Product>(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    if (!data) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'VIEW',
        'product',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Viewed product: ${data.name}`,
          details: { product_id: data.id },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const {
      name,
      product_code,
      quantity,
      unit,
      price_excl_vat,
      account_code,
      comment,
    } = body;

    // Validate required fields
    if (!name || typeof price_excl_vat !== "number" || Number.isNaN(price_excl_vat)) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    if (account_code && !(account_code in ACCOUNT_CODES)) {
      return NextResponse.json(
        { error: "Invalid account code" },
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }
    if (product_code !== undefined) {
      updateFields.push(`product_code = $${paramIndex}`);
      updateValues.push(product_code);
      paramIndex++;
    }
    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex}`);
      updateValues.push(quantity);
      paramIndex++;
    }
    if (unit !== undefined) {
      updateFields.push(`unit = $${paramIndex}`);
      updateValues.push(unit);
      paramIndex++;
    }
    if (price_excl_vat !== undefined) {
      updateFields.push(`price_excl_vat = $${paramIndex}`);
      updateValues.push(price_excl_vat);
      paramIndex++;
    }
    if (account_code !== undefined) {
      updateFields.push(`account_code = $${paramIndex}`);
      updateValues.push(account_code);
      paramIndex++;
    }
    if (comment !== undefined) {
      updateFields.push(`comment = $${paramIndex}`);
      updateValues.push(comment);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    updateValues.push(productId);

    const updateQuery = `
      UPDATE products
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const data = await queryOne<Product>(updateQuery, updateValues);

    if (!data) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'UPDATE',
        'product',
        {
          entity_id: data.id,
          organization_id: data.organization_id,
          description: `Updated product: ${data.name}`,
          details: {
            product_id: data.id,
            changes: body,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Get product before deletion for logging
    const product = await queryOne<Product>(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const result = await query(
      "DELETE FROM products WHERE id = $1",
      [productId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'DELETE',
        'product',
        {
          entity_id: productId,
          organization_id: product.organization_id,
          description: `Deleted product: ${product.name}`,
          details: {
            deleted_product_id: productId,
            product_name: product.name,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

