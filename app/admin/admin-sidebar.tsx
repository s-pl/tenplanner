"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Métricas", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: Users, exact: false },
  { href: "/admin/content", label: "Contenido", icon: FileText, exact: false },
  { href: "/admin/landing", label: "Landing", icon: Sparkles, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-foreground/10 flex flex-col">
      <div className="px-4 py-5 border-b border-foreground/10">
        <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40 mb-1">
          TenPlanner
        </p>
        <p className="font-heading text-base font-semibold text-foreground">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {adminNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
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
      </nav>

      <div className="p-3 border-t border-foreground/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Volver al app
        </Link>
      </div>
    </aside>
  );
}
