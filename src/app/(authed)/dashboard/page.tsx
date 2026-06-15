"use client";

import { useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/store";
import {
  Receipt,
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  CalendarRange,
} from "lucide-react";

export default function Dashboard() {
  const setBills = useData((s) => s.setBills);
  const bills = useData((s) => s.bills);

  useEffect(() => {
    const loadBills = async () => {
      try {
        const response = await fetch("/api/bills");
        if (!response.ok) return;
        const data = await response.json();
        setBills(data.bills || []);
      } catch (error) {
        console.error("Failed to load bills", error);
      }
    };
    loadBills();
  }, [setBills]);

  const safeNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const stats = useMemo(() => {
    if (!Array.isArray(bills)) return { todayOrders: 0, todayRevenue: 0, monthRevenue: 0, totalBills: 0, avg: 0 };
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const todayBills = bills.filter((b) => new Date(b.date).toDateString() === today);
    const monthBills = bills.filter((b) => {
      const d = new Date(b.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const sum = (arr: typeof bills) => arr.reduce((s, b) => s + safeNumber(b.total), 0);
    const total = sum(bills);
    return {
      todayOrders: todayBills.length,
      todayRevenue: sum(todayBills),
      monthRevenue: sum(monthBills),
      totalBills: bills.length,
      avg: bills.length ? total / bills.length : 0,
    };
  }, [bills]);

  const daily = useMemo(() => {
    if (!Array.isArray(bills)) return Array.from({ length: 7 }, (_, i) => ({ day: "", revenue: 0 }));
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toLocaleDateString("en-IN", { weekday: "short" }), 0);
    }
    bills.forEach((b) => {
      const d = new Date(b.date);
      const diff = (Date.now() - d.getTime()) / 86400000;
      if (diff <= 7) {
        const k = d.toLocaleDateString("en-IN", { weekday: "short" });
        map.set(k, (map.get(k) || 0) + safeNumber(b.total));
      }
    });
    return Array.from(map, ([day, revenue]) => ({ day, revenue }));
  }, [bills]);

  const topItems = useMemo(() => {
    if (!Array.isArray(bills)) return [];
    const map = new Map<string, number>();
    bills.forEach((b) =>
      b.items?.forEach((i) =>
        map.set(i.nameMr, (map.get(i.nameMr) || 0) + safeNumber(i.qty)),
      ),
    );
    return Array.from(map, ([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [bills]);

  const cards = [
    { label: "आजच्या ऑर्डर्स", en: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag },
    { label: "आजचे उत्पन्न", en: "Today's Revenue", value: `₹${safeNumber(stats.todayRevenue).toFixed(0)}`, icon: IndianRupee },
    { label: "महिन्याचे उत्पन्न", en: "Month Revenue", value: `₹${safeNumber(stats.monthRevenue).toFixed(0)}`, icon: CalendarRange },
    { label: "एकूण बिले", en: "Total Bills", value: stats.totalBills, icon: Receipt },
    { label: "सरासरी ऑर्डर", en: "Avg Order", value: `₹${safeNumber(stats.avg).toFixed(0)}`, icon: TrendingUp },
  ];

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">डॅशबोर्ड</h1>
        <p className="text-muted-foreground">Overview of your restaurant performance</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {cards.map((c) => (
          <Card key={c.en}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <c.icon className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.en}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue / साप्ताहिक उत्पन्न</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="md:h-[260px]">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items / लोकप्रिय पदार्थ</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No sales data yet. Create a bill to see analytics.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200} className="md:h-[260px]">
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qty" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders / अलीकडील ऑर्डर्स</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2">Bill No</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(bills) && bills.slice(0, 8).map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2 font-mono">#{b.billNo}</td>
                    <td>{new Date(b.date).toLocaleString("en-IN")}</td>
                    <td>{b.items.length}</td>
                    <td>{b.paymentType}</td>
                    <td className="text-right font-medium">₹{b.total.toFixed(2)}</td>
                  </tr>
                ))}
                {(!Array.isArray(bills) || bills.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No bills generated yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
