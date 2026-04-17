"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  {
    text: "Champions keep playing until they get it right.",
    author: "Rafael Nadal",
    sport: "Tennis · 22× Grand Slam",
  },
  {
    text: "The more difficult the victory, the greater the happiness in winning.",
    author: "Novak Djokovic",
    sport: "Tennis · 24× Grand Slam",
  },
  {
    text: "You have to put in the hours because there's always something you can improve.",
    author: "Rafael Nadal",
    sport: "Tennis",
  },
  {
    text: "I really think a champion is defined not by their wins but by how they can recover when they fall.",
    author: "Serena Williams",
    sport: "Tennis · 23× Grand Slam",
  },
  {
    text: "If you want to be the best, you have to do things that other people aren't willing to do.",
    author: "Michael Phelps",
    sport: "Swimming · 23× Olympic Gold",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Roger Federer",
    sport: "Tennis · 20× Grand Slam",
  },
];

export function QuotesRotator() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const quote = QUOTES[idx];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <p className="font-heading text-xl font-semibold leading-snug text-foreground mb-4">
        &ldquo;{quote.text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand">
            {quote.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{quote.author}</p>
          <p className="text-xs text-muted-foreground">{quote.sport}</p>
        </div>
      </div>
    </div>
  );
}

export { QUOTES };
