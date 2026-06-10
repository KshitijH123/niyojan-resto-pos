import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  History,
  Settings as SettingsIcon,
  LogOut,
  ChefHat,
} from "lucide-react";
import { useAuth, useData } from "@/lib/store";

const items = [
  { to: "/dashboard", labelMr: "डॅशबोर्ड", labelEn: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", labelMr: "बिलिंग", labelEn: "Billing", icon: Receipt },
  { to: "/menu", labelMr: "मेनू", labelEn: "Menu", icon: UtensilsCrossed },
  { to: "/history", labelMr: "बिल इतिहास", labelEn: "History", icon: History },
  { to: "/settings", labelMr: "सेटिंग्ज", labelEn: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logout = useAuth((s) => s.logout);
  const name = useData((s) => s.settings.restaurantName);
  const navigate = useNavigate();

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
        <div className="size-10 rounded-full bg-sidebar-primary flex items-center justify-center">
          <ChefHat className="size-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <div className="font-bold leading-tight">{name}</div>
          <div className="text-xs opacity-70">Billing Software</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <it.icon className="size-4" />
              <div className="flex-1">
                <div className="font-medium">{it.labelMr}</div>
                <div className="text-[10px] opacity-70">{it.labelEn}</div>
              </div>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="m-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent"
      >
        <LogOut className="size-4" /> लॉगआउट / Logout
      </button>
    </aside>
  );
}
