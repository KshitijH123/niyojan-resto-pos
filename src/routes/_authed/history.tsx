import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Receipt } from "@/components/receipt";
import type { Bill } from "@/lib/store";

export const Route = createFileRoute("/_authed/history")({
  head: () => ({ meta: [{ title: "Bill History — Niyojan Resto" }] }),
  component: HistoryPage,
});

type FilterKey = "today" | "yesterday" | "week" | "month" | "all";

function HistoryPage() {
  const bills = useData((s) => s.bills);
  const settings = useData((s) => s.settings);
  const [filter, setFilter] = useState<FilterKey>("today");
  const [reprint, setReprint] = useState<Bill | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return bills.filter((b) => {
      const d = new Date(b.date);
      if (filter === "all") return true;
      if (filter === "today") return d.toDateString() === now.toDateString();
      if (filter === "yesterday") {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return d.toDateString() === y.toDateString();
      }
      const diff = (now.getTime() - d.getTime()) / 86400000;
      if (filter === "week") return diff <= 7;
      if (filter === "month") return diff <= 31;
      return true;
    });
  }, [bills, filter]);

  const total = filtered.reduce((s, b) => s + b.total, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  const reprintBill = (b: Bill) => {
    setReprint(b);
    setTimeout(() => window.print(), 100);
  };

  const filters: { k: FilterKey; label: string }[] = [
    { k: "today", label: "आज / Today" },
    { k: "yesterday", label: "Yesterday" },
    { k: "week", label: "Week" },
    { k: "month", label: "Month" },
    { k: "all", label: "All" },
  ];

  return (
    <div className="p-6 space-y-6 no-print">
      <div>
        <h1 className="text-3xl font-bold">बिल इतिहास</h1>
        <p className="text-muted-foreground">All generated bills</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === f.k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Bills</div>
          <div className="text-2xl font-bold">{filtered.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-2xl font-bold">₹{total.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Bill</div>
          <div className="text-2xl font-bold">₹{avg.toFixed(0)}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="p-3">Bill No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th className="text-right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono">#{b.billNo}</td>
                <td>{new Date(b.date).toLocaleString("en-IN")}</td>
                <td>{b.customer || "—"}</td>
                <td>{b.items.length}</td>
                <td>{b.paymentType}</td>
                <td className="text-right font-medium">₹{b.total.toFixed(2)}</td>
                <td>
                  <Button size="icon" variant="ghost" onClick={() => reprintBill(b)}>
                    <Printer className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No bills in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {reprint && <Receipt bill={reprint} settings={settings} />}
    </div>
  );
}
