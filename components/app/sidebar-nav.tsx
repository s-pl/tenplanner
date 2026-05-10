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
  Plus,
  Lock,
  Heart,
  BookOpen,
  Store,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

type FeatureKey =
  | "drPlanner"
  | "sessionTemplates"
  | "exerciseCreation"
  | "groups"
  | "calendar";

type FeatureMap = Record<FeatureKey, boolean>;

interface SubItem {
  href: string;
  label: string;
  accent?: boolean;
  icon?: React.ElementType;
  feature?: FeatureKey;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  publicAccess?: boolean;
  feature?: FeatureKey;
  submenu?: SubItem[];
  /** Etiqueta usada para el primer ítem auto-generado del submenú (default "Ver todas") */
  allLabel?: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  {
    href: "/exercises",
    label: "Ejercicios",
    icon: Dumbbell,
    publicAccess: true,
    allLabel: "Ver todos",
    submenu: [
      { href: "/exercises", label: "Biblioteca", icon: BookOpen },
      { href: "/exercises?tab=mine", label: "Mis ejercicios", icon: Dumbbell },
      { href: "/exercises?tab=favorites", label: "Favoritos", icon: Heart },
      {
        href: "/exercises/new",
        label: "Nuevo ejercicio",
        icon: Plus,
        feature: "exerciseCreation",
      },
    ],
  },
  {
    href: "/classes",
    label: "Clases",
    icon: GraduationCap,
    publicAccess: true,
    allLabel: "Ver todas",
    submenu: [
      { href: "/classes", label: "Biblioteca", icon: BookOpen },
      { href: "/classes?tab=mine", label: "Mis clases", icon: GraduationCap },
      { href: "/classes?tab=favorites", label: "Favoritos", icon: Heart },
      { href: "/classes/new", label: "Nueva clase", icon: Plus },
    ],
  },
  {
    href: "/sessions",
    label: "Sesiones",
    icon: ClipboardList,
    allLabel: "Ver todas",
    submenu: [
      { href: "/sessions", label: "Mis sesiones", icon: ClipboardList },
      {
        href: "/sessions/templates",
        label: "Plantillas",
        icon: Store,
        feature: "sessionTemplates",
      },
      { href: "/sessions/new", label: "Nueva sesión", icon: Plus },
    ],
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: CalendarDays,
    feature: "calendar",
  },
  {
    href: "/students",
    label: "Alumnos",
    icon: Users,
    allLabel: "Ver todos",
    submenu: [
      { href: "/students", label: "Lista de alumnos", icon: Users },
      { href: "/groups", label: "Grupos", icon: Users2, feature: "groups" },
    ],
  },
  { href: "/places", label: "Lugares", icon: MapPin },
  { href: "/profile", label: "Perfil", icon: UserCircle },
];

interface SidebarNavProps {
  user: {
    email?: string | null;
    user_metadata?: { full_name?: string };
  } | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  drPlannerEnabled?: boolean;
  features?: Partial<FeatureMap>;
  appName?: string;
  appTagline?: string;
}

