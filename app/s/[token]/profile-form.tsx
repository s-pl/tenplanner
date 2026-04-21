"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitStudentProfile } from "./actions";

type Props = {
  token: string;
  initialName: string;
};

export function ProfileForm({ token, initialName }: Props) {
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [dominantHand, setDominantHand] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitStudentProfile(token, {
        gender: gender || null,
        birthDate: birthDate || null,
        dominantHand: dominantHand || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        yearsExperience: yearsExperience !== "" ? Number(yearsExperience) : null,
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
        <p className="text-lg font-semibold text-foreground">¡Perfecto, {initialName}!</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu entrenador ya puede ver tu información actualizada. Puedes cerrar esta página.
        </p>
      </div>
    );
  }

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>Género</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
          <option value="">Sin especificar</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Fecha de nacimiento</label>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Mano dominante</label>
        <select value={dominantHand} onChange={(e) => setDominantHand(e.target.value)} className={inputCls}>
          <option value="">Sin especificar</option>
          <option value="right">Diestro/a</option>
          <option value="left">Zurdo/a</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Altura (cm)</label>
          <input
            type="number" min={100} max={250} placeholder="175"
            value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Peso (kg)</label>
          <input
            type="number" min={30} max={200} placeholder="70"
            value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Años de experiencia en pádel</label>
        <input
          type="number" min={0} max={50} placeholder="3"
          value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)}
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar mis datos
      </button>
    </form>
  );
}
