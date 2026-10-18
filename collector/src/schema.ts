import { z } from "zod";
// Gemini's response_schema uses a scalar type plus nullable, not JSON Schema's
// type: ["string","null"]. Keep local Zod validation after generation.
export function geminiSchema(schema: z.ZodType): Record<string, unknown> {
  function convert(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(convert);
    if (!value || typeof value !== "object") return value;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "$schema" || key === "additionalProperties") continue;
      if (key === "type" && Array.isArray(item)) {
        const types = item.filter((t) => t !== "null");
        if (types.length !== 1)
          throw new Error("Unsupported Gemini schema union.");
        result.type = types[0];
        result.nullable = item.includes("null");
      } else result[key] = convert(item);
    }
    return result;
  }
  return convert(z.toJSONSchema(schema)) as Record<string, unknown>;
}
