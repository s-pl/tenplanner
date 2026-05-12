"use client";

import {
  type ElementType,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { DraftStatusPill } from "@/components/app/draft-status-pill";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Target,
  Brain,
  Dumbbell,
  Plus,
  X,
  Video,
  Lightbulb,
  ListOrdered,
  Package,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  Globe,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  generateDraftId,
  getExerciseDraft,
  hasMeaningfulExerciseDraft,
  removeExerciseDraft,
  upsertExerciseDraft,
  type ExerciseDraftPayload,
} from "@/lib/drafts";
import { cn } from "@/lib/utils";
import { MediaUploader } from "@/components/app/media-uploader";
import {
  deriveDurationMinutesFromRange,
  TIPO_ACTIVIDAD_LABELS,
} from "@/lib/exercise-taxonomy";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Location = "pista" | "pared" | "playa" | "casa";
type Phase = "activation" | "main" | "cooldown";
type ExerciseFormMode = "quick" | "full";
type AccordionSectionId = "essential" | "pedagogical" | "params" | "media";
type Formato = "individual" | "parejas" | "grupal" | "multigrupo";
type TipoActividad = "juego" | "reto" | "cognitivo" | "otros_deportes";
type LegacyTipoActividad =
  | "tecnico_tactico"
  | "fisico"
  | "cognitivo"
  | "competitivo"
  | "ludico";
type TipoPelota = "normal" | "lenta" | "rapida" | "sin_pelota";
const FORM_MODE_STORAGE_KEY = "exercise-form-mode";

const GOLPES_PRESET = [
  { id: "derecha", label: "Derecha" },
  { id: "reves", label: "Revés" },
  { id: "saque", label: "Saque" },
  { id: "volea", label: "Volea" },
  { id: "remate", label: "Remate" },
  { id: "dejada", label: "Dejada" },
  { id: "globo", label: "Globo" },
] as const;

const NIVELES_PMV = [
  { id: "descubrimiento", label: "Descubrimiento", desc: "4-6 años" },
  { id: "desarrollo", label: "Desarrollo", desc: "6-8 años" },
  { id: "consolidacion", label: "Consolidación", desc: "8-10 años" },
  { id: "especializacion", label: "Especialización", desc: "10-12 años" },
  { id: "precompeticion", label: "Precompetición", desc: "12-14 años" },
  { id: "competicion", label: "Competición", desc: "14-18 años" },
  { id: "adultos_iniciacion", label: "Adultos iniciación", desc: "Empiezan" },
  {
    id: "adultos_medio_alto",
    label: "Adultos medio-alto",
    desc: "Con base técnica",
  },
] as const;

const ASPECTOS_JUEGO = [
  { id: "tecnica", label: "Técnica" },
  { id: "tactica", label: "Táctica" },
  { id: "mental", label: "Trabajo mental" },
  { id: "fisico", label: "Físico" },
] as const;

const PARAMETROS = [
  { id: "altura", label: "Altura" },
  { id: "profundidad", label: "Profundidad" },
  { id: "velocidad", label: "Velocidad" },
  { id: "direccion", label: "Dirección" },
] as const;

const TIPOS_ACTIVIDAD = [
  { id: "juego", label: "Juego" },
  { id: "reto", label: "Reto" },
  { id: "cognitivo", label: TIPO_ACTIVIDAD_LABELS.cognitivo },
  { id: "otros_deportes", label: "Otros deportes" },
] as const;

const DURACION_RANGOS = [
  { id: "1-5", label: "1-5 min" },
  { id: "5-10", label: "5-10 min" },
  { id: "10-15", label: "10-15 min" },
  { id: "15-20", label: "15-20 min" },
  { id: "+20", label: "+20 min" },
] as const;

type NivelPmv = (typeof NIVELES_PMV)[number]["id"];
type AspectoJuego = (typeof ASPECTOS_JUEGO)[number]["id"];
type Parametro = (typeof PARAMETROS)[number]["id"];
type Tipologia = "juego" | "reto" | "otros_deportes";
type DuracionRango = (typeof DURACION_RANGOS)[number]["id"];

const EFECTO_PRESET = [
  { id: "liftado", label: "Liftado" },
  { id: "cortado", label: "Cortado" },
  { id: "plano", label: "Plano" },
  { id: "sin_efecto", label: "Sin efecto" },
] as const;

interface Step {
  id: string;
  title: string;
  description: string;
}

const formSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
  objectives: z.string().max(1000).optional().nullable(),
  tips: z.string().max(1000).optional().nullable(),
  variantes: z.string().max(2000).optional().nullable(),
  category: z.enum(["technique", "tactics", "fitness", "warm-up"] as const, {
    required_error: "Selecciona una categoría",
  }),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"] as const, {
      required_error: "Selecciona una dificultad",
    })
    .optional()
    .nullable(),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Introduce un número válido" })
    .int()
    .min(1, "Mínimo 1 minuto")
    .max(300, "Máximo 300 minutos")
    .optional()
    .nullable(),
  location: z.enum(["pista", "pared", "playa", "casa"]).optional().nullable(),
  nivel: z
    .enum([
      "descubrimiento",
      "desarrollo",
      "consolidacion",
      "especializacion",
      "precompeticion",
      "competicion",
      "adultos_iniciacion",
      "adultos_medio_alto",
    ])
    .optional()
    .nullable(),
  aspectoJuegoPmv: z
    .enum(["tecnica", "tactica", "mental", "fisico"])
    .optional()
    .nullable(),
  parametro: z
    .enum(["altura", "profundidad", "velocidad", "direccion"])
    .optional()
    .nullable(),
  tipologia: z.enum(["juego", "reto", "otros_deportes"]).optional().nullable(),
  duracionRango: z
    .enum(["1-5", "5-10", "10-15", "15-20", "+20"])
    .nullable()
    .superRefine((value, ctx) => {
      if (value === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un rango de duración",
        });
      }
    }),
  videoUrl: z.string().max(500).optional().nullable(),
  phase: z.enum(["activation", "main", "cooldown"]).optional().nullable(),
  intensity: z.coerce.number().int().min(1).max(5).optional().nullable(),
  formato: z
    .enum(["individual", "parejas", "grupal", "multigrupo"])
    .optional()
    .nullable(),
  numJugadores: z.coerce.number().int().min(1).max(6).optional().nullable(),
  tipoPelota: z
    .enum(["normal", "lenta", "rapida", "sin_pelota"])
    .optional()
    .nullable(),
  tipoActividad: z
    .enum(["juego", "reto", "cognitivo", "otros_deportes"])
    .optional()
    .nullable(),
  isGlobal: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES: {
  id: Category;
  label: string;
  icon: ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "technique",
    label: "Técnica",
    icon: Target,
    color: "text-blue-400",
    activeBg: "bg-blue-400/15",
    activeBorder: "border-blue-400",
    bg: "bg-blue-400/5",
    border: "border-blue-400/20",
  },
  {
    id: "tactics",
    label: "Táctica",
    icon: Brain,
    color: "text-purple-400",
    activeBg: "bg-purple-400/15",
    activeBorder: "border-purple-400",
    bg: "bg-purple-400/5",
    border: "border-purple-400/20",
  },
  {
    id: "warm-up",
    label: "Trabajo mental",
    icon: Brain,
    color: "text-brand",
    activeBg: "bg-brand/15",
    activeBorder: "border-brand",
    bg: "bg-brand/5",
    border: "border-brand/20",
  },
  {
    id: "fitness",
    label: "Físico",
    icon: Dumbbell,
    color: "text-amber-400",
    activeBg: "bg-amber-400/15",
    activeBorder: "border-amber-400",
    bg: "bg-amber-400/5",
    border: "border-amber-400/20",
  },
];

// Mapping nivel PMV -> difficulty (compatibility with existing DB column)
const NIVEL_TO_DIFFICULTY: Record<NivelPmv, Difficulty> = {
  descubrimiento: "beginner",
  desarrollo: "beginner",
  consolidacion: "intermediate",
  especializacion: "intermediate",
  precompeticion: "advanced",
  competicion: "advanced",
  adultos_iniciacion: "beginner",
  adultos_medio_alto: "advanced",
};

const LOCATIONS: { id: Location; label: string; icon: string }[] = [
  { id: "pista", label: "Pista/cancha", icon: "🎾" },
  { id: "pared", label: "Pared", icon: "🧱" },
  { id: "playa", label: "Playa", icon: "🏖️" },
  { id: "casa", label: "Casa", icon: "🏠" },
];

const PRESET_MATERIALS = [
  "Pelota de gomaespuma",
  "Pelota roja",
  "Pelota naranja",
  "Pelota verde",
  "Pelota amarilla",
  "Conos",
  "Chinos",
  "Comba",
  "Líneas de goma",
  "Escalera",
];

export interface ExerciseFormProps {
  mode: "create" | "edit";
  exerciseId?: string;
  isAdmin?: boolean;
  initialFormMode?: ExerciseFormMode;
  enableDrafts?: boolean;
  draftQueryParam?: string;
  initialData?: {
    name?: string;
    description?: string | null;
    category?: Category;
    difficulty?: Difficulty;
    durationMinutes?: number;
    objectives?: string | null;
    tips?: string | null;
    location?: Location | null;
    videoUrl?: string | null;
    steps?: Array<{ title: string; description: string }> | null;
    materials?: string[] | null;
    imageUrl?: string | null;
    phase?: Phase | null;
    intensity?: number | null;
    formato?: Formato | null;
    numJugadores?: number | null;
    tipoPelota?: TipoPelota | null;
    tipoActividad?: LegacyTipoActividad | TipoActividad | null;
    tiposActividad?: TipoActividad[] | null;
    golpes?: string[] | null;
    efecto?: string[] | null;
    variantes?: string | null;
    imageUrls?: string[] | null;
    isGlobal?: boolean;
    nivel?: NivelPmv | null;
    niveles?: NivelPmv[] | null;
    aspectoJuego?: AspectoJuego | null;
    aspectosJuego?: AspectoJuego[] | null;
    parametro?: Parametro | null;
    parametros?: Parametro[] | null;
    tipologia?: Tipologia | null;
    duracionRango?: DuracionRango | null;
  };
  onSuccess?: (result?: ExerciseFormResult) => void;
  onCancel?: () => void;
}

