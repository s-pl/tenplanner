"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

const MIN_AGE = 14;

export type ProfileFormData = {
  gender: string | null;
  birthDate: string | null;
  dominantHand: string | null;
  heightCm: number | null;
  weightKg: number | null;
  yearsExperience: number | null;
  consent: boolean;
  consentVersion: string;
};

function ageFromBirthDate(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1;
  return age;
}

export async function submitStudentProfile(
  token: string,
  data: ProfileFormData
) {
  const now = new Date();

  const [student] = await db
    .select({
      id: students.id,
      profileTokenExpiresAt: students.profileTokenExpiresAt,
    })
    .from(students)
    .where(eq(students.profileToken, token))
    .limit(1);

  if (!student)
    return { ok: false as const, error: "Enlace inválido o expirado." };
  if (!student.profileTokenExpiresAt || student.profileTokenExpiresAt < now) {
    return {
      ok: false as const,
      error: "Este enlace ha caducado. Pide uno nuevo a tu entrenador.",
    };
  }

  if (!data.consent) {
    return {
      ok: false as const,
      error: "Debes aceptar el tratamiento de tus datos para continuar.",
    };
  }

  if (!data.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) {
    return {
      ok: false as const,
      error: "Introduce una fecha de nacimiento válida.",
    };
  }

  const age = ageFromBirthDate(data.birthDate);
  if (age === null || age < MIN_AGE) {
    return {
      ok: false as const,
      error: `Esta aplicación requiere al menos ${MIN_AGE} años.`,
    };
  }

  const gender = ["male", "female", "other"].includes(data.gender ?? "")
    ? data.gender
    : null;
  const dominantHand = ["left", "right"].includes(data.dominantHand ?? "")
    ? data.dominantHand
    : null;
  const heightCm =
    data.heightCm && data.heightCm > 0 && data.heightCm < 300
      ? data.heightCm
      : null;
  const weightKg =
    data.weightKg && data.weightKg > 0 && data.weightKg < 500
      ? data.weightKg
      : null;
  const yearsExperience =
    data.yearsExperience != null && data.yearsExperience >= 0
      ? data.yearsExperience
      : null;

  const consentVersion =
    typeof data.consentVersion === "string" && data.consentVersion.length <= 20
      ? data.consentVersion
      : "1.0";

  await db
    .update(students)
    .set({
      gender,
      birthDate: data.birthDate,
      dominantHand,
      heightCm,
      weightKg,
      yearsExperience,
      consentGivenAt: now,
      consentVersion,
    })
    .where(eq(students.profileToken, token));

  return { ok: true as const };
}
