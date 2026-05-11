"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FORMATOS = [
  { id: "individual", label: "Individual" },
  { id: "parejas", label: "Parejas" },
  { id: "grupal", label: "Grupal" },
  { id: "multigrupo", label: "Multigrupo" },
] as const;

const NIVELES = [
  { id: "descubrimiento", label: "Descubrimiento" },
  { id: "desarrollo", label: "Desarrollo" },
  { id: "consolidacion", label: "Consolidacion" },
  { id: "especializacion", label: "Especializacion" },
  { id: "precompeticion", label: "Precompeticion" },
  { id: "competicion", label: "Competicion" },
  { id: "adultos_iniciacion", label: "Adultos iniciacion" },
  { id: "adultos_medio_alto", label: "Adultos medio-alto" },
] as const;

const ASPECTOS = [
  { id: "tecnica", label: "Tecnica" },
  { id: "tactica", label: "Tactica" },
  { id: "mental", label: "Mental" },
  { id: "fisico", label: "Fisico" },
] as const;

const PARAMETROS = [
  { id: "altura", label: "Altura" },
  { id: "profundidad", label: "Profundidad" },
  { id: "velocidad", label: "Velocidad" },
  { id: "direccion", label: "Direccion" },
] as const;

const TIPOLOGIAS = [
  { id: "juego", label: "Juego" },
  { id: "reto", label: "Reto" },
  { id: "otros_deportes", label: "Otros deportes" },
] as const;

const DURACION_RANGOS = [
  { id: "1-5", label: "1-5 min" },
  { id: "5-10", label: "5-10 min" },
  { id: "10-15", label: "10-15 min" },
  { id: "15-20", label: "15-20 min" },
  { id: "+20", label: "+20 min" },
] as const;

const TIPOS_ACTIVIDAD = [
  { id: "tecnico_tactico", label: "Tecnico-tactico" },
  { id: "fisico", label: "Fisico" },
  { id: "cognitivo", label: "Cognitivo" },
  { id: "competitivo", label: "Competitivo" },
  { id: "ludico", label: "Ludico" },
] as const;

const TIPOS_PELOTA = [
  { id: "normal", label: "Normal" },
  { id: "lenta", label: "Lenta" },
  { id: "rapida", label: "Rapida" },
  { id: "sin_pelota", label: "Sin pelota" },
] as const;

const GOLPES = [
  { id: "derecha", label: "Derecha" },
  { id: "reves", label: "Reves" },
  { id: "saque", label: "Saque" },
  { id: "volea", label: "Volea" },
  { id: "remate", label: "Remate" },
  { id: "globo", label: "Globo" },
  { id: "dejada", label: "Dejada" },
] as const;

const EFECTOS = [
  { id: "liftado", label: "Liftado" },
  { id: "cortado", label: "Cortado" },
  { id: "plano", label: "Plano" },
  { id: "sin_efecto", label: "Sin efecto" },
] as const;

const UBICACIONES = [
  { id: "indoor", label: "Cubierta" },
  { id: "outdoor", label: "Exterior" },
  { id: "any", label: "Cualquiera" },
] as const;

