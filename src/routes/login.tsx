import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChefHat } from "lucide-react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Niyojan Resto Billing" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthed } = useAuth();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("admin");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isAuthed) navigate({ to: "/dashboard" });
  }, [isAuthed, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-wood p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-border">
        <div className="flex flex-col items-center mb-6">
          <div className="size-20 rounded-full bg-primary flex items-center justify-center mb-3 shadow-lg">
            <ChefHat className="size-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">
            Niyojan Resto
          </h1>
          <p className="text-sm text-muted-foreground">Billing Software</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (login(u, p)) navigate({ to: "/dashboard" });
            else setErr("Invalid credentials");
          }}
        >
          <div>
            <Label htmlFor="u">वापरकर्तानाव / Username</Label>
            <Input id="u" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="p">पासवर्ड / Password</Label>
            <Input
              id="p"
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" size="lg">
            लॉगिन / Login
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Demo: any non-empty username & password
          </p>
        </form>
      </div>
    </div>
  );
}
