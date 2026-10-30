import { describe, expect, it } from "vitest";
import {
  distanceToShape,
  drawingDataUrl,
  isDrawingUrl,
  parseBoardDoc,
  type Shape,
} from "@/lib/court-board";

describe("pizarra de pista", () => {
  it("reconoce los dibujos por su carpeta y extensión", () => {
    expect(isDrawingUrl("https://x.co/resources/u1/drawings/123.png")).toBe(
      true
    );
    expect(isDrawingUrl("https://x.co/resources/u1/img-123.png")).toBe(false);
    expect(isDrawingUrl(null)).toBe(false);
  });

  it("deduce la URL de los datos editables", () => {
    expect(drawingDataUrl("https://x.co/u1/drawings/123.png")).toBe(
      "https://x.co/u1/drawings/123.json"
    );
  });

  it("valida los datos cargados", () => {
    expect(parseBoardDoc(null)).toBeNull();
    expect(parseBoardDoc({ shapes: "no" })).toBeNull();
    expect(parseBoardDoc({ court: "half", shapes: [] })?.court).toBe("half");
    expect(parseBoardDoc({ shapes: [] })?.court).toBe("full");
  });

  it("mide la distancia a una flecha y a un punto", () => {
    const arrow: Shape = {
      t: "arrow",
      a: [0, 0],
      b: [100, 0],
      dashed: false,
    };
    expect(distanceToShape([50, 10], arrow)).toBe(10);
    expect(distanceToShape([130, 0], arrow)).toBe(30);
    expect(distanceToShape([3, 4], { t: "cone", at: [0, 0] })).toBe(5);
  });
});
