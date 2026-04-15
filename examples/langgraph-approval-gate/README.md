# LangGraph Approval Gate

Add a KiLu authority layer to LangGraph tool execution.

## Problem

LangGraph provides `interrupt()` for human-in-the-loop workflows.
But interrupt alone only pauses execution — it does not decide **why**.

Without an authority layer, the decision logic lives in one of two places:

1. **Inside the prompt** — fragile, model-dependent, not auditable
2. **Hardcoded in a node** — rigid, not policy-driven, hard to maintain

Neither option produces deterministic, auditable authorization decisions.

## What KiLu does

KiLu provides the **policy engine** that drives LangGraph's interrupt behavior:

```
Agent proposes tool call
  → KiLu evaluates against policy
    → ALLOW: continue execution
    → REQUIRE_CONFIRM: trigger interrupt(), wait for human
    → BLOCK: skip execution, return error
```

### Key distinction

| | LangGraph HITL | KiLu + LangGraph |
|---|---|---|
| **When to pause** | Configured per-node or manual interrupt() | Same — LangGraph decides when |
| **Why to pause** | Implicit (always pause) or prompt-driven | Explicit policy decision from KiLu |
| **Decision audit** | No audit trail for approval logic | Every decision has an ID and reason |
| **Policy source** | Model judgment or hardcoded | Deterministic, model-agnostic policy |

**KiLu does not replace LangGraph's interrupt(). It decides what interrupt() should do.**

## Without KiLu / With KiLu

### Without KiLu

```ts
// LangGraph tool node — no authority layer
async function toolNode(state: AgentState) {
  // Option A: always interrupt (too aggressive)
  const approval = interrupt({ toolCall: state.pendingTool });

  // Option B: ask the model if it's dangerous (unreliable)
  // Option C: hardcode tool names (unmaintainable)

  return executeTool(state.pendingTool);
}
```

- ❌ Approval logic is ad-hoc
- ❌ No separation between reasoning and authorization
- ❌ No audit trail for why an action was allowed or blocked

### With KiLu

```ts
async function toolNode(state: AgentState) {
  const decision = mockAuthorize({
    actor: "agent:langgraph",
    action: mapToolToKiluAction(state.pendingTool),
    target: state.pendingTool.name,
    context: { args: state.pendingTool.args },
  });

  switch (decision.outcome) {
    case "ALLOW":
      return executeTool(state.pendingTool);
    case "REQUIRE_CONFIRM":
      const approval = interrupt({ decision });
      // human reviews → resume or reject
      return approval.approved ? executeTool(state.pendingTool) : rejectTool();
    case "BLOCK":
      return rejectTool(decision.reason);
  }
}
```

- ✅ KiLu decides, LangGraph orchestrates
- ✅ interrupt() is triggered by policy, not guessing
- ✅ Every decision is auditable

## Run

```bash
cd examples/langgraph-approval-gate
npm install
npm run dev
```

## Expected outcomes

| Tool | Risk | KiLu Outcome | LangGraph Action |
|------|------|-------------|-----------------|
| `search_web` | Low | `ALLOW` | Execute immediately |
| `send_invoice` | Medium | `REQUIRE_CONFIRM` | `interrupt()` → human reviews |
| `drop_table` | High | `BLOCK` | Skip tool, return error |

## Architecture

```
LangGraph Agent
  │
  ├── search_web     → KiLu → ALLOW            → ✅ execute
  ├── send_invoice   → KiLu → REQUIRE_CONFIRM   → ⏸️ interrupt() → human
  └── drop_table     → KiLu → BLOCK            → 🚫 reject
```

## Swap mock for real KiLu

In `src/kilu-mock.ts`, replace:

```ts
const decision = mockAuthorize(intent);
```

With:

```ts
import { KiluClient } from "@kilu/sdk";

const client = new KiluClient({
  baseUrl: process.env.KILU_BASE_URL!,
  apiKey: process.env.KILU_API_KEY!,
});

const decision = await client.submitIntent(intent);
```
