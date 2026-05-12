import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const adminPageShell =
  "min-w-0 w-full max-w-none space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7";

export const adminPanelClass =
  "overflow-hidden rounded-[28px] border border-foreground/10 bg-card/92 shadow-[0_18px_55px_color-mix(in_oklab,var(--foreground)_5%,transparent)] dark:bg-card/82 dark:shadow-none";

export const adminTableShellClass =
  "overflow-hidden rounded-[28px] border border-foreground/10 bg-card/90 shadow-[0_14px_45px_color-mix(in_oklab,var(--foreground)_4%,transparent)] dark:bg-card/82 dark:shadow-none";

export const adminInputClass =
  "h-10 rounded-full border border-foreground/12 bg-card/88 px-3 text-sm text-foreground placeholder:text-foreground/38 shadow-none outline-none transition-colors focus:border-brand/80 focus:ring-3 focus:ring-brand/18 dark:bg-background/70";

export const adminActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-foreground/12 bg-card px-3.5 text-xs font-bold text-foreground/72 transition-colors hover:border-brand/70 hover:bg-brand hover:text-brand-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30";

export const adminPrimaryActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-brand bg-brand px-3.5 text-xs font-black text-brand-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35";

export function AdminPageHeader({
  eyebrow = "Administración",
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "tp-hero-panel rounded-[32px] px-5 py-5 text-white shadow-[0_24px_70px_rgba(5,5,5,0.18)] sm:px-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D6FF38]">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-black leading-tight text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
              {description}
            </p>
          )}
        </div>
        {(actions || meta) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export function AdminPanel({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn(adminPanelClass, className)} {...props} />;
}

export function AdminPanelHeader({
  icon: Icon,
  title,
  description,
  action,
  danger,
}: {
  icon?: ElementType;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border",
              danger
                ? "border-destructive/25 bg-destructive/10 text-destructive"
                : "border-brand/35 bg-brand/14 text-brand"
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-black text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-5 text-foreground/52">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ElementType;
  href?: string;
  className?: string;
  valueClassName?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
          {label}
        </p>
        {Icon && (
          <Icon className="size-4 shrink-0 text-brand" />
        )}
      </div>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-black leading-none text-foreground",
          valueClassName
        )}
      >
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-foreground/48">{detail}</p>}
    </>
  );

  const cardClass = cn(
    "rounded-[26px] border border-foreground/10 bg-card/92 p-4 shadow-[0_14px_45px_color-mix(in_oklab,var(--foreground)_4%,transparent)] transition-colors dark:bg-card/82 dark:shadow-none",
    href && "hover:border-brand/70 hover:bg-brand/8",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}

export function AdminExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={adminActionClass}
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}
