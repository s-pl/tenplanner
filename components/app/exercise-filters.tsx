"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const FORMATOS = [
  { id: "individual", label: "Individual" },
  { id: "parejas", label: "Parejas" },
  { id: "grupal", label: "Grupal" },
  { id: "multigrupo", label: "Multigrupo" },
] as const;

const TIPOS_ACTIVIDAD = [
  { id: "tecnico_tactico", label: "Técnico-táctico" },
  { id: "fisico", label: "Físico" },
  { id: "cognitivo", label: "Cognitivo" },
  { id: "competitivo", label: "Competitivo" },
  { id: "ludico", label: "Lúdico" },
] as const;

const TIPOS_PELOTA = [
  { id: "normal", label: "Normal" },
  { id: "lenta", label: "Lenta" },
  { id: "rapida", label: "Rápida" },
  { id: "sin_pelota", label: "Sin pelota" },
] as const;

const GOLPES = [
  { id: "derecha", label: "Derecha" },
  { id: "reves", label: "Revés" },
  { id: "globo", label: "Globo" },
  { id: "smash", label: "Smash" },
  { id: "bandeja", label: "Bandeja" },
  { id: "volea_dcha", label: "Volea dcha." },
  { id: "volea_rev", label: "Volea rev." },
  { id: "bajada_pared", label: "Bajada pared" },
  { id: "vibora", label: "Víbora" },
  { id: "saque", label: "Saque" },
  { id: "chiquita", label: "Chiquita" },
  { id: "dejada", label: "Dejada" },
] as const;

const EFECTOS = [
  { id: "liftado", label: "Liftado" },
  { id: "cortado", label: "Cortado" },
  { id: "plano", label: "Plano" },
  { id: "sin_efecto", label: "Sin efecto" },
] as const;

const FASES = [
  { id: "activation", label: "Activación" },
  { id: "main", label: "Principal" },
  { id: "cooldown", label: "Vuelta a la calma" },
] as const;

const UBICACIONES = [
  { id: "indoor", label: "🏟️ Cubierta" },
  { id: "outdoor", label: "☀️ Exterior" },
  { id: "any", label: "📍 Cualquiera" },
] as const;

