import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db
      .collection("categories")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        createdAt: category.createdAt,
      })),
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/categories error", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("categories").findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const createdAt = new Date().toISOString();
    const result = await db.collection("categories").insertOne({ name, createdAt });

    return NextResponse.json(
      { id: result.insertedId.toString(), name, createdAt },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/categories error", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
