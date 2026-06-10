import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Printer, Save, X, Search } from "lucide-react";
import { useData, type BillItem, type Bill } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Receipt } from "@/components/receipt";

export const Route = createFileRoute("/_authed/billing")({
  head: () => ({ meta: [{ title: "Billing — Niyojan Resto" }] }),
  component: BillingPage,
});

function BillingPage() {
  const menu = useData((s) => s.menu);
  const categories = useData((s) => s.categories);
  const settings = useData((s) => s.settings);
  const saveBill = useData((s) => s.saveBill);

  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [gstOn, setGstOn] = useState(false);
  const [payment, setPayment] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [lastBill, setLastBill] = useState<Bill | null>(null);

  const cats = ["All", ...categories];

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return menu.filter(
      (m) =>
        (cat === "All" || m.category === cat) &&
        (!ql ||
          m.nameMr.toLowerCase().includes(ql) ||
          (m.nameEn || "").toLowerCase().includes(ql)),
    );
  }, [menu, cat, q]);

  const addItem = (itemId: string, type: "half" | "full") => {
    const m = menu.find((x) => x.id === itemId);
    if (!m) return;
    const rate = type === "half" ? m.half! : m.full;
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.itemId === itemId && p.type === type);
      if (idx >= 0) {
        const c = [...prev];
        c[idx] = { ...c[idx], qty: c[idx].qty + 1 };
        return c;
      }
      return [...prev, { itemId, nameMr: m.nameMr, nameEn: m.nameEn, type, rate, qty: 1 }];
    });
  };

  const changeQty = (idx: number, delta: number) =>
    setItems((p) =>
      p
        .map((it, i) => (i === idx ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0),
    );

  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.rate * i.qty, 0);
  const gst = gstOn ? +(subtotal * 0.05).toFixed(2) : 0;
  const total = +(subtotal + gst - discount).toFixed(2);

  const clear = () => {
    setItems([]);
    setCustomer("");
    setDiscount(0);
    setLastBill(null);
  };

  const handleSave = (alsoPrint: boolean) => {
    if (items.length === 0) return;
    const bill = saveBill({
      items,
      customer: customer || undefined,
      subtotal,
      gst,
      discount,
      total,
      paymentType: payment,
    });
    setLastBill(bill);
    if (alsoPrint) setTimeout(() => window.print(), 100);
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 no-print">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">बिलिंग / Billing</h1>
          <p className="text-muted-foreground">Select items to add to bill</p>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="मेनू शोधा / Search menu..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                cat === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <Card key={m.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="mb-1 text-xs text-accent font-medium">{m.category}</div>
              <div className="font-bold text-lg leading-tight">{m.nameMr}</div>
              {m.nameEn && <div className="text-xs text-muted-foreground mb-2">{m.nameEn}</div>}
              <div className="flex gap-2 mt-2">
                {m.half !== undefined && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => addItem(m.id, "half")}>
                    हाफ ₹{m.half}
                  </Button>
                )}
                <Button size="sm" className="flex-1" onClick={() => addItem(m.id, "full")}>
                  फुल ₹{m.full}
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No items</p>
          )}
        </div>
      </div>

      <Card className="p-5 h-fit sticky top-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">बिल सारांश</h2>
          <Button size="sm" variant="ghost" onClick={clear}>
            <X className="size-4" />
          </Button>
        </div>

        <Input placeholder="ग्राहक नाव (Optional)" value={customer} onChange={(e) => setCustomer(e.target.value)} />

        <div className="max-h-[40vh] overflow-auto space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No items selected</p>
          )}
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{it.nameMr}</div>
                <div className="text-xs text-muted-foreground">
                  {it.type === "half" ? "Half" : "Full"} · ₹{it.rate}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="size-7" onClick={() => changeQty(idx, -1)}>
                  <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center font-medium">{it.qty}</span>
                <Button size="icon" variant="outline" className="size-7" onClick={() => changeQty(idx, +1)}>
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="w-16 text-right font-semibold text-sm">₹{it.rate * it.qty}</div>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => removeItem(idx)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm border-t pt-3">
          <Row label="Subtotal" v={subtotal} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={gstOn} onChange={(e) => setGstOn(e.target.checked)} />
              GST (5%)
            </label>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(+e.target.value || 0)}
              className="w-24 h-8 text-right"
            />
          </div>
          <div className="flex items-center justify-between text-xl font-bold pt-2 border-t">
            <span>एकूण / Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Payment</div>
          <div className="grid grid-cols-3 gap-2">
            {(["Cash", "UPI", "Card"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPayment(p)}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  payment === p ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!items.length}>
            <Save className="size-4 mr-1" /> Save
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!items.length}>
            <Printer className="size-4 mr-1" /> Save & Print
          </Button>
        </div>
        {lastBill && (
          <div className="text-xs text-center text-muted-foreground">
            Last saved: #{lastBill.billNo} ·{" "}
            <button className="underline" onClick={() => window.print()}>
              Reprint
            </button>
          </div>
        )}
      </Card>

      {lastBill && <Receipt bill={lastBill} settings={settings} />}
    </div>
  );
}

function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>₹{v.toFixed(2)}</span>
    </div>
  );
}
