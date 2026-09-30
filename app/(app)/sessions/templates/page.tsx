import { redirect } from "next/navigation";

// Las plantillas de sesión se sustituyeron por listas de sesiones favoritas.
export default function SessionTemplatesPage() {
  redirect("/sessions/favorites");
}
