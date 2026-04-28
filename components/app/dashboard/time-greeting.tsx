"use client";

import { useSyncExternalStore } from "react";
import { greetingForHour } from "@/lib/time-greeting";

export function TimeGreeting({
  name,
  initialGreeting,
}: {
  name: string;
  initialGreeting: string;
}) {
  const greeting = useSyncExternalStore(
    (notify) => {
      const interval = window.setInterval(notify, 60_000);
      window.addEventListener("focus", notify);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("focus", notify);
      };
    },
    () => greetingForHour(new Date().getHours()),
    () => initialGreeting
  );

  return (
    <h1 className="text-balance font-heading text-5xl leading-[0.96] text-foreground sm:text-6xl lg:text-7xl">
      {greeting}, <em className="italic text-brand">{name}</em>.
    </h1>
  );
}
