import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad de TenPlanner: qué datos tratamos, para qué, con qué base legal y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "23 de abril de 2026";

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[#050505]/12 bg-white/70 px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-[#D6FF38] hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]"
        >
          ← Volver al inicio
        </Link>

        <header className="mt-8 overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
          <div className="p-6 sm:p-8">
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
              TenPlanner legal
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-none sm:text-5xl">
              Política de Privacidad
            </h1>
            <p className="mt-4 text-sm text-white/62">
              Última actualización: {lastUpdated}
            </p>
          </div>
          <div className="h-2 bg-[#D6FF38]" />
        </header>

        <div className="mt-8 rounded-lg border border-[#050505]/10 bg-white/70 p-5 text-[15px] leading-relaxed shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <section>
            <h2 className="font-heading text-xl font-semibold">
              1. Responsable del tratamiento
            </h2>
            <p>
              TenPlanner (en adelante, &quot;nosotros&quot;) es el responsable
              del tratamiento de los datos personales de los entrenadores que
              usan la plataforma. El entrenador es el responsable de los datos
              personales de sus alumnos, y TenPlanner actúa como{" "}
              <strong>encargado del tratamiento</strong>.
            </p>
            <p>
              Contacto para protección de datos:{" "}
              <a href="mailto:privacy@tenplanner.app" className="underline">
                privacy@tenplanner.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              2. Qué datos tratamos y para qué
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Cuenta de entrenador:</strong> nombre, email, imagen de
                perfil, rol, nivel, experiencia, ciudad, objetivos. Base legal:
                ejecución del contrato (art. 6.1.b RGPD).
              </li>
              <li>
                <strong>Alumnos:</strong> nombre, email opcional, género, fecha
                de nacimiento, altura, peso, mano dominante, nivel, notas.
                Tratados por el entrenador, con TenPlanner como encargado. Base
                legal: ejecución del contrato (entrenador–alumno).
              </li>
              <li>
                <strong>Sesiones y ejercicios:</strong> contenido que el
                entrenador crea. Base legal: ejecución del contrato.
              </li>
              <li>
                <strong>Chat Dr. Planner:</strong> mensajes enviados al
                asistente de IA. Se procesan por Anthropic PBC para responder.
                Base legal: ejecución del contrato + interés legítimo en mejorar
                el servicio.
              </li>
              <li>
                <strong>Datos técnicos:</strong> IP y cookies técnicas de
                sesión. Base legal: interés legítimo en seguridad.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              3. Encargados y terceros
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Supabase (EE.UU./UE):</strong> autenticación y base de
                datos. DPA + SCC.
              </li>
              <li>
                <strong>Anthropic (EE.UU.):</strong> procesado del chat Dr.
                Planner. DPA + SCC. Configurado con retención mínima cuando
                proceda.
              </li>
              <li>
                <strong>Vercel (EE.UU./UE):</strong> hosting y logs. DPA + SCC.
              </li>
              <li>
                <strong>Pexels:</strong> búsqueda de imágenes stock (no enviamos
                datos personales).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              4. Conservación
            </h2>
            <p>
              Conservamos los datos mientras tu cuenta esté activa. Puedes
              solicitar el borrado en cualquier momento desde tu perfil. Tras la
              eliminación, los datos quedan suprimidos en un plazo máximo de 30
              días, salvo obligación legal de conservación.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              5. Tus derechos
            </h2>
            <p>
              Tienes derecho a: acceso, rectificación, supresión, oposición,
              limitación, portabilidad y a no ser objeto de decisiones
              automatizadas. Puedes ejercerlos desde tu perfil (exportar y
              borrar cuenta) o escribiendo a{" "}
              <a href="mailto:privacy@tenplanner.app" className="underline">
                privacy@tenplanner.app
              </a>
              . Si consideras que no hemos atendido correctamente tus derechos,
              puedes reclamar ante la Agencia Española de Protección de Datos (
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                aepd.es
              </a>
              ).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              6. Menores de edad
            </h2>
            <p>
              Si el alumno es menor de 14 años, el entrenador se compromete a
              obtener consentimiento parental antes de introducir sus datos.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              7. Cambios en esta política
            </h2>
            <p>
              Publicaremos cualquier cambio material en esta página. La fecha de
              última actualización se muestra al inicio.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
