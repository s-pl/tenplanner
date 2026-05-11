"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { submitStudentProfile } from "./actions";

const MIN_AGE = 14;
const CONSENT_VERSION = "1.0";

type Props = {
  token: string;
  initialName: string;
  coachName?: string | null;
};

function computeAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1;
  return age;
}

export function ProfileForm({ token, initialName, coachName }: Props) {
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [dominantHand, setDominantHand] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [consent, setConsent] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const age = useMemo(() => computeAge(birthDate), [birthDate]);
  const ageTooLow = age !== null && age < MIN_AGE;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Debes aceptar que tu entrenador trate tus datos.");
      return;
    }
    setError("");

    if (!birthDate) {
      setError("Necesitamos tu fecha de nacimiento para continuar.");
      return;
    }
    if (ageTooLow) {
      setError(
        `Esta aplicación requiere al menos ${MIN_AGE} años. Pide a un adulto responsable que contacte con tu entrenador.`
      );
      return;
    }
    if (!consent) {
      setError("Debes aceptar el tratamiento de tus datos para continuar.");
      return;
    }

    startTransition(async () => {
      const res = await submitStudentProfile(token, {
        gender: gender || null,
        birthDate,
        dominantHand: dominantHand || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        yearsExperience:
          yearsExperience !== "" ? Number(yearsExperience) : null,
        consent: true,
        consentVersion: CONSENT_VERSION,
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[28px] border border-brand/35 bg-brand/10 px-5 py-8 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
          <CheckCircle2 className="size-7" />
        </div>
        <p className="text-xl font-black text-foreground">
          ¡Perfecto, {initialName}!
        </p>
        <p className="max-w-xs text-sm leading-6 text-foreground/62">
          Tu entrenador ya puede ver tu información actualizada. Puedes cerrar
          esta página.
        </p>
      </div>
    );
  }

  const inputCls =
    "tp-field h-11 w-full px-4 text-sm font-medium placeholder:text-muted-foreground";
  const labelCls =
    "mb-1.5 block text-xs font-black uppercase text-foreground/52";

  const submitDisabled = isPending || !birthDate || ageTooLow || !consent;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label className={labelCls}>Género</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={inputCls}
        >
          <option value="">Sin especificar</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>
          Fecha de nacimiento <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          className={inputCls}
          aria-describedby="birth-help"
        />
        {ageTooLow && (
          <p id="birth-help" className="mt-1.5 text-[12px] text-destructive">
            Esta aplicación requiere al menos {MIN_AGE} años. Pide a un adulto
            responsable que contacte con tu entrenador.
          </p>
        )}
      </div>

      <div>
        <label className={labelCls}>Mano dominante</label>
        <select
          value={dominantHand}
          onChange={(e) => setDominantHand(e.target.value)}
          className={inputCls}
        >
          <option value="">Sin especificar</option>
          <option value="right">Diestro/a</option>
          <option value="left">Zurdo/a</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Altura (cm)</label>
          <input
            type="number"
            min={100}
            max={250}
            placeholder="175"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Peso (kg)</label>
          <input
            type="number"
            min={30}
            max={200}
            placeholder="70"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Años de experiencia en deportes de raqueta</label>
        <input
          type="number"
          min={0}
          max={50}
          placeholder="3"
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#050505]/10 bg-[#F4F4F1] dark:border-white/10 dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={infoOpen}
        >
          <span className="flex items-center gap-2 text-[12px] font-black text-foreground">
            <ShieldCheck className="size-4 text-brand" />
            Información sobre el tratamiento de tus datos
          </span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${infoOpen ? "rotate-180" : ""}`}
          />
        </button>
        {infoOpen && (
          <div className="space-y-2 border-t border-[#050505]/10 px-4 pb-4 pt-3 text-[12px] leading-relaxed text-foreground/62 dark:border-white/10">
            <p>
              <strong className="text-foreground">Responsable:</strong>{" "}
              {coachName ? `${coachName} (tu entrenador/a)` : "Tu entrenador/a"}
              , con TenPlanner como encargado del tratamiento (art. 28 RGPD).
            </p>
            <p>
              <strong className="text-foreground">Datos que recogemos:</strong>{" "}
              fecha de nacimiento, género, altura, peso, mano dominante y años
              de experiencia, junto con el nombre que ya te registró tu
              entrenador.
            </p>
            <p>
              <strong className="text-foreground">Finalidad:</strong>{" "}
              personalizar tu entrenamiento de deportes de raqueta.
            </p>
            <p>
              <strong className="text-foreground">Base jurídica:</strong> tu
              consentimiento (art. 6.1.a y 9.2.a RGPD).
            </p>
            <p>
              <strong className="text-foreground">Conservación:</strong>{" "}
              mientras tu entrenador mantenga tu ficha activa. Puedes pedir la
              supresión en cualquier momento.
            </p>
            <p>
              <strong className="text-foreground">Destinatarios:</strong>{" "}
              Supabase (base de datos, UE/US con SCC), Vercel (hosting, US con
              SCC), Anthropic (asistente IA, US con SCC — solo si tu entrenador
              lo usa sobre tu ficha).
            </p>
            <p>
              <strong className="text-foreground">Tus derechos:</strong> acceso,
              rectificación, supresión, portabilidad, oposición, limitación y
              reclamación ante la AEPD (
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                aepd.es
              </a>
              ).
            </p>
            <p className="pt-1">
              Más detalle en la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="underline hover:text-foreground"
              >
                política de privacidad
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-[#050505]/10 bg-white px-4 py-3 text-[12px] leading-relaxed text-foreground dark:border-white/10 dark:bg-white/[0.04]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-brand"
          required
        />
        <span>
          He leído la información anterior y consiento que{" "}
          {coachName ? coachName : "mi entrenador/a"} y TenPlanner traten mis
          datos con la finalidad descrita.{" "}
          <span className="text-destructive">*</span>
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar mis datos
      </button>

      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        Al enviar aceptas la{" "}
        <Link href="/privacidad" target="_blank" className="underline">
          política de privacidad
        </Link>{" "}
        y los{" "}
        <Link href="/terminos" target="_blank" className="underline">
          términos
        </Link>
        .
      </p>
    </form>
  );
}
