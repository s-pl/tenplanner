"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Bot,
  ChevronLeft,
  Menu,
  X,
  Layers,
  MessageSquare,
  Palette,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Metricas", icon: LayoutDashboard, exact: true },
  { href: "/admin/ai", label: "IA", icon: Bot, exact: false },
  { href: "/admin/chats", label: "Chats", icon: MessageSquare, exact: false },
  { href: "/admin/users", label: "Usuarios", icon: Users, exact: false },
  { href: "/admin/content", label: "Contenido", icon: FileText, exact: false },
  {
    href: "/admin/embeddings",
    label: "Embeddings",
    icon: Layers,
    exact: false,
  },
  { href: "/admin/landing", label: "Landing", icon: Sparkles, exact: false },
  { href: "/admin/branding", label: "Marca", icon: Palette, exact: false },
  { href: "/admin/tools", label: "Herramientas", icon: Wrench, exact: false },
  {
    href: "/admin/settings",
    label: "Ajustes",
    icon: SlidersHorizontal,
    exact: false,
  },
];

function AdminNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 p-3">
      <div className="flex flex-col gap-0.5">
        {adminNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground font-black shadow-[0_12px_30px_color-mix(in_oklab,var(--brand)_25%,transparent)]"
                  : "text-sidebar-foreground/64 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const activeItem =
    adminNav.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    ) ?? adminNav[0];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/96 px-4 text-sidebar-foreground backdrop-blur md:hidden">
        <div className="min-w-0">
          <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/44">
            TenPlanner Admin
          </p>
          <p className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
            {activeItem.label}
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Abrir menu de administracion"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 py-5">
          <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/44">
            TenPlanner
          </p>
          <p className="font-heading text-base font-semibold text-sidebar-foreground">
            Admin
          </p>
        </div>

        <AdminNavLinks pathname={pathname} />

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronLeft className="size-4" />
            Volver al app
          </Link>
        </div>
      </aside>

      {open && (
        <div
          id="admin-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de administracion"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <div
            className="absolute inset-0 bg-[#050505]/55 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl">
            <div className="flex items-start justify-between border-b border-sidebar-border px-4 py-5">
              <div>
                <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/44">
                  TenPlanner
                </p>
                <p className="font-heading text-base font-semibold text-sidebar-foreground">
                  Admin
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/64 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                aria-label="Cerrar menu de administracion"
              >
                <X className="size-4" />
              </button>
            </div>
            <AdminNavLinks
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
            <div className="border-t border-sidebar-border p-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ChevronLeft className="size-4" />
                Volver al app
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