export interface ExerciseFiltersProps {
  currentFilters: {
    formato?: string;
    numJugadores?: number;
    tipoPelota?: string;
    tipoActividad?: string;
    golpes: string[];
    efecto: string[];
    minDuracion?: number;
    maxDuracion?: number;
    location?: string;
    phase?: string;
    intensity?: number;
  };
  preserved: {
    q?: string;
    tab?: string;
    category?: string;
    difficulty?: string;
  };
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-sans tracking-[0.06em] whitespace-nowrap transition-colors border rounded",
        active
          ? "border-brand text-brand bg-brand/5"
          : "border-foreground/15 text-foreground/55 hover:text-foreground hover:border-foreground/30"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function ExerciseFilters({ currentFilters, preserved }: ExerciseFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [formato, setFormato] = useState(currentFilters.formato ?? "");
  const [numJugadores, setNumJugadores] = useState<number | null>(
    currentFilters.numJugadores ?? null
  );
  const [tipoPelota, setTipoPelota] = useState(currentFilters.tipoPelota ?? "");
  const [tipoActividad, setTipoActividad] = useState(
    currentFilters.tipoActividad ?? ""
  );
  const [golpes, setGolpes] = useState<Set<string>>(
    new Set(currentFilters.golpes)
  );
  const [efecto, setEfecto] = useState<Set<string>>(
    new Set(currentFilters.efecto)
  );
  const [minDuracion, setMinDuracion] = useState<string>(
    currentFilters.minDuracion ? String(currentFilters.minDuracion) : ""
  );
  const [maxDuracion, setMaxDuracion] = useState<string>(
    currentFilters.maxDuracion ? String(currentFilters.maxDuracion) : ""
  );
  const [location, setLocation] = useState(currentFilters.location ?? "");
  const [phase, setPhase] = useState(currentFilters.phase ?? "");
  const [intensity, setIntensity] = useState<number | null>(
    currentFilters.intensity ?? null
  );

  const activeCount = [
    formato,
    numJugadores != null ? "x" : "",
    tipoPelota,
    tipoActividad,
    golpes.size > 0 ? "x" : "",
    efecto.size > 0 ? "x" : "",
    minDuracion,
    maxDuracion,
    location,
    phase,
    intensity != null ? "x" : "",
  ].filter(Boolean).length;

  function toggleSet(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function buildParams() {
    const p = new URLSearchParams();
    if (preserved.q) p.set("q", preserved.q);
    if (preserved.tab && preserved.tab !== "all") p.set("tab", preserved.tab);
    if (preserved.category && preserved.category !== "all")
      p.set("category", preserved.category);
    if (preserved.difficulty && preserved.difficulty !== "all")
      p.set("difficulty", preserved.difficulty);
    if (formato) p.set("formato", formato);
    if (numJugadores != null) p.set("numJugadores", String(numJugadores));
    if (tipoPelota) p.set("tipoPelota", tipoPelota);
    if (tipoActividad) p.set("tipoActividad", tipoActividad);
    for (const g of golpes) p.append("golpe", g);
    for (const e of efecto) p.append("efecto", e);
    if (minDuracion) p.set("minDuracion", minDuracion);
    if (maxDuracion) p.set("maxDuracion", maxDuracion);
    if (location) p.set("location", location);
    if (phase) p.set("phase", phase);
    if (intensity != null) p.set("intensity", String(intensity));
    return p;
  }

  function applyFilters() {
    const p = buildParams();
    router.push(`/exercises${p.toString() ? `?${p}` : ""}`);
    setOpen(false);
  }

  function clearFilters() {
    setFormato("");
    setNumJugadores(null);
    setTipoPelota("");
    setTipoActividad("");
    setGolpes(new Set());
    setEfecto(new Set());
    setMinDuracion("");
    setMaxDuracion("");
    setLocation("");
    setPhase("");
    setIntensity(null);

    const p = new URLSearchParams();
    if (preserved.q) p.set("q", preserved.q);
    if (preserved.tab && preserved.tab !== "all") p.set("tab", preserved.tab);
    if (preserved.category && preserved.category !== "all")
      p.set("category", preserved.category);
    if (preserved.difficulty && preserved.difficulty !== "all")
      p.set("difficulty", preserved.difficulty);
    router.push(`/exercises${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-3 text-[11px] font-sans tracking-[0.08em] border rounded transition-colors whitespace-nowrap",
          open || activeCount > 0
            ? "border-brand text-brand bg-brand/5"
            : "border-foreground/20 text-foreground/55 hover:text-foreground hover:border-foreground/30"
        )}
      >
        <SlidersHorizontal className="size-3.5" strokeWidth={1.6} />
        Filtros
        {activeCount > 0 && (
          <span className="size-4 rounded-full bg-brand text-background text-[9px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {open ? (
          <ChevronUp className="size-3" strokeWidth={1.6} />
        ) : (
          <ChevronDown className="size-3" strokeWidth={1.6} />
        )}
      </button>

      {open && (
        <div className="mt-3 border border-foreground/15 rounded-lg p-5 space-y-5 bg-foreground/[0.01]">
          {/* Row 1: Formato + Nº jugadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FilterGroup label="Formato">
              {FORMATOS.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={formato === id}
                  onClick={() => setFormato(formato === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Nº jugadores">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <ChipButton
                  key={n}
                  active={numJugadores === n}
                  onClick={() => setNumJugadores(numJugadores === n ? null : n)}
                >
                  {n}
                </ChipButton>
              ))}
              <ChipButton
                active={numJugadores != null && numJugadores > 6}
                onClick={() =>
                  setNumJugadores(
                    numJugadores != null && numJugadores > 6 ? null : 7
                  )
                }
              >
                +6
              </ChipButton>
            </FilterGroup>
          </div>

          {/* Row 2: Tipo actividad + Tipo pelota */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FilterGroup label="Tipo de actividad">
              {TIPOS_ACTIVIDAD.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={tipoActividad === id}
                  onClick={() => setTipoActividad(tipoActividad === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Tipo de pelota">
              {TIPOS_PELOTA.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={tipoPelota === id}
                  onClick={() => setTipoPelota(tipoPelota === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>
          </div>

          {/* Row 3: Golpes */}
          <FilterGroup label="Golpes (multi-selección)">
            {GOLPES.map(({ id, label }) => (
              <ChipButton
                key={id}
                active={golpes.has(id)}
                onClick={() => toggleSet(golpes, setGolpes, id)}
              >
                {label}
              </ChipButton>
            ))}
          </FilterGroup>

          {/* Row 4: Efecto */}
          <FilterGroup label="Efecto de pelota (multi-selección)">
            {EFECTOS.map(({ id, label }) => (
              <ChipButton
                key={id}
                active={efecto.has(id)}
                onClick={() => toggleSet(efecto, setEfecto, id)}
              >
                {label}
              </ChipButton>
            ))}
          </FilterGroup>

          {/* Row 5: Condiciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                Duración (min)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  placeholder="Mín"
                  value={minDuracion}
                  onChange={(e) => setMinDuracion(e.target.value)}
                  className="w-16 h-8 px-2 text-[12px] bg-transparent border border-foreground/20 rounded focus:outline-none focus:border-brand/60 text-foreground placeholder:text-foreground/30 transition-colors"
                />
                <span className="text-foreground/30 text-[11px]">—</span>
                <input
                  type="number"
                  min={1}
                  max={300}
                  placeholder="Máx"
                  value={maxDuracion}
                  onChange={(e) => setMaxDuracion(e.target.value)}
                  className="w-16 h-8 px-2 text-[12px] bg-transparent border border-foreground/20 rounded focus:outline-none focus:border-brand/60 text-foreground placeholder:text-foreground/30 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                Intensidad
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <ChipButton
                    key={n}
                    active={intensity === n}
                    onClick={() => setIntensity(intensity === n ? null : n)}
                  >
                    {n}
                  </ChipButton>
                ))}
              </div>
            </div>

            <FilterGroup label="Fase">
              {FASES.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={phase === id}
                  onClick={() => setPhase(phase === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>
          </div>

          {/* Row 6: Ubicación */}
          <FilterGroup label="Ubicación">
            {UBICACIONES.map(({ id, label }) => (
              <ChipButton
                key={id}
                active={location === id}
                onClick={() => setLocation(location === id ? "" : id)}
              >
                {label}
              </ChipButton>
            ))}
          </FilterGroup>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-foreground/10">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-foreground text-background rounded hover:bg-foreground/85 transition-colors"
            >
              Aplicar filtros
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] text-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="size-3" />
                Limpiar ({activeCount})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
