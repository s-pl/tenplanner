"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Escribe el nombre del club");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          plannedCoachSeats: seats ? Number(seats) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          typeof body?.error === "string"
            ? body.error
            : "No se pudo registrar el club."
        );
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="club-name">Nombre del club</Label>
        <Input
          id="club-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="club-seats">
          Monitores previstos{" "}
          <span className="font-normal text-foreground/50">(opcional)</span>
        </Label>
        <Input
          id="club-seats"
          type="number"
          min={0}
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-full font-black"
      >
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Registrar club
      </Button>
    </form>
  );
}
