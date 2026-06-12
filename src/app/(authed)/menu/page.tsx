"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X, Check } from "lucide-react";
import { useData } from "@/lib/store";
import { type MenuItem } from "@/lib/menu-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function MenuPage() {
  const {
    menu,
    categories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useData();

  // ── Item dialog ──
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [itemOpen, setItemOpen] = useState(false);

  // ── Category dialog ──
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  const startAdd = () => {
    setEditing({ id: "", nameMr: "", nameEn: "", category: categories[0] ?? "", full: 0 });
    setItemOpen(true);
  };
  const startEdit = (m: MenuItem) => {
    setEditing(m);
    setItemOpen(true);
  };

  const save = () => {
    if (!editing || !editing.nameMr || !editing.full) return;
    if (editing.id) {
      updateMenuItem(editing.id, editing);
    } else {
      const { id: _id, ...rest } = editing;
      addMenuItem(rest);
    }
    setItemOpen(false);
  };

  const handleAddCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    addCategory(name);
    setNewCat("");
  };

  const handleRename = (old: string) => {
    const val = renameVal.trim();
    if (!val || val === old) { setRenamingCat(null); return; }
    renameCategory(old, val);
    setRenamingCat(null);
  };

  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">मेनू व्यवस्थापन</h1>
          <p className="text-muted-foreground text-sm">Manage your menu items and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatOpen(true)}>
            <Tag className="size-4 mr-1" /> Categories
          </Button>
          <Button size="sm" onClick={startAdd}>
            <Plus className="size-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c} variant="secondary" className="text-sm px-3 py-1">
            {c}
          </Badge>
        ))}
        <button
          onClick={() => setCatOpen(true)}
          className="text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
        >
          + Manage
        </button>
      </div>

      {/* Menu grouped by category */}
      {categories
        .filter((cat) => grouped[cat]?.length)
        .map((cat) => (
          <div key={cat}>
            <h2 className="text-xl font-bold mb-3 text-primary">{cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[cat].map((m) => (
                <Card key={m.id} className="p-4 flex justify-between items-start">
                  <div>
                    <div className="font-bold">{m.nameMr}</div>
                    {m.nameEn && <div className="text-xs text-muted-foreground">{m.nameEn}</div>}
                    <div className="text-sm mt-1">
                      {m.half !== undefined && <span className="mr-3">Half ₹{m.half}</span>}
                      <span className={m.half !== undefined ? "text-primary font-semibold" : ""}>
                        Full ₹{m.full}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMenuItem(m.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

      {/* Uncategorised items (category not in list) */}
      {Object.entries(grouped)
        .filter(([cat]) => !categories.includes(cat))
        .map(([cat, list]) => (
          <div key={cat}>
            <h2 className="text-xl font-bold mb-3 text-muted-foreground">{cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((m) => (
                <Card key={m.id} className="p-4 flex justify-between items-start">
                  <div>
                    <div className="font-bold">{m.nameMr}</div>
                    {m.nameEn && <div className="text-xs text-muted-foreground">{m.nameEn}</div>}
                    <div className="text-sm mt-1">
                      {m.half !== undefined && <span className="mr-3">Half ₹{m.half}</span>}
                      <span>Full ₹{m.full}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMenuItem(m.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

      {/* ── Category Management Dialog ── */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-5" /> Category Management
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new */}
            <div>
              <Label className="mb-1 block">New Category</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. थाळी, व्हेज डिशेस…"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* Existing list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) =>
                renamingCat === cat ? (
                  <div key={cat} className="flex gap-2 items-center">
                    <Input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat);
                        if (e.key === "Escape") setRenamingCat(null);
                      }}
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleRename(cat)}>
                      <Check className="size-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setRenamingCat(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30"
                  >
                    <span className="font-medium">{cat}</span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setRenamingCat(cat); setRenameVal(cat); }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCategory(cat)}
                        disabled={categories.length <= 1}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Item Dialog ── */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Marathi Name *</Label>
                <Input value={editing.nameMr} onChange={(e) => setEditing({ ...editing, nameMr: e.target.value })} />
              </div>
              <div>
                <Label>English Name</Label>
                <Input value={editing.nameEn || ""} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Half Price</Label>
                  <Input
                    type="number"
                    value={editing.half ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, half: e.target.value ? +e.target.value : undefined })
                    }
                  />
                </div>
                <div>
                  <Label>Full Price *</Label>
                  <Input
                    type="number"
                    value={editing.full || ""}
                    onChange={(e) => setEditing({ ...editing, full: +e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={save}>
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
