"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

export type ProfileFormData = {
  gender: string | null;
  birthDate: string | null;
  dominantHand: string | null;
  heightCm: number | null;
  weightKg: number | null;
  yearsExperience: number | null;
};

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
  const birthDate =
    data.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)
      ? data.birthDate
      : null;

  await db
    .update(students)
    .set({
      gender,
      birthDate,
      dominantHand,
      heightCm,
      weightKg,
      yearsExperience,
    })
    .where(eq(students.profileToken, token));

  return { ok: true as const };
}
