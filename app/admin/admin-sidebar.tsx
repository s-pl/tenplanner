"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Métricas", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: Users, exact: false },
  { href: "/admin/content", label: "Contenido", icon: FileText, exact: false },
  { href: "/admin/landing", label: "Landing", icon: Sparkles, exact: false },
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
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-foreground/10 bg-background/95 px-4 backdrop-blur md:hidden">
        <div className="min-w-0">
          <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40">
            Admin Panel
          </p>
          <p className="truncate font-heading text-sm font-semibold text-foreground">
            {activeItem.label}
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Abrir menú de administración"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-foreground/10 md:flex">
        <div className="border-b border-foreground/10 px-4 py-5">
          <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40">
            TenPlanner
          </p>
          <p className="font-heading text-base font-semibold text-foreground">
            Admin Panel
          </p>
        </div>

        <AdminNavLinks pathname={pathname} />

        <div className="border-t border-foreground/10 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
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
          aria-label="Menú de administración"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <div
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col border-r border-foreground/10 bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b border-foreground/10 px-4 py-5">
              <div>
                <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40">
                  TenPlanner
                </p>
                <p className="font-heading text-base font-semibold text-foreground">
                  Admin Panel
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
                aria-label="Cerrar menú de administración"
              >
                <X className="size-4" />
              </button>
            </div>
            <AdminNavLinks
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
            <div className="border-t border-foreground/10 p-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
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
