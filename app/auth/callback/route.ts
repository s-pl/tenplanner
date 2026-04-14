import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (!user.email) {
          return NextResponse.redirect(
            `${origin}/login?error=missing_email`,
          );
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
        } catch {
          // DB error shouldn't trap the user — session is already set
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
