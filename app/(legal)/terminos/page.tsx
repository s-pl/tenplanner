import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones · TenPlanner",
  description: "Condiciones de uso y contrato de encargo del tratamiento.",
};

function H2({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="font-heading text-2xl lg:text-3xl italic text-foreground mt-12 mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-[11px] uppercase tracking-[0.22em] text-foreground/60 mt-6 mb-3">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed text-foreground/80 my-3">
      {children}
    </p>
  );
}

const UPDATED = "23 de abril de 2026";
const VERSION = "1.0";

export default function TerminosPage() {
  return (
    <article>
      <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-brand mb-2">
        04 · Términos y condiciones
      </p>
      <h1 className="font-heading text-4xl lg:text-5xl text-foreground leading-[0.95] tracking-tight">
        Condiciones de uso
      </h1>
      <p className="text-[14px] text-foreground/60 mt-4">
        Versión {VERSION} · Última actualización: {UPDATED}
      </p>

      <H2 id="objeto">1. Objeto</H2>
      <P>
        TenPlanner es una plataforma SaaS para entrenadores de pádel que
        permite planificar sesiones, gestionar una biblioteca de ejercicios,
        registrar alumnos y usar un asistente de IA (Dr. Planner). Al crear
        una cuenta aceptas estos términos.
      </P>

      <H2 id="cuenta">2. Cuenta y uso</H2>
      <P>
        Debes tener al menos 14 años y capacidad legal para contratar. Eres
        responsable de la veracidad de los datos introducidos y de la
        confidencialidad de tus credenciales.
      </P>
      <P>
        Queda prohibido: usar la plataforma para fines ilícitos, intentar
        acceder a datos de otros usuarios, realizar ingeniería inversa del
        software, o introducir datos de terceros sin base legítima para
        hacerlo.
      </P>

      <H2 id="encargo">3. Encargo del tratamiento (art. 28 RGPD)</H2>
      <P>
        Cuando el entrenador registra datos de sus alumnos en la plataforma
        actúa como <strong>Responsable del Tratamiento</strong> y TenPlanner
        como <strong>Encargado del Tratamiento</strong>. Este apartado tiene
        valor contractual a efectos del art. 28 RGPD.
      </P>

      <H3>3.1. Objeto del encargo</H3>
      <P>
        Alojar y procesar los datos de los alumnos que el entrenador introduce
        o recoge vía enlace público /s/[token], con la finalidad de gestionar
        las sesiones de entrenamiento.
      </P>

      <H3>3.2. Duración</H3>
      <P>
        Mientras el entrenador mantenga cuenta activa, o hasta que solicite la
        supresión de los datos del alumno.
      </P>

      <H3>3.3. Obligaciones del encargado (TenPlanner)</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-foreground/80 my-3">
        <li>
          Tratar los datos personales únicamente siguiendo las instrucciones
          documentadas del responsable.
        </li>
        <li>
          Garantizar la confidencialidad del personal con acceso a los datos.
        </li>
        <li>
          Adoptar medidas técnicas y organizativas apropiadas (art. 32 RGPD),
          incluidas en nuestra{" "}
          <a
            href="/privacidad#seguridad"
            className="underline underline-offset-4 decoration-foreground/30 hover:text-foreground"
          >
            política de privacidad
          </a>
          .
        </li>
        <li>
          Informar al responsable antes de contratar nuevos subencargados; la
          lista vigente está en la{" "}
          <a
            href="/privacidad#encargados"
            className="underline underline-offset-4 decoration-foreground/30 hover:text-foreground"
          >
            política de privacidad
          </a>
          .
        </li>
        <li>
          Asistir al responsable para atender derechos de los interesados y las
          obligaciones de los arts. 32-36 RGPD.
        </li>
        <li>
          Notificar sin dilación indebida cualquier brecha de seguridad que
          afecte a datos tratados por cuenta del responsable.
        </li>
        <li>
          Al finalizar la prestación, devolver o suprimir los datos a elección
          del responsable, salvo obligación legal de conservación.
        </li>
      </ul>

      <H3>3.4. Obligaciones del responsable (entrenador)</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-foreground/80 my-3">
        <li>
          Contar con base jurídica para introducir datos de alumnos
          (consentimiento, contrato u otro supuesto del art. 6 RGPD).
        </li>
        <li>
          Informar al alumno conforme a los arts. 13-14 RGPD — el enlace
          público /s/[token] ya incluye la información requerida por parte de
          TenPlanner, pero el entrenador debe entregar la suya propia si trata
          los datos también en sistemas externos.
        </li>
        <li>
          No introducir categorías especiales de datos (salud, ideología,
          etc.) sin consentimiento explícito ni otra base del art. 9 RGPD.
        </li>
        <li>Mantener actualizados los datos que registre.</li>
      </ul>

      <H2 id="ia">4. Uso del asistente Dr. Planner</H2>
      <P>
        Dr. Planner usa modelos de lenguaje de Anthropic (Claude). El contenido
        que escribas en el chat se envía al proveedor para generar respuestas.
        No introduzcas datos que permitan identificar a un alumno concreto si
        puedes evitarlo; usa iniciales o apodos.
      </P>
      <P>
        Las respuestas de Dr. Planner son sugerencias: el entrenador mantiene
        siempre el criterio final sobre la sesión. TenPlanner no se
        responsabiliza de lesiones u otros perjuicios derivados de aplicar una
        sugerencia sin el juicio profesional del entrenador.
      </P>

      <H2 id="disponibilidad">5. Disponibilidad y cambios</H2>
      <P>
        Ofrecemos el servicio en modo &ldquo;tal cual&rdquo;, sin garantía de
        disponibilidad 24/7. Podemos actualizar funcionalidades, precios o
        estos términos; los cambios sustanciales se notificarán con al menos
        15 días de antelación.
      </P>

      <H2 id="baja">6. Baja y supresión</H2>
      <P>
        Puedes eliminar tu cuenta en cualquier momento desde Perfil → Datos →
        Eliminar cuenta. El borrado es irreversible y elimina sesiones,
        ejercicios propios, alumnos, conversaciones con Dr. Planner y tu
        cuenta de autenticación.
      </P>

      <H2 id="ley">7. Legislación y jurisdicción</H2>
      <P>
        Estos términos se rigen por la legislación española. Para cualquier
        controversia, las partes se someten a los juzgados del domicilio del
        titular. Si eres consumidor, se respeta tu fuero propio cuando sea de
        aplicación.
      </P>
    </article>
  );
}
