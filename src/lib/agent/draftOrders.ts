import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "@/lib/env";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { SUBMIT_ORDERS_TOOL } from "./tools";
import type { DraftOrder, ModelContext } from "@/lib/types";

export interface DraftResult {
  drafts: DraftOrder[];
  narration: string;
}

/**
 * Call Claude with tool-use to map a natural-language request + coded context
 * into structured draft orders. Server-only. PHI never enters here — only ModelContext.
 */
export async function draftOrders(
  text: string,
  ctx: ModelContext,
): Promise<DraftResult> {
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = getAnthropicEnv();
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: buildSystemPrompt(),
    tools: [SUBMIT_ORDERS_TOOL],
    tool_choice: { type: "tool", name: "submit_orders" },
    messages: [{ role: "user", content: buildUserMessage(text, ctx) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Model did not return structured orders");
  }

  const input = toolUse.input as {
    narration?: string;
    drafts?: DraftOrder[];
  };

  return {
    narration: input.narration ?? "",
    drafts: Array.isArray(input.drafts) ? input.drafts : [],
  };
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

/**
 * Streaming variant: streams the narration as it's generated (the "narration" field
 * is first in the tool schema, so it arrives first in the tool's JSON), then returns
 * the complete structured drafts once the tool call finishes. Forced tool-use keeps
 * the structured output reliable — only the narration is streamed for perceived speed.
 */
export async function draftOrdersStream(
  text: string,
  ctx: ModelContext,
  onNarration: (partial: string) => void,
): Promise<DraftResult> {
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = getAnthropicEnv();
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: buildSystemPrompt(),
    tools: [SUBMIT_ORDERS_TOOL],
    tool_choice: { type: "tool", name: "submit_orders" },
    messages: [{ role: "user", content: buildUserMessage(text, ctx) }],
  });

  let acc = "";
  let lastNarration = "";
  stream.on("streamEvent", (event) => {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "input_json_delta"
    ) {
      acc += event.delta.partial_json;
      // Tolerant extraction of the (possibly unterminated) narration string value.
      const m = acc.match(/"narration"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (m) {
        const narr = unescapeJsonString(m[1]);
        if (narr !== lastNarration) {
          lastNarration = narr;
          onNarration(narr);
        }
      }
    }
  });

  const finalMessage = await stream.finalMessage();
  const toolUse = finalMessage.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  const input = (toolUse?.input ?? {}) as {
    narration?: string;
    drafts?: DraftOrder[];
  };

  return {
    narration: input.narration ?? lastNarration,
    drafts: Array.isArray(input.drafts) ? input.drafts : [],
  };
}
