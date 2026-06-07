import type Anthropic from "@anthropic-ai/sdk";

/**
 * The tool Claude MUST call to return drafts. Tool-use forces valid structured
 * output that matches DraftOrder[] — no free-text parsing. See docs/prd.md § Data Model.
 */
export const SUBMIT_ORDERS_TOOL: Anthropic.Tool = {
  name: "submit_orders",
  description:
    "Submit the drafted orders and a plain-English narration. Call this exactly once.",
  input_schema: {
    type: "object",
    properties: {
      narration: {
        type: "string",
        description:
          "One plain-English sentence summarizing what will be placed, e.g. 'Ready to place 2 orders: CBC and a chest X-ray.'",
      },
      drafts: {
        type: "array",
        description: "The drafted orders. Empty if nothing could be mapped.",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["lab", "imaging", "medication"] },
            display: { type: "string", description: "Plain-English order summary." },
            fhirResourceType: {
              type: "string",
              enum: ["ServiceRequest", "MedicationRequest"],
            },
            code: {
              type: "object",
              properties: {
                system: { type: "string" },
                code: { type: "string" },
                display: { type: "string" },
              },
              required: ["system", "code", "display"],
            },
            dose: { type: "string", description: "Medication dose, e.g. '500 mg'." },
            route: { type: "string", description: "Medication route, e.g. 'oral'." },
            frequency: {
              type: "string",
              description: "Medication frequency, e.g. 'twice daily (BID)'.",
            },
            needsClarification: {
              type: "string",
              description:
                "If the order is ambiguous (e.g. a medication missing dose/frequency), put the clarifying QUESTION here and omit code. Never guess a dose.",
            },
          },
          required: ["kind", "display"],
        },
      },
    },
    required: ["narration", "drafts"],
  },
};
