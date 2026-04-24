import type { Metadata } from "next";
import { legal } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Aviso Legal · TenPlanner",
  description:
    "Información legal del prestador de servicios conforme a la Ley 34/2002 (LSSI-CE).",
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

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed text-foreground/80 my-3">
      {children}
    </p>
  );
}

export default function AvisoLegalPage() {
  return (
    <article>
      <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-brand mb-2">
        02 · Aviso legal
      </p>
      <h1 className="font-heading text-4xl lg:text-5xl text-foreground leading-[0.95] tracking-tight">
        Información del prestador
      </h1>
      <p className="text-[14px] text-foreground/60 mt-4">
        Conforme al art. 10 de la Ley 34/2002, de 11 de julio, de servicios de
        la sociedad de la información y de comercio electrónico (LSSI-CE).
      </p>

      <H2 id="titular">1. Titular</H2>
      <div className="border border-foreground/15 rounded-md px-4 py-3 my-4 text-[13px] text-foreground/80 space-y-1">
        <p><strong>Denominación:</strong> {legal.companyName}</p>
        <p><strong>NIF / CIF:</strong> {legal.nif}</p>
        <p><strong>Domicilio:</strong> {legal.address}</p>
        <p><strong>Correo electrónico:</strong> <a href={`mailto:${legal.contactEmail}`} className="underline underline-offset-4 decoration-foreground/30 hover:text-foreground">{legal.contactEmail}</a></p>
        {legal.mercantileRegistry && (
          <p><strong>Registro Mercantil:</strong> {legal.mercantileRegistry}</p>
        )}
      </div>

      <H2 id="objeto">2. Objeto</H2>
      <P>
        El presente aviso legal regula el uso del sitio web accesible en el
        dominio donde se aloja TenPlanner. El acceso y uso del sitio atribuye
        la condición de usuario e implica la aceptación de las condiciones
        aquí publicadas.
      </P>

      <H2 id="propiedad">3. Propiedad intelectual e industrial</H2>
      <P>
        Todos los contenidos (textos, imágenes, código, marca, logotipos y
        diseños) son propiedad del titular o cuentan con licencia de sus
        legítimos propietarios. Queda prohibida su reproducción, distribución o
        transformación sin autorización previa.
      </P>

      <H2 id="responsabilidad">4. Exclusión de responsabilidad</H2>
      <P>
        El titular no se responsabiliza de los daños o perjuicios derivados de:
        interrupciones del servicio por causas técnicas ajenas, el uso
        incorrecto de la plataforma por parte del usuario, o la veracidad de
        los datos introducidos por el entrenador respecto a sus alumnos.
      </P>

      <H2 id="enlaces">5. Enlaces a terceros</H2>
      <P>
        El sitio puede incluir enlaces a webs externas cuyo contenido no está
        bajo nuestro control. No asumimos responsabilidad sobre su contenido,
        políticas ni disponibilidad.
      </P>

      <H2 id="legislacion">6. Legislación aplicable y jurisdicción</H2>
      <P>
        Este aviso se rige por la legislación española. Para cualquier
        controversia, las partes se someten a los juzgados y tribunales del
        domicilio del titular, salvo que la ley imperativa disponga otro fuero.
      </P>
    </article>
  );
}
