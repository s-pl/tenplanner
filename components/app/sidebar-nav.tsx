"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  ClipboardList,
  CalendarDays,
  Users,
  Users2,
  UserCircle,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Bot,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface SubItem {
  href: string;
  label: string;
  tag?: string;
  accent?: boolean;
  icon?: React.ElementType;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  index: string;
  submenu?: SubItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, index: "01" },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell, index: "02" },
  {
    href: "/sessions",
    label: "Sesiones",
    icon: ClipboardList,
    index: "03",
    submenu: [
      { href: "/sessions/new", label: "Nueva sesión", tag: "MAN", icon: Plus },
      {
        href: "/sessions/dr-planner",
        label: "Dr. Planner",
        tag: "IA",
        icon: Bot,
        accent: true,
      },
    ],
  },
  {
    href: "/students",
    label: "Alumnos",
    icon: Users,
    index: "04",
    submenu: [
      { href: "/students", label: "Lista de alumnos", icon: Users },
      { href: "/groups", label: "Grupos", icon: Users2 },
    ],
  },
  { href: "/calendar", label: "Calendario", icon: CalendarDays, index: "05" },
  { href: "/profile", label: "Perfil", icon: UserCircle, index: "06" },
];

interface SidebarNavProps {
  user: { email?: string | null; user_metadata?: { full_name?: string } };
  avatarUrl?: string | null;
}

function NavContent({
  pathname,
  onNavigate,
  user,
  avatarUrl,
  onSignOut,
}: {
  pathname: string;
  onNavigate?: () => void;
  user: SidebarNavProps["user"];
  avatarUrl?: string | null;
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

  const sessionsOpen = pathname.startsWith("/sessions");
  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>({
    "/sessions": sessionsOpen,
  });

  function toggleSubmenu(href: string) {
    setSubmenuOpen((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Wordmark ── */}
      <div className="px-6 pt-7 pb-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="block group" onClick={onNavigate}>
          <p className="font-sans text-[9px] uppercase tracking-[0.28em] text-foreground/45 mb-1.5">
            Planner &amp; Coach
          </p>
          <p className="font-heading text-2xl leading-none tracking-tight text-foreground">
            ten<em className="italic text-brand">planner</em>
          </p>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 px-2 mb-3">
          Navegación
        </p>
        <ul>
          {navItems.map(({ href, label, icon: Icon, submenu, index }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const isOpen = !!submenuOpen[href];

            if (submenu) {
              return (
                <li
                  key={href}
                  className="border-b border-foreground/8 last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(href)}
                    className={cn(
                      "w-full grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-2 py-3 text-left transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-foreground/65 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "font-sans text-[10px] tabular-nums tracking-[0.18em]",
                        isActive ? "text-brand" : "text-foreground/35"
                      )}
                    >
                      {index}
                    </span>
                    <Icon
                      className={cn(
                        "size-[15px]",
                        isActive ? "text-brand" : "text-foreground/55"
                      )}
                      strokeWidth={1.6}
                    />
                    <span
                      className={cn(
                        "text-[14px]",
                        isActive && "font-heading italic text-foreground"
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        "font-sans text-[9px] tracking-[0.18em] text-foreground/35 transition-transform",
                        isOpen && "rotate-90"
                      )}
                    >
                      ▸
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="pb-2 pl-10 pr-2 space-y-0.5">
                      <li>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "grid grid-cols-[1fr_auto] items-center py-1.5 text-[12px] transition-colors",
                            pathname === href
                              ? "text-brand"
                              : "text-foreground/55 hover:text-foreground"
                          )}
                        >
                          <span>Ver todas</span>
                          <span className="font-sans text-[9px] tracking-[0.18em] text-foreground/30">
                            ALL
                          </span>
                        </Link>
                      </li>
                      {submenu.map(
                        ({ href: subHref, label: subLabel, tag, accent }) => {
                          const isSubActive =
                            pathname === subHref ||
                            pathname.startsWith(subHref + "/");
                          return (
                            <li key={subHref}>
                              <Link
                                href={subHref}
                                onClick={onNavigate}
                                className={cn(
                                  "grid grid-cols-[1fr_auto] items-center py-1.5 text-[12px] transition-colors",
                                  isSubActive
                                    ? "text-brand"
                                    : accent
                                      ? "text-brand/75 hover:text-brand"
                                      : "text-foreground/55 hover:text-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    isSubActive &&
                                      "italic font-heading text-[13px]"
                                  )}
                                >
                                  {subLabel}
                                </span>
                                {tag && (
                                  <span
                                    className={cn(
                                      "font-sans text-[9px] tracking-[0.18em]",
                                      accent
                                        ? "text-brand"
                                        : "text-foreground/35"
                                    )}
                                  >
                                    {tag}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li
                key={href}
                className="border-b border-foreground/8 last:border-0"
              >
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-2 py-3 transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/65 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "font-sans text-[10px] tabular-nums tracking-[0.18em]",
                      isActive ? "text-brand" : "text-foreground/35"
                    )}
                  >
                    {index}
                  </span>
                  <Icon
                    className={cn(
                      "size-[15px]",
                      isActive ? "text-brand" : "text-foreground/55"
                    )}
                    strokeWidth={1.6}
                  />
                  <span
                    className={cn(
                      "text-[14px]",
                      isActive && "font-heading italic text-foreground"
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span className="size-1 rounded-full bg-brand" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-sidebar-border">
        <div className="px-4 pt-4 pb-3">
          <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 px-1 mb-2.5">
            Cuenta
          </p>
          <Link
            href="/profile"
            onClick={onNavigate}
            className="grid grid-cols-[auto_1fr] items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group"
          >
            <div className="size-8 rounded-full border border-foreground/20 bg-foreground/[0.03] overflow-hidden flex items-center justify-center shrink-0 group-hover:border-brand/60 transition-colors">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-heading text-[11px] text-foreground/80">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-foreground truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-foreground/50 truncate mt-px tabular-nums">
                {user.email}
              </p>
            </div>
          </Link>
        </div>

        <div className="px-4 pb-4 grid grid-cols-[1fr_auto] items-center gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 py-2 text-[12px] text-foreground/55 hover:text-foreground transition-colors group"
          >
            <LogOut className="size-3.5" strokeWidth={1.6} />
            Cerrar sesión
          </button>
          <ThemeToggle compact />
        </div>
      </div>
    </div>
  );
}

export function SidebarNav({ user, avatarUrl }: SidebarNavProps) {
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
          avatarUrl={avatarUrl}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 h-14 bg-sidebar border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-baseline gap-1">
          <span className="font-heading text-lg tracking-tight text-foreground">
            ten
          </span>
          <em className="font-heading italic text-lg text-brand">planner</em>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="size-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-sidebar border-r border-sidebar-border h-full flex flex-col overflow-y-auto">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="size-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="size-4" strokeWidth={1.6} />
              </button>
            </div>
            <NavContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              user={user}
              avatarUrl={avatarUrl}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}
    </>
  );
}
