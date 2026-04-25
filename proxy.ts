import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/s/",
  "/privacidad",
  "/aviso-legal",
  "/cookies",
  "/terminos",
  "/api/cron/",
];
const PUBLIC_EXACT = new Set(["/"]);
const RECOVERABLE_REFRESH_TOKEN_ERRORS = new Set([
  "refresh_token_already_used",
  "refresh_token_not_found",
  "invalid_refresh_token",
]);

function isRecoverableAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as {
    code?: string;
    name?: string;
    status?: number;
    message?: string;
  };

  if (maybeError.name === "AuthSessionMissingError") return true;

  if (
    typeof maybeError.code === "string" &&
    RECOVERABLE_REFRESH_TOKEN_ERRORS.has(maybeError.code)
  ) {
    return true;
  }

  const message =
    typeof maybeError.message === "string"
      ? maybeError.message.toLowerCase()
      : "";

  if (message.includes("auth session missing")) return true;

  return maybeError.status === 400 && message.includes("refresh token");
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
) {
  const authCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"));

  authCookieNames.forEach((name) => {
    request.cookies.delete(name);
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  });
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CSRF hardening: for state-changing API requests, require same-origin Origin/Referer.
  const method = request.method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (isMutation && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    const expected = host ? `${request.nextUrl.protocol}//${host}` : null;
    const sourceOk =
      (origin && expected && origin === expected) ||
      (referer && expected && referer.startsWith(expected));
    if (!sourceOk) {
      return NextResponse.json(
        { error: "Cross-origin request blocked" },
        { status: 403 }
      );
    }
  }

  const authHeader = request.headers.get("authorization");
  const hasBearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  const isExercisesReadApi =
    request.method === "GET" && pathname.startsWith("/api/exercises");
  const isProfileBootstrapApi =
    pathname === "/api/users" && request.method === "POST" && hasBearerToken;
  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p)) ||
    isExercisesReadApi ||
    isProfileBootstrapApi;
  const isApiRoute = pathname.startsWith("/api/");
  const shouldCheckUser = !isPublic || pathname === "/login" || pathname === "/register";

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  if (shouldCheckUser) {
    try {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      user = currentUser;
    } catch (error) {
      if (isRecoverableAuthError(error)) {
        clearSupabaseAuthCookies(request, supabaseResponse);
      } else {
        console.error("Unexpected Supabase auth error in proxy", error);
      }
    }
  }

  if (!user && !isPublic) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
