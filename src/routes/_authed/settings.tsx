import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useData } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({ meta: [{ title: "Settings — Niyojan Resto" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings } = useData();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">सेटिंग्ज</h1>
        <p className="text-muted-foreground">Restaurant configuration</p>
      </div>

      <Card className="p-6 space-y-4">
        {[
          { k: "restaurantName", label: "Restaurant Name" },
          { k: "address", label: "Address" },
          { k: "phone", label: "Phone Number" },
          { k: "gstNumber", label: "GST Number" },
          { k: "footer", label: "Receipt Footer Message" },
        ].map((f) => (
          <div key={f.k}>
            <Label>{f.label}</Label>
            <Input
              value={(form as Record<string, string>)[f.k]}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
            />
          </div>
        ))}
        <Button
          onClick={() => {
            updateSettings(form);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          Save Settings
        </Button>
        {saved && <p className="text-sm text-primary">Saved ✓</p>}
      </Card>
    </div>
  );
}
