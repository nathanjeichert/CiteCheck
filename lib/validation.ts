import { z } from "zod";

const MAX = Number(process.env.MAX_INPUT_CHARS || 64000);

export const CheckCitesSchema = z.object({
  text: z.string().min(1, "Text is required.").max(MAX, `Text too long (>${MAX} chars).`)
});

export type CheckCitesInput = z.infer<typeof CheckCitesSchema>;

