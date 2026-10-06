import { cn } from "@/lib/utils";

/**
 * Standalone mark for Ten Planner: a rounded badge with a blue-to-violet
 * gradient block, a green cell and small motion ticks, on a dark navy tile.
 */
export function TenPlannerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="ten-planner-mark-gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#4C6EF5" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="200" height="200" rx="46" fill="#17193B" />
      <rect
        x="36"
        y="36"
        width="148"
        height="64"
        rx="16"
        fill="url(#ten-planner-mark-gradient)"
      />
      <rect x="36" y="120" width="64" height="64" rx="16" fill="#2FB86A" />
      <rect x="120" y="120" width="64" height="64" rx="16" fill="#FBF9F3" />
      <path
        d="M20 118 L50 118"
        stroke="#2FB86A"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M10 108 L34 108"
        stroke="#2FB86A"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
