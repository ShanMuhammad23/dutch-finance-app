"use server";

import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { CreatePurchaseInput, Purchase, PurchaseLine } from "@/lib/types";

type SupabasePurchase = Omit<
  Purchase,
  "lines" | "attachment_url" | "attachment_name" | "created_at" | "updated_at"
> & {
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
  lines?: PurchaseLine[];
};

function buildPurchaseResponse(
  purchase: SupabasePurchase,
  lines: PurchaseLine[] | undefined,
): Purchase {
  return {
    ...purchase,
    attachment_url: purchase.attachment_url,
    attachment_name: purchase.attachment_name,
    created_at: purchase.created_at,
    updated_at: purchase.updated_at,
    lines,
  };
}

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

    const { data, error } = await supabase
      .from("purchases")
      .select(
        `
          *,
          lines:purchase_lines (
            id,
            purchase_id,
            line_no,
            description,
            amount_incl_vat,
            vat_amount,
            account_code,
            inventory_category,
            created_at,
            updated_at
          )
        `,
      )
      .eq("organization_id", parsedId)
      .order("attachment_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const purchases =
      data?.map((purchase) =>
        buildPurchaseResponse(
          {
            ...purchase,
            lines: undefined,
          },
          purchase.lines ?? undefined,
        ),
      ) ?? [];

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error in GET /api/purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePurchaseInput = await request.json();

    if (
      !body.organization_id ||
      !body.supplier_name ||
      !body.attachment_date ||
      !body.payment_type ||
      typeof body.amount_incl_vat !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const status = body.status ?? "draft";
    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : Math.max(body.amount_incl_vat - (body.vat_amount ?? 0), 0);
    const totalAmount =
      typeof body.total_amount === "number"
        ? body.total_amount
        : body.amount_incl_vat;

    const insertPayload: Record<string, unknown> = {
      organization_id: body.organization_id,
      supplier_name: body.supplier_name,
      payment_type: body.payment_type,
      attachment_date: body.attachment_date,
      inventory_category: body.inventory_category ?? null,
      account_code: body.account_code ?? null,
      description: body.description ?? null,
      amount_incl_vat: body.amount_incl_vat,
      vat_amount: body.vat_amount ?? 0,
      subtotal,
      total_amount: totalAmount,
      status,
      attachment_url: body.attachment_file ?? null,
      attachment_name: body.attachment_name ?? null,
    };

    const { data, error } = await supabase
      .from("purchases")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating purchase:", error);
      return NextResponse.json(
        { error: error?.message ?? "Failed to create purchase" },
        { status: 500 },
      );
    }

    let insertedLines: PurchaseLine[] | undefined = undefined;

    if (Array.isArray(body.lines) && body.lines.length > 0) {
      const linesPayload = body.lines.map((line) => ({
        purchase_id: data.id,
        line_no: line.line_no,
        description: line.description,
        amount_incl_vat: line.amount_incl_vat,
        vat_amount: line.vat_amount,
        account_code: line.account_code ?? null,
        inventory_category: line.inventory_category ?? null,
      }));

      const { data: linesData, error: linesError } = await supabase
        .from("purchase_lines")
        .insert(linesPayload)
        .select();

      if (linesError) {
        console.error("Error inserting purchase lines:", linesError);
        return NextResponse.json(
          { error: linesError.message },
          { status: 500 },
        );
      }

      insertedLines = linesData ?? undefined;
    }

    const fallbackLines: PurchaseLine[] | undefined = body.lines
      ? body.lines.map<PurchaseLine>((line, index) => ({
          id: index + 1,
          purchase_id: data.id,
          line_no: line.line_no,
          description: line.description,
          amount_incl_vat: line.amount_incl_vat,
          vat_amount: line.vat_amount,
          account_code: line.account_code ?? null,
          inventory_category: line.inventory_category ?? null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }))
      : undefined;

    const responseBody = buildPurchaseResponse(
      {
        ...data,
        lines: undefined,
      },
      insertedLines ?? fallbackLines,
    );

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/purchases:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}

