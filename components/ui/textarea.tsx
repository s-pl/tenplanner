import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_55%)] transition-[background-color,border-color,box-shadow,color] outline-none placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_6%)] dark:disabled:bg-input/20 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/35",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
