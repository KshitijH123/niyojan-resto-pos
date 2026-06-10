import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0a1e16]">
      {/* Background with Logo as a massive watermark */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
         <img 
          src="/niyojan-logo.png" 
          alt="" 
          className="w-[150%] h-[150%] object-contain opacity-10 blur-sm scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1e16] via-transparent to-[#1a3a2a] opacity-80" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card with Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center mb-8">
            <div className="size-84 mb-2 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
              <img 
                src="/niyojan-logo.png" 
                alt="Niyojan Resto Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (login(u, p)) navigate({ to: "/dashboard" });
              else setErr("Invalid credentials");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="u" className="text-white/80 ml-1">वापरकर्तानाव / Username</Label>
              <Input 
                id="u" 
                value={u} 
                onChange={(e) => setU(e.target.value)} 
                autoFocus 
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:bg-white/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p" className="text-white/80 ml-1">पासवर्ड / Password</Label>
              <Input
                id="p"
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:bg-white/10 transition-all"
              />
            </div>
            
            {err && (
              <div className="bg-destructive/20 border border-destructive/50 text-destructive-foreground px-4 py-2 rounded-lg text-sm">
                {err}
              </div>
            )}

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-accent hover:bg-accent/90 text-accent-foreground">
              लॉगिन / Login
            </Button>
            
            <div className="pt-4 flex flex-col items-center gap-1">
              <p className="text-[10px] text-white/30 uppercase tracking-tighter">
                Secure Access Portal
              </p>
              <p className="text-xs text-white/40 italic">
                Demo: any non-empty username & password
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
