const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const ALLOWED_IMAGE_HOSTS = new Set([
  "images.pexels.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

function parseHttpUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!SAFE_HTTP_PROTOCOLS.has(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^127\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export function isPublicHttpUrl(value: string) {
  const url = parseHttpUrl(value);
  return !!url && !isPrivateHostname(url.hostname);
}

export function isAllowedImageUrl(value: string) {
  const url = parseHttpUrl(value);
  if (!url || isPrivateHostname(url.hostname)) return false;

  const host = url.hostname.toLowerCase();
  return host.endsWith(".supabase.co") || ALLOWED_IMAGE_HOSTS.has(host);
}
