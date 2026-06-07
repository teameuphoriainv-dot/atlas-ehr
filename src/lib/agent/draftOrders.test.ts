// @vitest-environment node
// The Anthropic SDK refuses to run in a browser-like env (jsdom). This test exercises
// server code, so it runs in Node — matching how /api/draft actually executes.
import { describe, it, expect } from "vitest";
import { draftOrders } from "./draftOrders";
import type { ModelContext } from "@/lib/types";

/**
 * LIVE success-rate check (FR-003 / Success Metrics). Hits the Anthropic API, so it
 * only runs when ANTHROPIC_API_KEY is present — normal `npm test` skips it and stays
 * offline/free. Run it with:
 *   ANTHROPIC_API_KEY=sk-ant-... npx vitest run draftOrders
 */
const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);

const ctx: ModelContext = {
  patientRef: "Patient/test",
  ageBand: "50-59",
  sex: "male",
  problems: [{ code: "44054006", system: "snomed", display: "Type 2 diabetes" }],
  activeMedications: [],
  allergies: [],
};

// [request, expected code that should appear among the drafts]
const CASES: [string, string][] = [
  ["order a CBC", "58410-2"],
  ["get a chest x-ray", "36643-5"],
  ["check an A1c", "4548-4"],
  ["order a lipid panel", "57698-3"],
  ["order a basic metabolic panel", "24323-8"],
  ["start atorvastatin 20 mg daily", "617311"],
];

describe.skipIf(!HAS_KEY)("draftOrders live success rate", () => {
  it(
    "maps the demo vocabulary to correct codes >= 90% of the time",
    async () => {
      let correct = 0;
      for (const [text, expected] of CASES) {
        const { drafts } = await draftOrders(text, ctx);
        const codes = drafts.map((d) => d.code?.code).filter(Boolean);
        if (codes.includes(expected)) correct += 1;
        else console.warn(`MISS: "${text}" expected ${expected}, got [${codes.join(", ")}]`);
      }
      const rate = correct / CASES.length;
      console.log(`Correct-code rate: ${(rate * 100).toFixed(0)}% (${correct}/${CASES.length})`);
      expect(rate).toBeGreaterThanOrEqual(0.9);
    },
    120_000,
  );
});