export interface ExerciseFormResult {
  id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  durationMinutes: number;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-foreground/10 pb-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#D6FF38]/40 bg-[#D6FF38]/12 text-[#D6FF38]">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
          {title}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function resolveInitialFormMode(
  mode: ExerciseFormProps["mode"],
  initialFormMode?: ExerciseFormMode
): ExerciseFormMode {
  if (mode === "edit") return "full";
  if (initialFormMode) return initialFormMode;
  if (typeof window === "undefined") return "quick";

  return window.localStorage.getItem(FORM_MODE_STORAGE_KEY) === "full"
    ? "full"
    : "quick";
}

function buildImageSlots(initialData?: ExerciseFormProps["initialData"]) {
  const images = [
    initialData?.imageUrl ?? null,
    ...(initialData?.imageUrls ?? []),
  ].filter(
    (value, index, current): value is string =>
      !!value && current.indexOf(value) === index
  );

  return [
    images[0] ?? null,
    images[1] ?? null,
    images[2] ?? null,
    images[3] ?? null,
  ] satisfies Array<string | null>;
}

function countFilled(values: boolean[]) {
  return values.filter(Boolean).length;
}

function resolveInitialTiposActividad(
  initialData?: ExerciseFormProps["initialData"]
) {
  if (initialData?.tiposActividad?.length) return initialData.tiposActividad;
  if (initialData?.tipologia) return [initialData.tipologia];
  if (initialData?.tipoActividad === "cognitivo") return ["cognitivo" as const];
  return [];
}

function AccordionSection({
  title,
  subtitle,
  filled,
  total,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  filled: number;
  total: number;
  open: boolean;
  onToggle: (next: boolean) => void;
  children: ReactNode;
}) {
  const fillPct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const isComplete = filled === total;

  return (
    <details
      open={open}
      onToggle={(event) => onToggle(event.currentTarget.open)}
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-sm shadow-black/5 transition-colors",
        open ? "border-[#D6FF38]/40" : "border-foreground/10"
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:content-none">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-foreground">{title}</p>
            {isComplete ? (
              <span className="rounded-full border border-[#D6FF38]/30 bg-[#D6FF38]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
                Completo
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {filled}/{total}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? "bg-[#D6FF38]" : "bg-[#D6FF38]/50"
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all",
            open && "rotate-180 bg-[#D6FF38] text-[#050505]"
          )}
        >
          <ChevronDown className="size-4" />
        </div>
      </summary>
      <div className="border-t border-foreground/10 px-4 py-5">{children}</div>
    </details>
  );
}

export function ExerciseForm({
  mode,
  exerciseId,
  isAdmin = false,
  initialFormMode,
  enableDrafts = false,
  draftQueryParam = "draft",
  initialData,
  onSuccess,
  onCancel,
}: ExerciseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<ExerciseFormMode>(() =>
    resolveInitialFormMode(mode, initialFormMode)
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<AccordionSectionId, boolean>
  >({
    essential: true,
    pedagogical: false,
    params: false,
    media: false,
  });
  const formModeChangedRef = useRef(false);
  const draftHydratedRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [imageSlots, setImageSlots] = useState<Array<string | null>>(() =>
    buildImageSlots(initialData)
  );
  const [steps, setSteps] = useState<Step[]>(() =>
    (initialData?.steps ?? []).map((s, i) => ({
      id: String(i),
      title: s.title,
      description: s.description,
    }))
  );
  const [materials, setMaterials] = useState<string[]>(
    initialData?.materials ?? []
  );
  const [materialInput, setMaterialInput] = useState("");
  const [niveles, setNiveles] = useState<Set<NivelPmv>>(
    new Set(
      initialData?.niveles ?? (initialData?.nivel ? [initialData.nivel] : [])
    )
  );
  const [aspectosJuego, setAspectosJuego] = useState<Set<AspectoJuego>>(
    new Set(
      initialData?.aspectosJuego ??
        (initialData?.aspectoJuego ? [initialData.aspectoJuego] : [])
    )
  );
  const [parametros, setParametros] = useState<Set<Parametro>>(
    new Set(
      initialData?.parametros ??
        (initialData?.parametro ? [initialData.parametro] : [])
    )
  );
  const [tiposActividad, setTiposActividad] = useState<Set<TipoActividad>>(
    new Set(resolveInitialTiposActividad(initialData))
  );
  const [golpes, setGolpes] = useState<Set<string>>(
    new Set(initialData?.golpes ?? [])
  );
  const [efecto, setEfecto] = useState<Set<string>>(
    new Set(initialData?.efecto ?? [])
  );
  const materialInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      objectives: initialData?.objectives ?? "",
      tips: initialData?.tips ?? "",
      variantes: initialData?.variantes ?? "",
      category: initialData?.category,
      difficulty: initialData?.difficulty,
      durationMinutes: initialData?.durationMinutes,
      location: initialData?.location ?? null,
      videoUrl: initialData?.videoUrl ?? "",
      phase: initialData?.phase ?? null,
      intensity: initialData?.intensity ?? null,
      formato: initialData?.formato ?? null,
      numJugadores: initialData?.numJugadores ?? null,
      tipoPelota: initialData?.tipoPelota ?? null,
      tipoActividad: null,
      isGlobal: initialData?.isGlobal ?? false,
      nivel: initialData?.niveles?.[0] ?? initialData?.nivel ?? null,
      aspectoJuegoPmv:
        initialData?.aspectosJuego?.[0] ?? initialData?.aspectoJuego ?? null,
      parametro: initialData?.parametros?.[0] ?? initialData?.parametro ?? null,
      tipologia: initialData?.tipologia ?? null,
      duracionRango: initialData?.duracionRango ?? null,
    },
  });
  const watchedValues = useWatch({ control });
  const normalizedImages = imageSlots.filter((value): value is string =>
    Boolean(value)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode === "edit" && !formModeChangedRef.current) return;

    window.localStorage.setItem(FORM_MODE_STORAGE_KEY, formMode);
  }, [formMode, mode]);

  // One-time mount hydration — uses window.location.search to avoid re-running
  // when the URL is updated via history.replaceState after manual draft save.
  useEffect(() => {
    if (!enableDrafts || mode !== "create") {
      draftHydratedRef.current = true;
      return;
    }

    let hydrationTimeout: number | null = null;
    let cancelled = false;

    const draftId = new URLSearchParams(window.location.search).get(
      draftQueryParam
    );
    draftIdRef.current = draftId;
    if (!draftId) {
      draftHydratedRef.current = true;
      return;
    }

    void getExerciseDraft(draftId).then((draft) => {
      if (cancelled) return;
      if (!draft) {
        draftHydratedRef.current = true;
        return;
      }

      draftHydratedRef.current = false;
      reset({
        name: draft.payload.name,
        description: draft.payload.description,
        objectives: draft.payload.objectives,
        tips: draft.payload.tips,
        variantes: draft.payload.variantes,
        category: draft.payload.category as Category | undefined,
        difficulty: draft.payload.difficulty as Difficulty | undefined,
        durationMinutes: draft.payload.durationMinutes,
        location: (draft.payload.location ?? null) as Location | null,
        videoUrl: draft.payload.videoUrl ?? "",
        phase: (draft.payload.phase ?? null) as Phase | null,
        intensity: draft.payload.intensity ?? null,
        formato: (draft.payload.formato ?? null) as Formato | null,
        numJugadores: draft.payload.numJugadores ?? null,
        tipoPelota: (draft.payload.tipoPelota ?? null) as TipoPelota | null,
        tipoActividad: null,
        isGlobal: draft.payload.isGlobal ?? false,
        nivel: (draft.payload.niveles?.[0] ??
          draft.payload.nivel ??
          null) as NivelPmv | null,
        aspectoJuegoPmv: (draft.payload.aspectosJuego?.[0] ??
          draft.payload.aspectoJuego ??
          null) as AspectoJuego | null,
        parametro: (draft.payload.parametros?.[0] ??
          draft.payload.parametro ??
          null) as Parametro | null,
        duracionRango: (draft.payload.duracionRango ??
          null) as DuracionRango | null,
      });
      setFormMode(draft.payload.formMode);
      setSteps(draft.payload.steps);
      setMaterials(draft.payload.materials);
      setNiveles(
        new Set(
          (draft.payload.niveles ??
            (draft.payload.nivel ? [draft.payload.nivel] : [])) as NivelPmv[]
        )
      );
      setAspectosJuego(
        new Set(
          (draft.payload.aspectosJuego ??
            (draft.payload.aspectoJuego
              ? [draft.payload.aspectoJuego]
              : [])) as AspectoJuego[]
        )
      );
      setParametros(
        new Set(
          (draft.payload.parametros ??
            (draft.payload.parametro
              ? [draft.payload.parametro]
              : [])) as Parametro[]
        )
      );
      setTiposActividad(
        new Set(
          (draft.payload.tiposActividad ??
            (draft.payload.tipoActividad
              ? [draft.payload.tipoActividad]
              : [])) as TipoActividad[]
        )
      );
      setGolpes(new Set(draft.payload.golpes));
      setEfecto(new Set(draft.payload.efecto));
      setImageSlots(
        draft.payload.images.length === 4
          ? draft.payload.images
          : [
              draft.payload.images[0] ?? null,
              draft.payload.images[1] ?? null,
              draft.payload.images[2] ?? null,
              draft.payload.images[3] ?? null,
            ]
      );
      hydrationTimeout = window.setTimeout(() => {
        draftHydratedRef.current = true;
      }, 0);
    });

    return () => {
      cancelled = true;
      if (hydrationTimeout !== null) {
        window.clearTimeout(hydrationTimeout);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateFormMode(next: ExerciseFormMode) {
    formModeChangedRef.current = true;
    setFormMode(next);
  }

  function toggleAccordion(section: AccordionSectionId, next: boolean) {
    setExpandedSections((current) => ({ ...current, [section]: next }));
  }

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", description: "" },
    ]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(
    id: string,
    field: "title" | "description",
    value: string
  ) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function moveStep(index: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addMaterial(value: string) {
    const trimmed = value.trim();
    if (!trimmed || materials.includes(trimmed)) return;
    setMaterials((prev) => [...prev, trimmed]);
    setMaterialInput("");
  }

  function handleMaterialKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMaterial(materialInput);
    }
    if (e.key === "Backspace" && !materialInput && materials.length > 0) {
      setMaterials((prev) => prev.slice(0, -1));
    }
  }

  function removeMaterial(m: string) {
    setMaterials((prev) => prev.filter((x) => x !== m));
  }

  function toggleSetValue<T extends string>(
    setter: (next: Set<T>) => void,
    current: Set<T>,
    value: T
  ) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const draftPayload: ExerciseDraftPayload = {
    name: watchedValues.name ?? "",
    description: watchedValues.description ?? "",
    objectives: watchedValues.objectives ?? "",
    tips: watchedValues.tips ?? "",
    variantes: watchedValues.variantes ?? "",
    category: watchedValues.category,
    difficulty: watchedValues.difficulty ?? undefined,
    durationMinutes: watchedValues.durationMinutes ?? undefined,
    location: watchedValues.location ?? null,
    videoUrl: watchedValues.videoUrl ?? "",
    phase: watchedValues.phase ?? null,
    intensity: watchedValues.intensity ?? null,
    formato: watchedValues.formato ?? null,
    numJugadores: watchedValues.numJugadores ?? null,
    tipoPelota: watchedValues.tipoPelota ?? null,
    tipoActividad: null,
    nivel: Array.from(niveles)[0] ?? null,
    niveles: Array.from(niveles),
    aspectoJuego: Array.from(aspectosJuego)[0] ?? null,
    aspectosJuego: Array.from(aspectosJuego),
    parametro: Array.from(parametros)[0] ?? null,
    parametros: Array.from(parametros),
    tiposActividad: Array.from(tiposActividad),
    duracionRango: watchedValues.duracionRango ?? null,
    isGlobal: watchedValues.isGlobal ?? false,
    steps,
    materials,
    images: imageSlots,
    golpes: Array.from(golpes),
    efecto: Array.from(efecto),
    formMode,
  };

  async function handleSaveDraft() {
    if (!enableDrafts || mode !== "create" || !draftHydratedRef.current) {
      return;
    }

    if (!hasMeaningfulExerciseDraft(draftPayload)) {
      if (draftIdRef.current) {
        await removeExerciseDraft(draftIdRef.current);
        draftIdRef.current = null;
        const params = new URLSearchParams(window.location.search);
        params.delete(draftQueryParam);
        const nextQuery = params.toString();
        window.history.replaceState(
          null,
          "",
          nextQuery
            ? `${window.location.pathname}?${nextQuery}`
            : window.location.pathname
        );
      }
      setSaveStatus("idle");
      setSavedAt(null);
      return;
    }

    let nextDraftId = draftIdRef.current;
    if (!nextDraftId) {
      nextDraftId = generateDraftId();
      draftIdRef.current = nextDraftId;
      const params = new URLSearchParams(window.location.search);
      params.set(draftQueryParam, nextDraftId);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }

    setSaveStatus("saving");
    try {
      await upsertExerciseDraft({
        id: nextDraftId,
        name: draftPayload.name.trim() || "Ejercicio sin título",
        updatedAt: new Date().toISOString(),
        payload: draftPayload,
      });
      setSaveStatus("saved");
      setSavedAt(new Date());
    } catch {
      setSaveStatus("idle");
    }
  }

  const essentialFilled = countFilled([
    !!watchedValues.name?.trim(),
    !!watchedValues.category,
    niveles.size > 0,
    !!watchedValues.duracionRango,
    isAdmin ? !!watchedValues.isGlobal : false,
  ]);
  const essentialTotal = isAdmin ? 5 : 4;

  const pedagogicalFilled = countFilled([
    !!watchedValues.objectives?.trim(),
    !!watchedValues.description?.trim(),
    !!watchedValues.tips?.trim(),
    !!watchedValues.variantes?.trim(),
    !!watchedValues.videoUrl?.trim(),
    steps.some((step) => step.title.trim() || step.description.trim()),
  ]);

  const paramsFilled = countFilled([
    !!watchedValues.formato,
    watchedValues.numJugadores != null,
    tiposActividad.size > 0,
    !!watchedValues.tipoPelota,
    golpes.size > 0,
    efecto.size > 0,
    aspectosJuego.size > 0,
    parametros.size > 0,
  ]);

  const mediaFilled = countFilled([
    !!watchedValues.location,
    materials.length > 0,
    normalizedImages.length > 0,
    normalizedImages.length >= 3,
  ]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setServerError(null);
    const url =
      mode === "create" ? "/api/exercises" : `/api/exercises/${exerciseId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const selectedNiveles = Array.from(niveles);
    const selectedAspectosJuego = Array.from(aspectosJuego);
    const selectedParametros = Array.from(parametros);
    const selectedTiposActividad = Array.from(tiposActividad);
    const primaryNivel = selectedNiveles[0] ?? values.nivel ?? null;
    const derivedDifficulty: Difficulty =
      primaryNivel != null
        ? NIVEL_TO_DIFFICULTY[primaryNivel]
        : (values.difficulty ?? "beginner");
    const derivedDurationMinutes =
      deriveDurationMinutesFromRange(values.duracionRango) ??
      values.durationMinutes ??
      null;

    const payload = {
      ...values,
      difficulty: derivedDifficulty,
      durationMinutes: derivedDurationMinutes,
      description: values.description?.trim() || null,
      objectives: values.objectives?.trim() || null,
      tips: values.tips?.trim() || null,
      videoUrl: values.videoUrl?.trim() || null,
      imageUrl: normalizedImages[0] ?? null,
      phase: values.phase ?? null,
      intensity: values.intensity ?? null,
      isGlobal: isAdmin ? (values.isGlobal ?? false) : undefined,
      formato: values.formato ?? null,
      numJugadores: values.numJugadores ?? null,
      tipoPelota: values.tipoPelota ?? null,
      tipoActividad: null,
      tiposActividad:
        selectedTiposActividad.length > 0 ? selectedTiposActividad : null,
      golpes: golpes.size > 0 ? Array.from(golpes) : null,
      efecto: efecto.size > 0 ? Array.from(efecto) : null,
      variantes: values.variantes?.trim() || null,
      imageUrls: normalizedImages.slice(1),
      steps: steps
        .filter((s) => s.title.trim())
        .map((s) => ({
          title: s.title.trim(),
          description: s.description.trim(),
        })),
      materials: materials.filter(Boolean),
      // PMV taxonomy fields
      nivel: primaryNivel,
      niveles: selectedNiveles.length > 0 ? selectedNiveles : null,
      aspectoJuego: selectedAspectosJuego[0] ?? values.aspectoJuegoPmv ?? null,
      aspectosJuego:
        selectedAspectosJuego.length > 0 ? selectedAspectosJuego : null,
      parametro: selectedParametros[0] ?? values.parametro ?? null,
      parametros: selectedParametros.length > 0 ? selectedParametros : null,
      tipologia: null,
      duracionRango: values.duracionRango ?? null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseData = (await res.json().catch(() => ({}))) as {
      data?: ExerciseFormResult;
      details?: Array<{ message: string }>;
      error?: string;
    };

    if (!res.ok) {
      setServerError(
        responseData.details?.map((d) => d.message).join(". ") ??
          responseData.error ??
          "Ha ocurrido un error."
      );
      return;
    }

    if (mode === "create") {
      if (draftIdRef.current) {
        removeExerciseDraft(draftIdRef.current);
        draftIdRef.current = null;
        const params = new URLSearchParams(window.location.search);
        params.delete(draftQueryParam);
        const nextQuery = params.toString();
        window.history.replaceState(
          null,
          "",
          nextQuery
            ? `${window.location.pathname}?${nextQuery}`
            : window.location.pathname
        );
      }

      if (onSuccess) {
        onSuccess(responseData.data);
        return;
      }

      router.push("/exercises");
      router.refresh();
    } else {
      onSuccess?.(responseData.data);
    }
  };

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    void handleSubmit(onSubmit)(event);
  }

  const nivelesField = (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        Nivel
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {NIVELES_PMV.map(({ id, label, desc }) => {
          const isSelected = niveles.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleSetValue(setNiveles, niveles, id)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-3 text-left transition-all duration-150",
                isSelected
                  ? "bg-brand/10 border-brand text-brand"
                  : "border-border hover:bg-muted"
              )}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const durationRangeField = (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        Rango de duración
      </label>
      <Controller
        name="duracionRango"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-2">
            {DURACION_RANGOS.map(({ id, label }) => {
              const isSelected = field.value === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => field.onChange(isSelected ? null : id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.duracionRango && (
        <p className="text-xs text-destructive">
          {errors.duracionRango.message}
        </p>
      )}
    </div>
  );

  const basicSection = (
    <section>
      <SectionHeader
        icon={Dumbbell}
        title="Información básica"
        subtitle="Nombre, categoría, nivel y duración"
      />
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-foreground"
          >
            Nombre del ejercicio
          </label>
          <input
            id="name"
            type="text"
            placeholder="Ej: Bandeja cruzada de revés"
            autoComplete="off"
            aria-invalid={!!errors.name}
            {...register("name")}
            className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Categoría
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map(
                  ({
                    id,
                    label,
                    icon: Icon,
                    color,
                    activeBg,
                    activeBorder,
                    bg,
                    border,
                  }) => {
                    const isSelected = field.value === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => field.onChange(id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all duration-150",
                          isSelected
                            ? `${activeBg} ${activeBorder} ${color}`
                            : `${bg} ${border} text-muted-foreground hover:bg-muted hover:text-foreground`
                        )}
                      >
                        <Icon className="size-5" />
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          />
          {errors.category ? (
            <p className="text-xs text-destructive">
              {errors.category.message}
            </p>
          ) : null}
        </div>

        {nivelesField}

        {durationRangeField}

        {/* Materials — always visible regardless of mode */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Material necesario{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <div
            className={cn(
              "min-h-[42px] flex flex-wrap gap-2 items-center px-3 py-2 bg-background border border-border rounded-xl transition-colors focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50"
            )}
          >
            {materials.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 bg-brand/10 text-brand text-xs font-semibold px-2.5 py-1 rounded-lg"
              >
                {m}
                <button
                  type="button"
                  onClick={() => removeMaterial(m)}
                  className="hover:text-brand/60 transition-colors ml-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              ref={materialInputRef}
              type="text"
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              onKeyDown={handleMaterialKey}
              onBlur={() => {
                if (materialInput.trim()) addMaterial(materialInput);
              }}
              placeholder={
                materials.length === 0
                  ? "Escribe y pulsa Enter para añadir…"
                  : ""
              }
              className="flex-1 min-w-[140px] h-7 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MATERIALS.filter((m) => !materials.includes(m)).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => addMaterial(m)}
                className="text-xs text-muted-foreground border border-border/60 px-2 py-1 rounded-lg hover:bg-brand/10 hover:text-brand hover:border-brand/30 transition-colors"
              >
                + {m}
              </button>
            ))}
          </div>
        </div>

        {formMode === "full" ? (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Fase del entrenamiento{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <Controller
                name="phase"
                control={control}
                render={({ field }) => {
                  const PHASES: { id: Phase | null; label: string }[] = [
                    { id: null, label: "Sin asignar" },
                    { id: "activation", label: "Activación" },
                    { id: "main", label: "Principal" },
                    { id: "cooldown", label: "Vuelta a la calma" },
                  ];
                  return (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PHASES.map(({ id, label }) => {
                        const isSelected = (field.value ?? null) === id;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => field.onChange(id)}
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-150",
                              isSelected
                                ? "bg-brand/10 border-brand text-brand"
                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </div>

            {/* Intensidad eliminada del UI según PMV 260506 — se mantiene en BD */}

            {isAdmin ? (
              <div className="space-y-2 border-t border-border/60 pt-2">
                <Controller
                  name="isGlobal"
                  control={control}
                  render={({ field }) => (
                    <label className="group flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-0.5 size-4 rounded border-border text-brand focus:ring-brand/40"
                      />
                      <div className="flex-1">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <Globe className="size-3.5" /> Ejercicio biblioteca
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Pasa a la biblioteca pública de Ten Planner.
                        </p>
                      </div>
                    </label>
                  )}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );

  const parametersSection = (
    <section>
      <SectionHeader
        icon={SlidersHorizontal}
        title="Aspectos del juego"
        subtitle="Formato, jugadores, pelota, tipo de actividad, golpes, efecto y parámetros"
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Formato{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Controller
              name="formato"
              control={control}
              render={({ field }) => {
                const FORMATOS: { id: Formato; label: string }[] = [
                  { id: "individual", label: "Individual" },
                  { id: "parejas", label: "Parejas" },
                  { id: "grupal", label: "Grupal" },
                  { id: "multigrupo", label: "Multigrupo" },
                ];
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATOS.map(({ id, label }) => {
                      const isSelected = field.value === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            field.onChange(field.value === id ? null : id)
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-150",
                            isSelected
                              ? "bg-brand/10 border-brand text-brand"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> Nº jugadores
              </span>{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Controller
              name="numJugadores"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const isSelected = field.value === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(isSelected ? null : n)}
                        className={cn(
                          "size-10 rounded-xl border text-sm font-semibold transition-all duration-150",
                          isSelected
                            ? "bg-brand text-brand-foreground border-brand"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                  {field.value != null ? (
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Tipo de actividad{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_ACTIVIDAD.map(({ id, label }) => {
                const isSelected = tiposActividad.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      toggleSetValue(setTiposActividad, tiposActividad, id)
                    }
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                      isSelected
                        ? "bg-brand/10 border-brand text-brand"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Tipo de pelota{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Controller
              name="tipoPelota"
              control={control}
              render={({ field }) => {
                const TIPOS: { id: TipoPelota; label: string }[] = [
                  { id: "normal", label: "Normal" },
                  { id: "lenta", label: "Lenta" },
                  { id: "rapida", label: "Rápida" },
                  { id: "sin_pelota", label: "Sin pelota" },
                ];
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS.map(({ id, label }) => {
                      const isSelected = field.value === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            field.onChange(field.value === id ? null : id)
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-150",
                            isSelected
                              ? "bg-brand/10 border-brand text-brand"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Golpes trabajados{" "}
            <span className="font-normal text-muted-foreground">
              (multi-selección, opcional)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GOLPES_PRESET.map(({ id, label }) => {
              const isSelected = golpes.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const next = new Set(golpes);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setGolpes(next);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {golpes.size > 0 ? (
            <button
              type="button"
              onClick={() => setGolpes(new Set<string>())}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Limpiar golpes
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Efecto de pelota{" "}
            <span className="font-normal text-muted-foreground">
              (multi-selección, opcional)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EFECTO_PRESET.map(({ id, label }) => {
              const isSelected = efecto.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const next = new Set(efecto);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setEfecto(next);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PMV: Aspecto del juego */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Aspectos del juego{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ASPECTOS_JUEGO.map(({ id, label }) => {
              const isSelected = aspectosJuego.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    toggleSetValue(setAspectosJuego, aspectosJuego, id)
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PMV: Parámetro */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Parámetros{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PARAMETROS.map(({ id, label }) => {
              const isSelected = parametros.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSetValue(setParametros, parametros, id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  const workSection = (
    <section>
      <SectionHeader
        icon={Target}
        title="¿Qué se trabaja?"
        subtitle="Objetivos y descripción del ejercicio"
      />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="objectives"
            className="block text-sm font-semibold text-foreground"
          >
            Objetivo{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <input
            id="objectives"
            type="text"
            placeholder="Ej: Mejorar la consistencia del globo defensivo"
            {...register("objectives")}
            className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-foreground"
          >
            Descripción{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            id="description"
            placeholder="Contexto del ejercicio, situación táctica, cómo encaja en el entrenamiento…"
            rows={4}
            maxLength={2000}
            {...register("description")}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>
    </section>
  );

  const stepsSection = (
    <section>
      <SectionHeader
        icon={ListOrdered}
        title="Pasos de ejecución"
        subtitle="Guía paso a paso de cómo realizar el ejercicio"
      />
      <div className="space-y-3">
        {steps.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-6 text-center">
            <ListOrdered className="size-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Sin pasos definidos aún
            </p>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors"
            >
              <Plus className="size-4" /> Añadir primer paso
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="relative bg-muted/30 border border-border rounded-xl p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <span className="size-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0}
                          className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, 1)}
                          disabled={idx === steps.length - 1}
                          className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) =>
                          updateStep(step.id, "title", e.target.value)
                        }
                        placeholder={`Paso ${idx + 1}: Ej: Posición inicial`}
                        className="w-full h-9 px-3 text-sm font-medium bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
                      />
                      <textarea
                        value={step.description}
                        onChange={(e) =>
                          updateStep(step.id, "description", e.target.value)
                        }
                        placeholder="Descripción detallada del paso (opcional)…"
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="w-full flex items-center justify-center gap-2 h-9 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Plus className="size-4" /> Añadir paso
            </button>
          </>
        )}
      </div>
    </section>
  );

  const materialsSection = (
    <section>
      <SectionHeader
        icon={Package}
        title="Materiales y lugar"
        subtitle="Equipamiento necesario y dónde se practica"
      />
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Materiales necesarios{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <div
            className={cn(
              "min-h-[42px] flex flex-wrap gap-2 items-center px-3 py-2 bg-background border border-border rounded-xl transition-colors focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50",
              materials.length === 0 && "items-center"
            )}
          >
            {materials.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 bg-muted text-foreground text-xs font-medium px-2.5 py-1 rounded-lg"
              >
                {m}
                <button
                  type="button"
                  onClick={() => removeMaterial(m)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              ref={materialInputRef}
              type="text"
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              onKeyDown={handleMaterialKey}
              onBlur={() => {
                if (materialInput.trim()) addMaterial(materialInput);
              }}
              placeholder={
                materials.length === 0
                  ? "Escribe y pulsa Enter para añadir…"
                  : ""
              }
              className="flex-1 min-w-[140px] h-7 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MATERIALS.filter((m) => !materials.includes(m)).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => addMaterial(m)}
                className="text-xs text-muted-foreground border border-border/60 px-2 py-1 rounded-lg hover:bg-muted hover:text-foreground hover:border-border transition-colors"
              >
                + {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Lugar de práctica
          </label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {LOCATIONS.map(({ id, label, icon }) => {
                  const isSelected = field.value === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        field.onChange(field.value === id ? null : id)
                      }
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-xs font-medium leading-tight">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );

  const imageSection = (
    <section>
      <SectionHeader
        icon={ImageIcon}
        title="Imágenes del ejercicio"
        subtitle="Hasta 4 imágenes totales, en el orden y combinación que prefieras"
      />
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Galería flexible
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reparte las fotos como quieras entre portada, pasos,
                progresiones o variantes.
              </p>
            </div>
            <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {normalizedImages.length}/4 ocupadas
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {imageSlots.map((url, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-2xl border border-border/70 p-4",
                idx === 0 && "border-brand/20 bg-brand/[0.03]"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {idx === 0 ? "Imagen principal" : `Imagen ${idx + 1}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {idx === 0
                      ? "La portada que se usa para presentar el ejercicio."
                      : "Úsala para enseñar un paso, otra vista o una variante."}
                  </p>
                </div>
                {url ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Lista
                  </span>
                ) : null}
              </div>

              <MediaUploader
                value={url}
                onChange={(value) =>
                  setImageSlots((current) => {
                    const next = [...current];
                    next[idx] = value;
                    return next as Array<string | null>;
                  })
                }
                storagePath={`exercises/${exerciseId ?? "new"}/image-${idx}`}
                bucket="exercise-media"
                label={idx === 0 ? "Portada" : `Imagen ${idx + 1}`}
                searchSuggestion="deportes de raqueta entrenamiento"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const resourcesSection = (
    <section>
      <SectionHeader
        icon={Lightbulb}
        title="Recursos y consejos"
        subtitle="Vídeo de referencia y tips para el entrenador"
      />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="videoUrl"
            className="block text-sm font-semibold text-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Video className="size-3.5" /> Vídeo de referencia
            </span>
            <span className="font-normal text-muted-foreground ml-1">
              (opcional)
            </span>
          </label>
          <input
            id="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            {...register("videoUrl")}
            className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="tips"
            className="block text-sm font-semibold text-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="size-3.5" /> Tips para el entrenador
            </span>
            <span className="font-normal text-muted-foreground ml-1">
              (opcional)
            </span>
          </label>
          <textarea
            id="tips"
            placeholder="Puntos clave a observar, errores comunes, correcciones, progresiones…"
            rows={4}
            maxLength={1000}
            {...register("tips")}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="variantes"
            className="block text-sm font-semibold text-foreground"
          >
            Variantes{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            id="variantes"
            placeholder="Modificaciones del ejercicio, progresiones, adaptaciones para distintos niveles…"
            rows={3}
            maxLength={2000}
            {...register("variantes")}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>
    </section>
  );
  void stepsSection;
  void resourcesSection;

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
      {/* Mode selector */}
      <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-card p-3 shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Modo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {enableDrafts && mode === "create" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleSaveDraft()}
              disabled={saveStatus === "saving" || isSubmitting}
              className="h-8 rounded-full px-3 text-[11px] font-bold"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              GUARDAR BORRADOR
            </Button>
          )}
          {enableDrafts && mode === "create" && (
            <DraftStatusPill status={saveStatus} savedAt={savedAt} />
          )}
          <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-muted/30 p-1">
            <Button
              type="button"
              size="sm"
              variant={formMode === "quick" ? "default" : "ghost"}
              onClick={() => updateFormMode("quick")}
              className="h-8 rounded-full px-3 text-xs font-bold"
            >
              Rápido
            </Button>
            <Button
              type="button"
              size="sm"
              variant={formMode === "full" ? "default" : "ghost"}
              onClick={() => updateFormMode("full")}
              className="h-8 rounded-full px-3 text-xs font-bold"
            >
              Completo
            </Button>
          </div>
        </div>
      </div>

      {formMode === "quick" ? (
        <section className="space-y-6 rounded-lg border border-foreground/10 bg-card p-4 shadow-sm shadow-black/5 sm:p-5">
          <SectionHeader
            icon={Dumbbell}
            title="Información básica"
            subtitle="Solo lo imprescindible: nombre, categoría, nivel y rango"
          />
          {/* Nombre */}
          <div className="space-y-1.5">
            <label
              htmlFor="quick-name"
              className="block text-sm font-semibold text-foreground"
            >
              Nombre del ejercicio
            </label>
            <input
              id="quick-name"
              type="text"
              placeholder="Ej: Bandeja cruzada de revés"
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register("name")}
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Categoría
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map(({ id, label }) => {
                    const active = field.value === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => field.onChange(id)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          active
                            ? "bg-brand/10 border-brand text-brand"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.category ? (
              <p className="text-xs text-destructive">
                {errors.category.message as string}
              </p>
            ) : null}
          </div>

          {nivelesField}

          {durationRangeField}

          <p className="text-xs text-muted-foreground italic">
            ¿Necesitas más detalle? Cambia a{" "}
            <button
              type="button"
              onClick={() => updateFormMode("full")}
              className="font-semibold text-brand hover:underline"
            >
              modo Completo
            </button>{" "}
            cuando quieras.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          <AccordionSection
            title="Esencial"
            subtitle="Lo mínimo para guardar un ejercicio usable."
            filled={essentialFilled}
            total={essentialTotal}
            open={expandedSections.essential}
            onToggle={(next) => toggleAccordion("essential", next)}
          >
            {basicSection}
          </AccordionSection>

          <AccordionSection
            title="Descripción y objetivos"
            subtitle="Qué se trabaja en este ejercicio y qué se busca."
            filled={pedagogicalFilled}
            total={6}
            open={expandedSections.pedagogical}
            onToggle={(next) => toggleAccordion("pedagogical", next)}
          >
            <div className="flex flex-col gap-8">{workSection}</div>
          </AccordionSection>

          <AccordionSection
            title="Aspectos del juego"
            subtitle="Formato, jugadores, pelota, tipo de actividad, golpes, efecto y parámetros."
            filled={paramsFilled}
            total={8}
            open={expandedSections.params}
            onToggle={(next) => toggleAccordion("params", next)}
          >
            {parametersSection}
          </AccordionSection>

          <AccordionSection
            title="Material y media"
            subtitle="Lugar, materiales y una galería flexible de hasta 4 imágenes."
            filled={mediaFilled}
            total={4}
            open={expandedSections.media}
            onToggle={(next) => toggleAccordion("media", next)}
          >
            <div className="flex flex-col gap-8">
              {materialsSection}
              {imageSection}
            </div>
          </AccordionSection>
        </div>
      )}

      {serverError ? (
        <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
          <p className="text-sm font-medium text-destructive">{serverError}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-6 py-2.5 text-sm font-bold text-[#050505] transition-colors hover:bg-[#c8f52e] disabled:opacity-55"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Crear ejercicio" : "Guardar cambios"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
        ) : (
          <Link
            href="/exercises"
            className="rounded-full px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