export interface ExerciseFiltersProps {
  currentFilters: {
    formato?: string;
    nivel?: string;
    aspectoJuego?: string;
    parametro?: string;
    tipologia?: string;
    duracionRango?: string;
    numJugadores?: number;
    tipoPelota?: string;
    tipoActividad?: string;
    golpes: string[];
    efecto: string[];
    minDuracion?: number;
    maxDuracion?: number;
    location?: string;
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-sans font-semibold tracking-[0.04em] transition-colors",
        active
          ? "border-[#D6FF38] bg-[#D6FF38] text-[#050505]"
          : "border-foreground/15 text-foreground/55 hover:border-foreground/30 hover:bg-muted hover:text-foreground"
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
  children: ReactNode;
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

export function ExerciseFilters({
  currentFilters,
  preserved,
}: ExerciseFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formato, setFormato] = useState(currentFilters.formato ?? "");
  const [nivel, setNivel] = useState(currentFilters.nivel ?? "");
  const [aspectoJuego, setAspectoJuego] = useState(
    currentFilters.aspectoJuego ?? ""
  );
  const [parametro, setParametro] = useState(currentFilters.parametro ?? "");
  const [tipologia, setTipologia] = useState(currentFilters.tipologia ?? "");
  const [duracionRango, setDuracionRango] = useState(
    currentFilters.duracionRango ?? ""
  );
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
  const [minDuracion, setMinDuracion] = useState(
    currentFilters.minDuracion ? String(currentFilters.minDuracion) : ""
  );
  const [maxDuracion, setMaxDuracion] = useState(
    currentFilters.maxDuracion ? String(currentFilters.maxDuracion) : ""
  );
  const [location, setLocation] = useState(currentFilters.location ?? "");

  const activeCount = [
    formato,
    nivel,
    aspectoJuego,
    parametro,
    tipologia,
    duracionRango,
    numJugadores != null ? "x" : "",
    tipoPelota,
    tipoActividad,
    golpes.size > 0 ? "x" : "",
    efecto.size > 0 ? "x" : "",
    minDuracion,
    maxDuracion,
    location,
  ].filter(Boolean).length;

  function toggleSet(
    set: Set<string>,
    setter: (s: Set<string>) => void,
    value: string
  ) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function buildParams() {
    const p = new URLSearchParams();
    if (preserved.q) p.set("q", preserved.q);
    if (preserved.tab && preserved.tab !== "all") p.set("tab", preserved.tab);
    if (preserved.category && preserved.category !== "all") {
      p.set("category", preserved.category);
    }
    if (preserved.difficulty && preserved.difficulty !== "all") {
      p.set("difficulty", preserved.difficulty);
    }
    if (formato) p.set("formato", formato);
    if (nivel) p.set("nivel", nivel);
    if (aspectoJuego) p.set("aspectoJuego", aspectoJuego);
    if (parametro) p.set("parametro", parametro);
    if (tipologia) p.set("tipologia", tipologia);
    if (duracionRango) p.set("duracionRango", duracionRango);
    if (numJugadores != null) p.set("numJugadores", String(numJugadores));
    if (tipoPelota) p.set("tipoPelota", tipoPelota);
    if (tipoActividad) p.set("tipoActividad", tipoActividad);
    for (const g of golpes) p.append("golpe", g);
    for (const e of efecto) p.append("efecto", e);
    if (minDuracion) p.set("minDuracion", minDuracion);
    if (maxDuracion) p.set("maxDuracion", maxDuracion);
    if (location) p.set("location", location);
    return p;
  }

  function applyFilters() {
    const p = buildParams();
    router.push(`/exercises${p.toString() ? `?${p}` : ""}`);
    setOpen(false);
  }

  function clearFilters() {
    setFormato("");
    setNivel("");
    setAspectoJuego("");
    setParametro("");
    setTipologia("");
    setDuracionRango("");
    setNumJugadores(null);
    setTipoPelota("");
    setTipoActividad("");
    setGolpes(new Set());
    setEfecto(new Set());
    setMinDuracion("");
    setMaxDuracion("");
    setLocation("");

    const p = new URLSearchParams();
    if (preserved.q) p.set("q", preserved.q);
    if (preserved.tab && preserved.tab !== "all") p.set("tab", preserved.tab);
    if (preserved.category && preserved.category !== "all") {
      p.set("category", preserved.category);
    }
    if (preserved.difficulty && preserved.difficulty !== "all") {
      p.set("difficulty", preserved.difficulty);
    }
    router.push(`/exercises${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[11px] font-sans font-bold tracking-[0.08em] transition-colors",
          open || activeCount > 0
            ? "border-[#D6FF38] bg-[#D6FF38] text-[#050505]"
            : "border-foreground/20 text-foreground/55 hover:border-foreground/30 hover:bg-muted hover:text-foreground"
        )}
      >
        <SlidersHorizontal className="size-3.5" strokeWidth={1.6} />
        Filtros
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-[#050505] text-[9px] font-bold text-[#D6FF38]">
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
        <div className="mt-3 space-y-5 rounded-lg border border-foreground/10 bg-card p-4 shadow-sm shadow-black/5 sm:p-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FilterGroup label="Nivel">
              {NIVELES.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={nivel === id}
                  onClick={() => setNivel(nivel === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Aspecto de juego">
              {ASPECTOS.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={aspectoJuego === id}
                  onClick={() => setAspectoJuego(aspectoJuego === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FilterGroup label="Parametro">
              {PARAMETROS.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={parametro === id}
                  onClick={() => setParametro(parametro === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Tipologia">
              {TIPOLOGIAS.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={tipologia === id}
                  onClick={() => setTipologia(tipologia === id ? "" : id)}
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Rango">
              {DURACION_RANGOS.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={duracionRango === id}
                  onClick={() =>
                    setDuracionRango(duracionRango === id ? "" : id)
                  }
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

            <FilterGroup label="Jugadores">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FilterGroup label="Aspecto">
              {TIPOS_ACTIVIDAD.map(({ id, label }) => (
                <ChipButton
                  key={id}
                  active={tipoActividad === id}
                  onClick={() =>
                    setTipoActividad(tipoActividad === id ? "" : id)
                  }
                >
                  {label}
                </ChipButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Pelota">
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

          <FilterGroup label="Golpes">
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

          <FilterGroup label="Efecto">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                Duracion (min)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  placeholder="Min"
                  value={minDuracion}
                  onChange={(e) => setMinDuracion(e.target.value)}
                  className="h-8 w-16 rounded-lg border border-foreground/15 bg-background/70 px-2 text-[12px] text-foreground transition-colors placeholder:text-foreground/30 focus:border-[#D6FF38]/70 focus:outline-none"
                />
                <span className="text-[11px] text-foreground/30">-</span>
                <input
                  type="number"
                  min={1}
                  max={300}
                  placeholder="Max"
                  value={maxDuracion}
                  onChange={(e) => setMaxDuracion(e.target.value)}
                  className="h-8 w-16 rounded-lg border border-foreground/15 bg-background/70 px-2 text-[12px] text-foreground transition-colors placeholder:text-foreground/30 focus:border-[#D6FF38]/70 focus:outline-none"
                />
              </div>
            </div>

            <FilterGroup label="Lugar">
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
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-3">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-4 py-2 text-[12px] font-bold text-[#050505] transition-colors hover:bg-[#c8f52e]"
            >
              Aplicar filtros
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] text-foreground/50 transition-colors hover:text-foreground"
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
