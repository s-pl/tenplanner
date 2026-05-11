import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-1.5 text-base text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_55%)] transition-[background-color,border-color,box-shadow,color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_6%)] dark:disabled:bg-input/20 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/35",
        className
      )}
      {...props}
    />
  );
}

export { Input };
