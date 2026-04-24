import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

function safeNext(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;
  // Must be a same-origin relative path: starts with "/" but not "//" or "/\"
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (!user.email) {
          return NextResponse.redirect(`${origin}/login?error=missing_email`);
        }
        try {
          await db
            .insert(users)
            .values({
              id: user.id,
              name: user.user_metadata.full_name ?? user.email ?? "User",
              email: user.email,
              image: user.user_metadata.avatar_url ?? null,
            })
            .onConflictDoNothing();
        } catch (error) {
          // DB error shouldn't trap the user — session is already set
          console.error("Error syncing user profile during auth callback", {
            userId: user.id,
            error,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
