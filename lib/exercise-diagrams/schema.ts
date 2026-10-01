import { z } from "zod";

const coord = z.number().min(-30).max(130);
const pt = z.tuple([coord, coord]);

const element = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("player"),
    at: pt,
    role: z.enum(["alumno", "monitor", "rival"]).optional(),
    label: z.string().max(2).optional(),
  }),
  z.object({ t: z.literal("ball"), at: pt }),
  z.object({ t: z.literal("basket"), at: pt }),
  z.object({ t: z.literal("cone"), at: pt }),
  z.object({ t: z.literal("hoop"), at: pt }),
  z.object({ t: z.literal("ladder"), from: pt, to: pt }),
  z.object({
    t: z.literal("zone"),
    from: pt,
    to: pt,
    label: z.string().max(14).optional(),
  }),
  z.object({
    t: z.literal("line"),
    from: pt,
    to: pt,
    dashed: z.boolean().optional(),
  }),
  z.object({ t: z.literal("move"), points: z.array(pt).min(2).max(8) }),
  z.object({ t: z.literal("shot"), points: z.array(pt).min(2).max(8) }),
  z.object({ t: z.literal("text"), at: pt, text: z.string().min(1).max(18) }),
]);

export const diagramSchema = z.object({
  court: z.enum(["tenis", "medio", "mini", "libre"]),
  elements: z.array(element).min(1).max(60),
  caption: z.string().max(90).optional(),
});

export const diagramMapSchema = z.record(z.string().uuid(), diagramSchema);
