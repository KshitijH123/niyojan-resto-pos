import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const serializeBill = (bill: any) => {
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
  return {
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
};

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const params = url.searchParams;

    const filter = params.get("filter") || "all";
    const monthParam = params.get("month");
    const yearParam = params.get("year");
    const fromParam = params.get("from");
    const toParam = params.get("to");
    const page = Math.max(1, Number(params.get("page") || "1"));
    const limit = Math.max(1, Math.min(1000, Number(params.get("limit") || "50")));

    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();

    const startOfDay = (d: Date) => {
      const r = new Date(d);
      r.setUTCHours(0, 0, 0, 0);
      return r;
    };
    const endOfDay = (d: Date) => {
      const r = new Date(d);
      r.setUTCHours(23, 59, 59, 999);
      return r;
    };

    if (fromParam && toParam) {
      // custom range provided
      const from = new Date(fromParam);
      const to = new Date(toParam);
      start = startOfDay(from);
      end = endOfDay(to);
    } else if (monthParam && yearParam) {
      const mo = Number(monthParam) - 1;
      const yr = Number(yearParam);
      start = new Date(Date.UTC(yr, mo, 1, 0, 0, 0, 0));
      const lastDay = new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate();
      end = new Date(Date.UTC(yr, mo, lastDay, 23, 59, 59, 999));
    } else {
      if (filter === "today") {
        start = startOfDay(now);
        end = endOfDay(now);
      } else if (filter === "yesterday") {
        const y = new Date(now);
        y.setUTCDate(y.getUTCDate() - 1);
        start = startOfDay(y);
        end = endOfDay(y);
      } else if (filter === "week") {
        const w = new Date(now);
        w.setUTCDate(w.getUTCDate() - 6);
        start = startOfDay(w);
        end = endOfDay(now);
      } else if (filter === "month") {
        const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
        start = startOfDay(first);
        end = endOfDay(last);
      } else {
        // all -> no date filter
        start = null;
        end = null;
      }
    }

    const query: any = {};
    if (start && end) {
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      query.createdAt = { $gte: startIso, $lte: endIso };
    }

    // additional server-side options: pagination
    const total = await db.collection("bills").countDocuments(query);
    const cursor = db.collection("bills").find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const docs = await cursor.toArray();
    const bills = docs.map(serializeBill);

    return NextResponse.json({ bills, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error("GET /api/bills error", error);
    return NextResponse.json({ error: "Failed to load bills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerName = String(body.customerName ?? "").trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = Number(body.subtotal);
    const gstApplied = Boolean(body.gstApplied);
    const gstPercentage = Number(body.gstPercentage ?? 0);
    const gstAmount = Number(body.gstAmount);
    const discount = Number(body.discount);
    const grandTotal = Number(body.grandTotal);
    const paymentMethod = String(body.paymentMethod ?? "Cash");

    if (!items.length || isNaN(subtotal) || isNaN(gstAmount) || isNaN(discount) || isNaN(grandTotal)) {
      return NextResponse.json({ error: "Invalid bill payload" }, { status: 400 });
    }

    const db = await getDb();
    const updateResult = await db.collection("billCounter").findOneAndUpdate(
      { _id: "billCounter" },
      { $inc: { lastBillNumber: 1 } },
      { upsert: true, returnDocument: "after" },
    );

    let sequence = updateResult.value?.lastBillNumber;
    if (typeof sequence !== "number") {
      const counterDoc = await db.collection("billCounter").findOne({ _id: "billCounter" });
      sequence = counterDoc?.lastBillNumber ?? 1;
      if (typeof sequence !== "number") {
        sequence = 1;
        await db.collection("billCounter").updateOne(
          { _id: "billCounter" },
          { $set: { lastBillNumber: sequence } },
          { upsert: true },
        );
      }
    }

    const billNumber = `BILL-${String(sequence).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();

    const bill = {
      billNo: sequence,
      billNumber,
      customerName: customerName || null,
      items: items.map((item: any) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        type: item.type,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal,
      gstApplied,
      gstPercentage,
      gstAmount,
      discount,
      grandTotal,
      paymentMethod,
      createdAt,
    };

    const result = await db.collection("bills").insertOne(bill);
    return NextResponse.json({ ...serializeBill({ ...bill, _id: result.insertedId }), id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bills error", error);
    return NextResponse.json({ error: "Failed to save bill" }, { status: 500 });
  }
}
