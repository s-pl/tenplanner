/** Máximo de clases por PDF (debe coincidir con /api/classes/pdf). */
export const MAX_CLASSES_PER_PDF = 60;

/**
 * Descarga en el navegador un único PDF con las clases indicadas, en el
 * orden recibido. `title` (opcional) da nombre al documento. Lanza un error si la generación falla.
 */
export async function downloadClassesPdf(
  ids: string[],
  title?: string
): Promise<void> {
  if (ids.length === 0) return;
  const params = new URLSearchParams({ ids: ids.join(",") });
  if (title) params.set("title", title);
  const res = await fetch(`/api/classes/pdf?${params.toString()}`);
  if (!res.ok) throw new Error("Error generando el PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ??
    "clases.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
