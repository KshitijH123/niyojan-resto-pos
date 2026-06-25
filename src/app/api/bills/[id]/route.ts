import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    const db = await getDb();
    const bill = await db.collection("bills").findOne({ _id: new ObjectId(id) });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const {
      _id,
      createdAt,
      billNumber,
      billNo,
      gstAmount,
      paymentMethod,
      items,
      subtotal,
      grandTotal,
      ...rest
    } = bill;

    const computedBillNo = typeof billNo === "number" ? billNo : (billNumber ? Number((String(billNumber).split("-")[1] || "0")) : 0);
    const computedTotal = bill.total ?? grandTotal ?? subtotal ?? 0;

    const customer = bill.customerName || bill.customer || "Walk-in Customer";
    const serialized = {
      id: _id.toString(),
      billNo: computedBillNo,
      billNumber: billNumber ?? `BILL-${String(computedBillNo).padStart(4, "0")}`,
      customer,
      customerName: bill.customerName ?? bill.customer ?? null,
      date: createdAt || bill.date || new Date().toISOString(),
      items: items || [],
      subtotal: subtotal ?? 0,
      gst: bill.gst ?? gstAmount ?? 0,
      gstApplied: bill.gstApplied ?? false,
      gstPercentage: bill.gstPercentage ?? 0,
      discount: bill.discount ?? 0,
      total: computedTotal,
      paymentType: paymentMethod ?? bill.paymentType ?? "Cash",
      ...rest,
    };

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error("GET /api/bills/[id] error", error);
    return NextResponse.json({ error: "Failed to load bill" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("bills").deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/bills/[id] error", error);
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
