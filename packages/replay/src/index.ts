import { z } from "zod";
import { RULES_VERSION } from "@numchess/engine";

export const tileValueSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const gameActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SELECT"), value: tileValueSchema }),
  z.object({ type: z.literal("PLACE"), index: z.number().int().min(0).max(35) }),
  z.object({ type: z.literal("RESERVE_HOLD") }),
  z.object({ type: z.literal("RESERVE_PLAY"), index: z.number().int().min(0).max(35) }),
]);

export const replayFileSchema = z.object({
  schema: z.literal("numchess-replay/v1"),
  rulesVersion: z.string(),
  config: z.object({
    variant: z.enum(["classic", "classic-reserve"]),
    rulesVersion: z.string(),
  }),
  actions: z.array(
    z.object({
      ply: z.number().int().min(0),
      player: z.union([z.literal(1), z.literal(2)]),
      action: gameActionSchema,
    }),
  ),
  meta: z
    .object({
      createdAt: z.string(),
      appVersion: z.string(),
    })
    .optional(),
});

export type ReplayFile = z.infer<typeof replayFileSchema>;

export const RULES_VERSION_LATEST = RULES_VERSION;

export function parseReplayFile(raw: unknown): ReplayFile {
  return replayFileSchema.parse(raw);
}

export function parseReplayFileSafe(raw: unknown) {
  return replayFileSchema.safeParse(raw);
}
