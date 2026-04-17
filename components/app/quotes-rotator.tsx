"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  {
    text: "Los campeones siguen jugando hasta que lo hacen bien.",
    author: "Rafael Nadal",
    sport: "Tenis · 22× Grand Slam",
  },
  {
    text: "Cuanto más difícil es la victoria, mayor es la felicidad de ganar.",
    author: "Novak Djokovic",
    sport: "Tenis · 24× Grand Slam",
  },
  {
    text: "Tienes que dedicarle horas porque siempre hay algo que puedes mejorar.",
    author: "Rafael Nadal",
    sport: "Tenis",
  },
  {
    text: "Creo que un campeón no se define por sus victorias, sino por cómo se recupera cuando cae.",
    author: "Serena Williams",
    sport: "Tenis · 23× Grand Slam",
  },
  {
    text: "Si quieres ser el mejor, tienes que hacer cosas que otros no están dispuestos a hacer.",
    author: "Michael Phelps",
    sport: "Natación · 23× Oro Olímpico",
  },
  {
    text: "El secreto para avanzar es empezar.",
    author: "Roger Federer",
    sport: "Tenis · 20× Grand Slam",
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
