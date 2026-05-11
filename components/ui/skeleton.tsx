import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted via-foreground/10 to-muted bg-[length:220%_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
