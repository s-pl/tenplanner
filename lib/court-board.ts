/**
 * Pizarra de pista: modelo de datos y geometría compartidos.
 *
 * Un dibujo se guarda en el bucket "resources" como dos archivos con el mismo
 * nombre: la imagen (PNG, la que se ve en recursos y fichas) y los datos
 * editables (JSON), para poder retocarlo después. Se reconoce un dibujo por
 * la carpeta `drawings/` en la URL de la imagen.
 */

export type Pt = [number, number];

export type Shape =
  | { t: "arrow"; a: Pt; b: Pt; dashed: boolean }
  | { t: "free"; pts: Pt[] }
  | { t: "alumno"; at: Pt; n: number }
  | { t: "monitor"; at: Pt }
  | { t: "cone"; at: Pt }
  | { t: "ball"; at: Pt }
  | { t: "text"; at: Pt; text: string };

export type CourtMode = "full" | "half";

export interface BoardDoc {
  v: 1;
  sport: "tenis";
  court: CourtMode;
  shapes: Shape[];
}

export const DRAWINGS_FOLDER = "drawings";

export function isDrawingUrl(url: string | null | undefined): url is string {
  return !!url && url.includes(`/${DRAWINGS_FOLDER}/`) && url.endsWith(".png");
}

/** URL del JSON editable que acompaña a la imagen de un dibujo. */
export function drawingDataUrl(imageUrl: string): string {
  return imageUrl.replace(/\.png$/, ".json");
}

// ── Geometría de la pista de tenis (dobles, 10,97 × 23,77 m, ≈29,2 u/m) ──

export const COURT_VIEWBOX: Record<
  CourtMode,
  { x: number; y: number; w: number; h: number }
> = {
  full: { x: 0, y: 0, w: 400, h: 800 },
  half: { x: 0, y: 372, w: 400, h: 428 },
};

export const COURT = {
  left: 40,
  right: 360,
  top: 53,
  bottom: 747,
  net: 400,
  singlesLeft: 80,
  singlesRight: 320,
  serviceTop: 213,
  serviceBottom: 587,
  center: 200,
} as const;

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distance(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}

/** Distancia de un punto a una figura, para elegir cuál borrar. */
export function distanceToShape(p: Pt, s: Shape): number {
  switch (s.t) {
    case "arrow":
      return distToSegment(p, s.a, s.b);
    case "free": {
      let best = Infinity;
      for (let i = 0; i < s.pts.length; i++) {
        const d =
          i === 0
            ? distance(p, s.pts[0])
            : distToSegment(p, s.pts[i - 1], s.pts[i]);
        if (d < best) best = d;
      }
      return best;
    }
    default:
      return distance(p, s.at);
  }
}

/** Puntos de la cabeza de una flecha en el extremo `b`. */
export function arrowHead(a: Pt, b: Pt, size = 14): string {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const spread = Math.PI / 7;
  const p1: Pt = [
    b[0] - size * Math.cos(angle - spread),
    b[1] - size * Math.sin(angle - spread),
  ];
  const p2: Pt = [
    b[0] - size * Math.cos(angle + spread),
    b[1] - size * Math.sin(angle + spread),
  ];
  return `${b[0]},${b[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`;
}

/** Valida un JSON cargado de almacenamiento; devuelve null si no sirve. */
export function parseBoardDoc(raw: unknown): BoardDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<BoardDoc>;
  if (!Array.isArray(d.shapes)) return null;
  return {
    v: 1,
    sport: "tenis",
    court: d.court === "half" ? "half" : "full",
    shapes: d.shapes as Shape[],
  };
}
