import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.collection("menuitems").find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(
      items.map((item) => ({
        id: item._id.toString(),
        nameMr: item.marathiName,
        nameEn: item.englishName,
        category: item.categoryName,
        categoryId: item.categoryId,
        half: item.halfPrice,
        full: item.fullPrice,
        createdAt: item.createdAt,
      })),
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/menu error", error);
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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

    const createdAt = new Date().toISOString();
    const item = {
      marathiName,
      englishName,
      categoryId,
      categoryName,
      halfPrice: halfPrice == null ? undefined : Number(halfPrice),
      fullPrice: Number(fullPrice),
      createdAt,
    };

    const result = await db.collection("menuitems").insertOne(item);
    return NextResponse.json(
      { ...item, id: result.insertedId.toString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/menu error", error);
    return NextResponse.json({ error: "Failed to save menu item" }, { status: 500 });
  }
}
