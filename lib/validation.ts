import { z } from "zod";

export const MAX_INPUT_CHARS = 64_000;

export const CheckCitesSchema = z.object({
  text: z.string().min(1, "Text is required.").max(MAX_INPUT_CHARS, `Text too long (>${MAX_INPUT_CHARS.toLocaleString()} chars).`)
});

export type CheckCitesInput = z.infer<typeof CheckCitesSchema>;

