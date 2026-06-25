"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, Trash2, Printer, Save, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useData, type BillItem, type Bill } from "@/lib/store";
import { type MenuItem } from "@/lib/menu-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Receipt } from "@/components/receipt";

export default function BillingPage() {
  const menu = useData((s) => s.menu);
  const categories = useData((s) => s.categories);
  const categoryEntities = useData((s) => s.categoryEntities);
  const setMenuItems = useData((s) => s.setMenuItems);
  const setCategoryEntities = useData((s) => s.setCategoryEntities);
  const settings = useData((s) => s.settings);
  const addBill = useData((s) => s.addBill);

  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [gstOn, setGstOn] = useState(false);
  const [payment, setPayment] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [saving, setSaving] = useState(false);
  const addMenuItem = useData((s) => s.addMenuItem);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newMenu, setNewMenu] = useState<Omit<MenuItem, "id">>({
    nameMr: "",
    nameEn: "",
    category: categories[0] ?? "General",
    half: undefined,
    full: 0,
  });

  const resetNewMenu = () =>
    setNewMenu({
      nameMr: "",
      nameEn: "",
      category: categories[0] ?? "General",
      half: undefined,
      full: 0,
    });

  const openMenuDialog = () => {
    resetNewMenu();
    setMenuOpen(true);
  };

  const saveNewMenu = async () => {
    const categoryName = newMenu.category.trim() || "General";
    if (!newMenu.nameMr.trim() || newMenu.full <= 0) return;

    const category = categoryEntities.find((item) => item.name === categoryName);
    if (!category) {
      console.error("Invalid category selected");
      return;
    }

    try {
      const response = await fetch("/api/menuitems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marathiName: newMenu.nameMr,
          englishName: newMenu.nameEn,
          categoryId: category.id,
          categoryName: category.name,
          halfPrice: newMenu.half,
          fullPrice: newMenu.full,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save menu item", await response.text());
        return;
      }

      const item = await response.json();
      addMenuItem(item);
      setMenuOpen(false);
      resetNewMenu();
    } catch (error) {
      console.error("Error saving menu item", error);
    }
  };

  const cats = ["All", ...categories];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/menuitems"),
        ]);

        if (!categoriesResponse.ok || !menuResponse.ok) return;

        const categoriesData = await categoriesResponse.json();
        const menuData: MenuItem[] = await menuResponse.json();

        setCategoryEntities(categoriesData);
        setMenuItems(menuData);
      } catch (error) {
        console.error("Failed to load menu items", error);
      }
    };

    loadData();
  }, [setMenuItems, setCategoryEntities]);

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
    setGstOn(false);
    setPayment("Cash");
  };

  const handleSave = async (alsoPrint: boolean) => {
    if (saving) return;
    if (!items.length) {
      toast.error("Add at least one item before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: customer,
        items: items.map((item) => ({
          menuItemId: item.itemId,
          itemName: item.nameMr,
          type: item.type === "half" ? "Half" : "Full",
          quantity: item.qty,
          unitPrice: item.rate,
          totalPrice: item.rate * item.qty,
        })),
        subtotal,
        gstApplied: gstOn,
        gstPercentage: gstOn ? 5 : 0,
        gstAmount: gst,
        discount,
        grandTotal: total,
        paymentMethod: payment,
      };

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save bill.");
        return;
      }

      const bill: Bill = {
        id: data.id,
        billNo: Number(data.billNumber?.split("-")[1] ?? data.billNo ?? 0),
        billNumber: data.billNumber,
        date: data.date,
        customer: data.customerName || "---",
        customerName: data.customerName || "---",
        items,
        subtotal,
        gst,
        gstApplied: gstOn,
        gstPercentage: gstOn ? 5 : 0,
        discount,
        total,
        paymentType: payment,
      };

      addBill(bill);
      setLastBill(bill);
      setItems([]);
      setCustomer("");
      setDiscount(0);
      setGstOn(false);
      setPayment("Cash");
      toast.success(alsoPrint ? "Bill Saved and Printed Successfully" : "Bill Saved Successfully");
      if (alsoPrint) {
        setTimeout(() => window.print(), 500);
      }
    } catch (error) {
      console.error("Failed to save bill", error);
      toast.error("Failed to save bill.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="p-2 md:p-6 h-screen lg:h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 md:gap-6 no-print overflow-hidden">
      <div className="flex flex-col space-y-4 min-w-0 h-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold">बिलिंग / Billing</h1>
          <p className="text-muted-foreground">Select items to add to bill</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="sm" onClick={openMenuDialog} className="w-full sm:w-auto">
            <Plus className="size-4 mr-1" /> Add Menu
          </Button>
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

        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Marathi Name *</Label>
                <Input
                  value={newMenu.nameMr}
                  onChange={(e) => setNewMenu({ ...newMenu, nameMr: e.target.value })}
                />
              </div>
              <div>
                <Label>English Name</Label>
                <Input
                  value={newMenu.nameEn}
                  onChange={(e) => setNewMenu({ ...newMenu, nameEn: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g. थाळी, व्हेज, ड्रिंक्स"
                  value={newMenu.category}
                  onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Half Price</Label>
                  <Input
                    type="number"
                    value={newMenu.half ?? ""}
                    onChange={(e) =>
                      setNewMenu({
                        ...newMenu,
                        half: e.target.value ? +e.target.value : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Full Price *</Label>
                  <Input
                    type="number"
                    value={newMenu.full || ""}
                    onChange={(e) => setNewMenu({ ...newMenu, full: +e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMenuOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveNewMenu} disabled={!newMenu.nameMr.trim() || newMenu.full <= 0}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <div className="flex-1 min-h-0 overflow-y-auto pr-0 lg:pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    ₹{m.full}
                  </Button>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-12">No items</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[420px] self-start lg:sticky lg:top-4 h-full overflow-hidden">
        <Card className="p-5 space-y-4 h-full overflow-y-auto hide-scrollbar">
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
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!items.length || saving}>
            <Save className="size-4 mr-1" /> Save
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!items.length || saving}>
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

      </div>
    </div>
      {lastBill && <Receipt bill={lastBill} settings={settings} />}
    </>
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
