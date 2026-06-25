import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    const itemId = params.id;

    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const marathiName = String(body?.marathiName ?? body?.nameMr ?? "").trim();
    const englishName = String(body?.englishName ?? body?.nameEn ?? "").trim();
    const categoryId = String(body?.categoryId ?? "").trim();
    const categoryName = String(body?.categoryName ?? body?.category ?? "").trim();
    const halfPrice = body?.halfPrice ?? body?.half;
    const fullPrice = body?.fullPrice ?? body?.full;

    if (!marathiName || !categoryId || !categoryName || fullPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const db = await getDb();
    const category = await db.collection("categories").findOne({ _id: new ObjectId(categoryId) });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const result = await db.collection("menuitems").findOneAndUpdate(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          marathiName,
          englishName,
          categoryId,
          categoryName,
          halfPrice: halfPrice == null ? undefined : Number(halfPrice),
          fullPrice: Number(fullPrice),
        },
      },
      { returnDocument: "after" },
    );

    if (!result || !result.value) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: result.value._id.toString(),
        nameMr: result.value.marathiName,
        nameEn: result.value.englishName,
        category: result.value.categoryName,
        categoryId: result.value.categoryId,
        half: result.value.halfPrice,
        full: result.value.fullPrice,
        createdAt: result.value.createdAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/menuitems/:id error", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const itemId = params.id;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("menuitems").deleteOne({ _id: new ObjectId(itemId) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/menuitems/:id error", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
