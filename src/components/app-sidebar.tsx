"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  History,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { to: "/dashboard", labelMr: "डॅशबोर्ड", labelEn: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", labelMr: "बिलिंग", labelEn: "Billing", icon: Receipt },
  { to: "/menu", labelMr: "मेनू", labelEn: "Menu", icon: UtensilsCrossed },
  { to: "/history", labelMr: "बिल इतिहास", labelEn: "History", icon: History },
  { to: "/settings", labelMr: "सेटिंग्ज", labelEn: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useAuth((s) => s.logout);
  const router = useRouter();

  return (
    <Sidebar className="no-print">
      <SidebarHeader className="p-0 border-b border-sidebar-border">
        <img
          src="/niyojan-logo.png"
          alt="Niyojan Resto Logo"
          className="w-full object-contain"
        />
      </SidebarHeader>
      <SidebarContent className="p-3">
        <SidebarMenu className="space-y-1">
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <SidebarMenuItem key={it.to}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={it.labelEn}
                  className={active ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" : ""}
                >
                  <Link href={it.to}>
                    <it.icon className="size-4" />
                    <div className="flex-1">
                      <div className="font-medium leading-tight">{it.labelMr}</div>
                      <div className="text-[10px] opacity-70 leading-tight">{it.labelEn}</div>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              <span>लॉगआउट / Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
