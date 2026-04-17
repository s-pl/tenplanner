"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  CalendarDays,
  UserCircle,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/sessions", label: "Sesiones", icon: ClipboardList },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/profile", label: "Perfil", icon: UserCircle },
];

interface SidebarNavProps {
  user: { email?: string | null; user_metadata?: { full_name?: string } };
}

function NavContent({
  pathname,
  onNavigate,
  user,
  onSignOut,
}: {
  pathname: string;
  onNavigate?: () => void;
  user: SidebarNavProps["user"];
  onSignOut: () => void;
}) {
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Coach";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <div className="size-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap className="size-4 text-brand-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight text-foreground">
            ten<span className="text-brand">planner</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand/15 text-brand"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-brand" : "text-muted-foreground"
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="size-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-brand">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <ThemeToggle />
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full"
        >
          <LogOut className="size-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-dvh sticky top-0">
        <NavContent
          pathname={pathname}
          user={user}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebar border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-brand flex items-center justify-center">
            <Zap className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-base tracking-tight">
            ten<span className="text-brand">planner</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button
            onClick={() => setMobileOpen(true)}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-sidebar border-r border-sidebar-border h-full flex flex-col overflow-y-auto">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              user={user}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}
    </>
  );
}
