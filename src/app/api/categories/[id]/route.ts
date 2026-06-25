import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const db = await getDb();
    const params = await context.params;
    const categoryId = params.id;
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const existing = await db.collection("categories").findOne({ name, _id: { $ne: new ObjectId(categoryId) } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const result = await db.collection("categories").findOneAndUpdate(
      { _id: new ObjectId(categoryId) },
      { $set: { name } },
      { returnDocument: "after" },
    );

    if (!result || !result.value) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await db.collection("menuitems").updateMany(
      { categoryId: categoryId },
      { $set: { categoryName: name } },
    );

    return NextResponse.json({ id: result.value._id.toString(), name: result.value.name, createdAt: result.value.createdAt }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/categories/:id error", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const categoryId = params.id;
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const db = await getDb();
    const categoryObjectId = new ObjectId(categoryId);
    const linkedItem = await db.collection("menuitems").findOne({ categoryId: categoryId });
    if (linkedItem) {
      return NextResponse.json({ error: "Cannot delete category while menu items depend on it" }, { status: 409 });
    }

    const result = await db.collection("categories").deleteOne({ _id: categoryObjectId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/categories/:id error", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
