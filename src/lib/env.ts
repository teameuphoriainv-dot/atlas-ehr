import { z } from "zod";

/**
 * Server-side environment, split by concern so FHIR reads (Phase 1) don't require
 * the Anthropic key (only needed for drafting in Phase 2).
 * Access ONLY from server code. ANTHROPIC_API_KEY must never reach the client.
 */

const fhirSchema = z.object({
  FHIR_BASE_URL: z.string().url().default("https://hapi.fhir.org/baseR4"),
  DEMO_PATIENT_ID: z.string().optional(),
});

const anthropicSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
});

const azureSchema = z.object({
  AZURE_DI_ENDPOINT: z.string().url("AZURE_DI_ENDPOINT must be a URL"),
  AZURE_DI_KEY: z.string().min(1, "AZURE_DI_KEY is required"),
});

let fhirCache: z.infer<typeof fhirSchema> | null = null;
let anthropicCache: z.infer<typeof anthropicSchema> | null = null;
let azureCache: z.infer<typeof azureSchema> | null = null;

function fail(prefix: string, error: z.ZodError): never {
  const issues = error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`${prefix} Check .env.local — ${issues}`);
}

/** FHIR config — never requires the Anthropic key. */
export function getFhirEnv() {
  if (fhirCache) return fhirCache;
  const parsed = fhirSchema.safeParse(process.env);
  if (!parsed.success) fail("Invalid FHIR environment.", parsed.error);
  fhirCache = parsed.data;
  return fhirCache;
}

/** Anthropic config — only call this from the drafting path (Phase 2). */
export function getAnthropicEnv() {
  if (anthropicCache) return anthropicCache;
  const parsed = anthropicSchema.safeParse(process.env);
  if (!parsed.success) fail("Invalid Anthropic environment.", parsed.error);
  anthropicCache = parsed.data;
  return anthropicCache;
}

/** Azure Document Intelligence config — only used by the OCR vision route. */
export function getAzureEnv() {
  if (azureCache) return azureCache;
  const parsed = azureSchema.safeParse(process.env);
  if (!parsed.success) fail("Invalid Azure environment.", parsed.error);
  azureCache = parsed.data;
  return azureCache;
}

/** Public, client-safe flags (NEXT_PUBLIC_*). */
export const publicEnv = {
  useMockFhir: process.env.NEXT_PUBLIC_USE_MOCK_FHIR === "true",
};