function NavContent({
  pathname,
  onNavigate,
  user,
  avatarUrl,
  isAdmin,
  features,
  onSignOut,
  appName,
  appTagline,
}: {
  pathname: string;
  onNavigate?: () => void;
  user: SidebarNavProps["user"];
  avatarUrl?: string | null;
  isAdmin?: boolean;
  features: FeatureMap;
  onSignOut: () => void;
  appName?: string;
  appTagline?: string;
}) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Coach";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>(
    () => {
      if (!user) return {};
      const initial: Record<string, boolean> = {};
      for (const item of navItems) {
        if (item.submenu && pathname.startsWith(item.href)) {
          initial[item.href] = true;
        }
      }
      return initial;
    }
  );

  function toggleSubmenu(href: string) {
    setSubmenuOpen((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/dashboard" className="block" onClick={onNavigate}>
          <p className="font-heading text-2xl leading-none text-foreground">
            {appName && appName !== "TenPlanner" ? (
              <span className="text-brand">{appName}</span>
            ) : (
              <>
                ten<em className="italic text-brand">planner</em>
              </>
            )}
          </p>
          {appTagline && (
            <p className="mt-1 font-sans text-[11px] text-foreground/40">
              {appTagline}
            </p>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(
            ({
              href,
              label,
              icon: Icon,
              submenu,
              publicAccess,
              feature,
              allLabel,
            }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              const isOpen = !!submenuOpen[href];
              const isLocked = !user && !publicAccess;
              const featureLocked = feature ? !features[feature] : false;

              if (isLocked) {
                return (
                  <li key={href}>
                    <Link
                      href="/login"
                      onClick={onNavigate}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/40 transition-colors hover:bg-sidebar-accent/55 hover:text-foreground/65"
                    >
                      <Icon className="size-4" strokeWidth={1.6} />
                      <span className="flex-1 text-[14px]">{label}</span>
                      <Lock className="size-3 text-foreground/30" strokeWidth={1.8} />
                    </Link>
                  </li>
                );
              }

              if (featureLocked) {
                return (
                  <li key={href}>
                    <span className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/40">
                      <Icon className="size-4" strokeWidth={1.6} />
                      <span className="flex-1 text-[14px]">{label}</span>
                      <Lock className="size-3 text-foreground/30" strokeWidth={1.8} />
                    </span>
                  </li>
                );
              }

              if (submenu) {
                return (
                  <li key={href}>
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(href)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        isActive
                          ? "bg-sidebar-accent/60 text-foreground"
                          : "text-foreground/70 hover:bg-sidebar-accent/45 hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          isActive ? "text-brand" : "text-foreground/60"
                        )}
                        strokeWidth={1.6}
                      />
                      <span
                        className={cn(
                          "flex-1 text-[14px]",
                          isActive && "font-medium text-foreground"
                        )}
                      >
                        {label}
                      </span>
                      <ChevronRight
                        className={cn(
                          "size-3.5 text-foreground/35 transition-transform",
                          isOpen && "rotate-90 text-brand"
                        )}
                        strokeWidth={1.8}
                      />
                    </button>

                    {isOpen && (
                      <ul className="flex flex-col gap-0.5 pb-2 pl-9 pr-2">
                        <li>
                          <Link
                            href={href}
                            onClick={onNavigate}
                            className={cn(
                              "block py-1.5 px-2 rounded-md text-[12.5px] transition-colors",
                              pathname === href
                                ? "text-brand"
                                : "text-foreground/55 hover:text-foreground"
                            )}
                          >
                            {allLabel ?? "Ver todas"}
                          </Link>
                        </li>
                        {submenu.map(
                          ({
                            href: subHref,
                            label: subLabel,
                            accent,
                            feature,
                          }) => {
                            const isSubActive =
                              pathname === subHref ||
                              pathname.startsWith(subHref + "/");
                            const featureLocked = feature
                              ? !features[feature]
                              : false;

                            if (featureLocked) {
                              return (
                                <li key={subHref}>
                                  <span className="flex items-center justify-between py-1.5 px-2 text-[12.5px] text-foreground/35">
                                    <span>{subLabel}</span>
                                    <Lock className="size-3 text-foreground/30" />
                                  </span>
                                </li>
                              );
                            }

                            return (
                              <li key={subHref}>
                                <Link
                                  href={subHref}
                                  onClick={onNavigate}
                                  className={cn(
                                    "block py-1.5 px-2 rounded-md text-[12.5px] transition-colors",
                                    isSubActive
                                      ? "text-brand font-medium"
                                      : accent
                                        ? "text-brand/75 hover:text-brand"
                                        : "text-foreground/55 hover:text-foreground"
                                  )}
                                >
                                  {subLabel}
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
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-sidebar-accent/60 text-foreground"
                        : "text-foreground/70 hover:bg-sidebar-accent/45 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        isActive ? "text-brand" : "text-foreground/60"
                      )}
                      strokeWidth={1.6}
                    />
                    <span
                      className={cn(
                        "flex-1 text-[14px]",
                        isActive && "font-medium text-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            }
          )}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border">
        {isAdmin && (
          <div className="px-4 pt-3">
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(
                "flex w-full items-center gap-2 border px-3 py-2 text-[12px] font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "border-brand/35 bg-brand/10 text-brand"
                  : "border-sidebar-border text-foreground/55 hover:bg-sidebar-accent/55 hover:text-foreground"
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
              <p className="mb-2.5 px-1 font-mono text-[10px] uppercase text-foreground/40">
                Cuenta
              </p>
              <Link
                href="/profile"
                onClick={onNavigate}
                className="group grid grid-cols-[auto_1fr] items-center gap-3 border border-sidebar-border bg-sidebar-accent/35 px-3 py-3 transition-colors hover:border-brand/35 hover:bg-sidebar-accent/65"
              >
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden border border-foreground/20 bg-foreground/[0.03] transition-colors group-hover:border-brand/60">
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
                className="group flex items-center gap-2 py-2 text-[12px] text-foreground/55 transition-colors hover:text-foreground"
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
              className="flex items-center gap-2 border border-foreground/12 bg-foreground/[0.04] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
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

export function SidebarNav({
  user,
  avatarUrl,
  isAdmin = false,
  drPlannerEnabled = true,
  features,
  appName,
  appTagline,
}: SidebarNavProps) {
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
  const resolvedFeatures: FeatureMap = {
    drPlanner: drPlannerEnabled,
    sessionTemplates: features?.sessionTemplates ?? true,
    exerciseCreation: features?.exerciseCreation ?? true,
    groups: features?.groups ?? true,
    calendar: features?.calendar ?? true,
  };

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
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <NavContent
          pathname={pathname}
          user={user}
          avatarUrl={avatarUrl}
          isAdmin={isAdmin}
          features={resolvedFeatures}
          onSignOut={handleSignOut}
          appName={appName}
          appTagline={appTagline}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-5 md:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-baseline gap-1"
          >
            {appName && appName !== "TenPlanner" ? (
              <span className="font-heading text-base text-brand">
                {appName}
              </span>
            ) : (
              <>
                <span className="font-heading text-base text-foreground">
                  ten
                </span>
                <em className="font-heading italic text-base text-brand">
                  planner
                </em>
              </>
            )}
          </Link>
          <span className="text-foreground/25 text-sm select-none">/</span>
          <span className="font-heading text-sm text-foreground/70 truncate">
            {activeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle compact />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-8 items-center justify-center text-foreground/60 transition-colors hover:text-foreground"
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
          <aside className="relative flex h-full w-72 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
            <div className="absolute top-4 right-4">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex size-8 items-center justify-center text-foreground/60 transition-colors hover:text-foreground"
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
              features={resolvedFeatures}
              onSignOut={handleSignOut}
              appName={appName}
              appTagline={appTagline}
            />
          </aside>
        </div>
      )}
    </>
  );
}
