import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/lib/store";
import { CATEGORIES, type MenuItem } from "@/lib/menu-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authed/menu")({
  head: () => ({ meta: [{ title: "Menu — Niyojan Resto" }] }),
  component: MenuPage,
});

function MenuPage() {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useData();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [open, setOpen] = useState(false);

  const startAdd = () => {
    setEditing({ id: "", nameMr: "", nameEn: "", category: CATEGORIES[0], full: 0 });
    setOpen(true);
  };
  const startEdit = (m: MenuItem) => {
    setEditing(m);
    setOpen(true);
  };

  const save = () => {
    if (!editing || !editing.nameMr || !editing.full) return;
    if (editing.id) {
      updateMenuItem(editing.id, editing);
    } else {
      const { id: _id, ...rest } = editing;
      addMenuItem(rest);
    }
    setOpen(false);
  };

  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">मेनू व्यवस्थापन</h1>
          <p className="text-muted-foreground">Manage your menu items and categories</p>
        </div>
        <Button onClick={startAdd}>
          <Plus className="size-4 mr-1" /> Add Item
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <h2 className="text-xl font-bold mb-3 text-primary">{cat}</h2>
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

      <Dialog open={open} onOpenChange={setOpen}>
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
                  {CATEGORIES.map((c) => (
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
