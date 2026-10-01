import {
  Circle,
  Line,
  Polygon,
  Polyline,
  Rect,
  Svg,
  Text,
} from "@react-pdf/renderer";
import { buildScene, type Prim } from "./scene";
import type { Diagram } from "./types";

function renderPrim(p: Prim, i: number) {
  switch (p.k) {
    case "rect":
      return (
        <Rect
          key={i}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={p.rx}
          fill={p.fill ?? "none"}
          stroke={p.stroke}
          strokeWidth={p.sw}
          strokeDasharray={p.dash}
        />
      );
    case "line":
      return (
        <Line
          key={i}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke={p.stroke}
          strokeWidth={p.sw}
          strokeDasharray={p.dash}
        />
      );
    case "polyline":
      return (
        <Polyline
          key={i}
          points={p.points}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.sw}
          strokeDasharray={p.dash}
        />
      );
    case "circle":
      return (
        <Circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.fill ?? "none"}
          stroke={p.stroke}
          strokeWidth={p.sw}
        />
      );
    case "poly":
      return (
        <Polygon
          key={i}
          points={p.points}
          fill={p.fill ?? "none"}
          stroke={p.stroke}
          strokeWidth={p.sw}
        />
      );
    case "text":
      return (
        <Text
          key={i}
          x={p.x}
          y={p.y}
          fill={p.fill}
          textAnchor={p.anchor ?? "start"}
          style={{
            fontSize: p.size,
            fontFamily: p.weight === "bold" ? "Helvetica-Bold" : "Helvetica",
          }}
        >
          {p.text}
        </Text>
      );
  }
}

/** Esquema de pista para el PDF (vectorial). `width` en puntos. */
export function ExerciseDiagramPdf({
  diagram,
  width,
}: {
  diagram: Diagram;
  width: number;
}) {
  const scene = buildScene(diagram);
  const height = (width * scene.height) / scene.width;
  return (
    <Svg
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      width={width}
      height={height}
    >
      {scene.prims.map(renderPrim)}
    </Svg>
  );
}
