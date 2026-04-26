"use client";

import { useState, useEffect, useRef } from "react";
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
  Lock,
  Heart,
  BookOpen,
  Store,
  ShieldCheck,
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
  publicAccess?: boolean;
  submenu?: SubItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, index: "01" },
  {
    href: "/exercises",
    label: "Ejercicios",
    icon: Dumbbell,
    index: "02",
    publicAccess: true,
    submenu: [
      { href: "/exercises", label: "Biblioteca", icon: BookOpen },
      { href: "/exercises?tab=mine", label: "Mis ejercicios", tag: "MÍOS", icon: Dumbbell },
      { href: "/exercises?tab=favorites", label: "Favoritos", tag: "♥", icon: Heart },
      { href: "/exercises/new", label: "Nuevo ejercicio", tag: "MAN", icon: Plus },
    ],
  },
  {
    href: "/sessions",
    label: "Sesiones",
    icon: ClipboardList,
    index: "03",
    submenu: [
      { href: "/sessions", label: "Mis sesiones", icon: ClipboardList },
      { href: "/sessions/templates", label: "Plantillas", tag: "MERCADO", icon: Store },
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
  user: { email?: string | null; user_metadata?: { full_name?: string } } | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

function NavContent({
  pathname,
  onNavigate,
  user,
  avatarUrl,
  isAdmin,
  onSignOut,
}: {
  pathname: string;
  onNavigate?: () => void;
  user: SidebarNavProps["user"];
  avatarUrl?: string | null;
  isAdmin?: boolean;
  onSignOut: () => void;
}) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Coach";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>(() => {
    if (!user) return {};
    const initial: Record<string, boolean> = {};
    for (const item of navItems) {
      if (item.submenu && pathname.startsWith(item.href)) {
        initial[item.href] = true;
      }
    }
    return initial;
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
          <p className="mt-2 max-w-[14rem] text-[11px] leading-relaxed text-foreground/45">
            Planifica con estructura, archiva con criterio y reutiliza lo que ya funciona.
          </p>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 px-2 mb-3">
          Navegación
        </p>
        <ul>
          {navItems.map(({ href, label, icon: Icon, submenu, index, publicAccess }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const isOpen = !!submenuOpen[href];
            const isLocked = !user && !publicAccess;

            if (isLocked) {
              return (
                <li
                  key={href}
                  className="border-b border-foreground/8 last:border-0"
                >
                  <Link
                    href="/login"
                    onClick={onNavigate}
                    className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-2 py-3 transition-colors text-foreground/35 hover:text-foreground/55"
                  >
                    <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/20">
                      {index}
                    </span>
                    <Icon
                      className="size-[15px] text-foreground/25"
                      strokeWidth={1.6}
                    />
                    <span className="text-[14px]">{label}</span>
                    <Lock className="size-[11px] text-foreground/30" strokeWidth={1.8} />
                  </Link>
                </li>
              );
            }

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
        {isAdmin && (
          <div className="px-4 pt-3">
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 w-full rounded-xl px-3 py-2 text-[12px] font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-foreground/55 hover:text-foreground hover:bg-foreground/[0.04] border border-transparent"
              )}
            >
              <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.8} />
              Panel de administración
            </Link>
          </div>
        )}
        {user ? (
          <>
            <div className="px-4 pt-4 pb-3">
              <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 px-1 mb-2.5">
                Cuenta
              </p>
              <Link
                href="/profile"
                onClick={onNavigate}
                className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.025] px-3 py-3 transition-colors hover:border-brand/25 hover:bg-foreground/[0.04] group"
              >
                <div className="size-9 rounded-full border border-foreground/20 bg-foreground/[0.03] overflow-hidden flex items-center justify-center shrink-0 group-hover:border-brand/60 transition-colors">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={36}
                      height={36}
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
          </>
        ) : (
          <div className="px-4 py-4 grid grid-cols-[1fr_auto] items-center gap-2">
            <Link
              href="/login"
              onClick={onNavigate}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-[12px] font-medium text-foreground bg-foreground/[0.04] border border-foreground/12 hover:bg-brand hover:text-brand-foreground hover:border-brand transition-colors"
            >
              <Lock className="size-3.5" strokeWidth={1.8} />
              Iniciar sesión
            </Link>
            <ThemeToggle compact />
          </div>
        )}
      </div>
    </div>
  );
}

export function SidebarNav({ user, avatarUrl, isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(false);

  const activeLabel =
    navItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "TenPlanner";

  useEffect(() => {
    if (mobileOpen) {
      closeButtonRef.current?.focus();

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
          setMobileOpen(false);
          return;
        }
        if (e.key !== "Tab" || !drawerRef.current) return;
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    } else if (prevOpenRef.current) {
      triggerRef.current?.focus();
    }
    prevOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-dvh w-72 shrink-0 sticky top-0 flex-col border-r border-sidebar-border bg-[color-mix(in_oklab,var(--sidebar)_94%,var(--background))] backdrop-blur">
        <NavContent
          pathname={pathname}
          user={user}
          avatarUrl={avatarUrl}
          isAdmin={isAdmin}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-[color-mix(in_oklab,var(--sidebar)_92%,var(--background))]/95 px-5 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard" className="flex items-baseline gap-1 shrink-0">
            <span className="font-heading text-base tracking-tight text-foreground">
              ten
            </span>
            <em className="font-heading italic text-base text-brand">planner</em>
          </Link>
          <span className="text-foreground/25 text-sm select-none">/</span>
          <span className="font-heading text-sm text-foreground/70 truncate">{activeLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle compact />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="size-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="md:hidden fixed inset-0 z-50 flex"
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 flex-col overflow-y-auto border-r border-sidebar-border bg-[color-mix(in_oklab,var(--sidebar)_94%,var(--background))] backdrop-blur">
            <div className="absolute top-4 right-4">
              <button
                ref={closeButtonRef}
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
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}
    </>
  );
}
