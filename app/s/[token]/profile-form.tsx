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
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-brand" />
        <p className="text-lg font-semibold text-foreground">
          ¡Perfecto, {initialName}!
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu entrenador ya puede ver tu información actualizada. Puedes cerrar
          esta página.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30";
  const labelCls =
    "block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5";

  const submitDisabled =
    isPending || !birthDate || ageTooLow || !consent;

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
          <p id="birth-help" className="text-[12px] text-destructive mt-1.5">
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
        <label className={labelCls}>Años de experiencia en pádel</label>
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

      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left"
          aria-expanded={infoOpen}
        >
          <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
            <ShieldCheck className="size-3.5 text-brand" />
            Información sobre el tratamiento de tus datos
          </span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${infoOpen ? "rotate-180" : ""}`}
          />
        </button>
        {infoOpen && (
          <div className="px-3.5 pb-3.5 text-[12px] leading-relaxed text-muted-foreground space-y-2 border-t border-border/60">
            <p>
              <strong className="text-foreground">Responsable:</strong>{" "}
              {coachName
                ? `${coachName} (tu entrenador/a)`
                : "Tu entrenador/a"}
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
              personalizar tu entrenamiento de pádel.
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
              <strong className="text-foreground">Tus derechos:</strong>{" "}
              acceso, rectificación, supresión, portabilidad, oposición,
              limitación y reclamación ante la AEPD (
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

      <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 accent-brand shrink-0"
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
        className="w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar mis datos
      </button>

      <p className="text-[11px] text-muted-foreground text-center">
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
