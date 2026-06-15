"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { useData } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { Receipt } from "@/components/receipt";
import type { Bill } from "@/lib/store";

type FilterKey = "today" | "yesterday" | "week" | "month" | "all";

export default function HistoryPage() {
  const bills = useData((s) => s.bills);
  const settings = useData((s) => s.settings);
  const setBills = useData((s) => s.setBills);

  const [filter, setFilter] = useState<FilterKey>("today");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchedBills, setFetchedBills] = useState<Bill[]>([]);
  const [reprint, setReprint] = useState<Bill | null>(null);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const fetchBills = async (opts?: { filter?: string; page?: number; limit?: number; month?: number; year?: number; }) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("page", String(opts?.page ?? page));
      p.set("limit", String(opts?.limit ?? limit));
      const f = opts?.filter ?? filter;
      if (f && f !== "all") p.set("filter", f);
      if (opts?.month && opts?.year) {
        p.set("month", String(opts.month));
        p.set("year", String(opts.year));
      }

      const url = `/api/bills?${p.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to fetch bills", await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list: Bill[] = data.bills || [];
      setFetchedBills(list);
      setBills(list);
      setTotal(data.total || list.length);
      setPage(data.page || 1);
      setLimit(data.limit || limit);
    } catch (error) {
      console.error("Error loading bills", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills({ filter, page, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, limit]);

  const applyMonthFilter = () => {
    setPage(1);
    fetchBills({ month, year, page: 1, limit });
  };

  const refresh = () => fetchBills({ filter, page, limit });

  const totalRevenue = useMemo(() => fetchedBills.reduce((s, b) => s + b.total, 0), [fetchedBills]);
  const avg = fetchedBills.length ? totalRevenue / fetchedBills.length : 0;

  const printBillById = async (id: string) => {
    try {
      const res = await fetch(`/api/bills/${id}`);
      if (!res.ok) {
        console.error("Failed to fetch bill");
        return;
      }
      const b = await res.json();
      setReprint(b);
      setTimeout(() => window.print(), 200);
    } catch (error) {
      console.error(error);
    }
  };

  const generatePDF = async (list: Bill[]) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    const lineHeight = 5;
    const leftMargin = 15;

    // Header
    doc.setFontSize(20);
    doc.text("Niyojan Resto", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    doc.setFontSize(16);
    doc.text("Billing Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Report Information
    doc.setFontSize(10);
    let reportType = "";
    if (filter === "today") reportType = "Today";
    else if (filter === "yesterday") reportType = "Yesterday";
    else if (filter === "week") reportType = "Week";
    else if (filter === "month") reportType = `Month: ${months[month - 1]} ${year}`;
    else if (filter === "all") reportType = "All Records";

    doc.text(`Report Type: ${reportType}`, leftMargin, yPos);
    yPos += lineHeight;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN") + " " + now.toLocaleTimeString("en-IN");
    doc.text(`Generated On: ${formattedDate}`, leftMargin, yPos);
    yPos += 10;

    // Summary Cards
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Report Summary", leftMargin, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const totalGst = list.reduce((s, b) => s + (b.gst || 0), 0);
    const totalDiscount = list.reduce((s, b) => s + (b.discount || 0), 0);
    const netRevenue = totalRevenue - totalGst - totalDiscount;

    doc.text(`Total Bills: ${list.length}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Average Bill: Rs. ${avg.toFixed(2)}`, leftMargin, yPos);
    yPos += 10;

    // Manual Table Implementation
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    const colWidths = [25, 25, 25, 15, 20, 12, 18, 20];
    const headers = ["Bill No", "Date", "Customer", "Items", "Payment", "GST", "Discount", "Total"];
    let xPos = leftMargin;
    const headerY = yPos;
    
    // Draw header background
    doc.setFillColor(34, 97, 54);
    doc.rect(leftMargin, headerY - 5, pageWidth - 30, 8, "F");
    
    // Draw header text
    doc.setTextColor(255, 255, 255);
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, headerY, { maxWidth: colWidths[i] - 4 });
      xPos += colWidths[i];
    });
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    // Draw rows
    const rowHeight = 6;
    list.forEach((b) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 15;
      }
      
      const row = [
        b.billNumber || `BILL-${String(b.billNo).padStart(4, "0")}`,
        new Date(b.date).toLocaleDateString("en-IN"),
        b.customer || b.customerName || "Walk-in Customer",
        b.items.length.toString(),
        b.paymentType || "",
        b.gstApplied ? "Yes" : "No",
        `Rs. ${(b.discount || 0).toFixed(2)}`,
        `Rs. ${(b.total || 0).toFixed(2)}`,
      ];
      
      xPos = leftMargin;
      row.forEach((cell, i) => {
        doc.text(cell, xPos + 2, yPos, { maxWidth: colWidths[i] - 4 });
        xPos += colWidths[i];
      });
      
      doc.setDrawColor(200);
      doc.line(leftMargin, yPos + 2, pageWidth - 15, yPos + 2);
      yPos += rowHeight;
    });
    
    yPos += 5;

    // Grand Total Section
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("----------------------------------------", leftMargin, yPos);
    yPos += lineHeight + 2;
    doc.text(`Total Bills: ${list.length}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Total GST Collected: Rs. ${totalGst.toFixed(2)}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Total Discount Given: Rs. ${totalDiscount.toFixed(2)}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text(`Net Revenue: Rs. ${netRevenue.toFixed(2)}`, leftMargin, yPos);
    yPos += lineHeight;
    doc.text("----------------------------------------", leftMargin, yPos);

    // Download
    const filename = filter === "month" ? `Billing_Report_${months[month - 1]}_${year}.pdf` : `Billing_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };



  const filters: { k: FilterKey; label: string }[] = [
    { k: "today", label: "आज / Today" },
    { k: "yesterday", label: "Yesterday" },
    { k: "week", label: "Week" },
    { k: "month", label: "Month" },
    { k: "all", label: "All" },
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const years = Array.from({length: 8}).map((_,i) => new Date().getFullYear() - 4 + i);

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-6 no-print">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">बिल इतिहास</h1>
          <p className="text-muted-foreground">All generated bills</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={async () => await generatePDF(fetchedBills)} disabled={loading || fetchedBills.length===0}>
            <Download className="size-4 mr-1" /> Download Report
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => { setFilter(f.k); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === f.k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "month" && (
        <div className="flex items-center gap-2 pt-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded bg-background">
            {months.map((m, idx) => (
              <option key={m} value={idx+1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded bg-background">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button size="sm" onClick={applyMonthFilter}>Show Data</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Bills</div>
          <div className="text-2xl font-bold">{fetchedBills.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-2xl font-bold">₹{totalRevenue.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Bill</div>
          <div className="text-2xl font-bold">₹{avg.toFixed(0)}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading bills…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Bill No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>GST</th>
                <th>Discount</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fetchedBills.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3 font-mono">{b.billNumber || `BILL-${String(b.billNo).padStart(4, "0")}`}</td>
                  <td>{new Date(b.date).toLocaleString("en-IN")}</td>
                  <td>{b.customer || b.customerName || "Walk-in Customer"}</td>
                  <td>{b.items.length}</td>
                  <td>{b.paymentType}</td>
                  <td>{b.gstApplied ? "Yes" : "No"}</td>
                  <td>₹{(b.discount||0).toFixed(2)}</td>
                  <td className="text-right font-medium">₹{(b.total||0).toFixed(2)}</td>
                  <td>
                    <Button size="icon" variant="ghost" onClick={() => printBillById(b.id)}>
                      <Printer className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {fetchedBills.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">No bills in this period</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing page {page} — {total} total</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { if(page>1) { setPage(page-1); } }} disabled={page<=1 || loading}>Prev</Button>
          <Button size="sm" onClick={() => { if(page*limit < total) { setPage(page+1); } }} disabled={page*limit >= total || loading}>Next</Button>
        </div>
      </div>

      {reprint && <Receipt bill={reprint} settings={settings} />}
    </div>
  );
}
