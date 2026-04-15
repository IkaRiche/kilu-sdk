# MCP Tool Gate

Put a KiLu authority gate in front of every MCP tool call.

## Problem

Without an authority layer, MCP tool calls execute directly:

```
Agent → MCP Server → Tool → Execute
```

The agent decides **and** authorizes in the same step.
There is no approval, no audit trail, and no way to block dangerous actions.

If the model hallucinates a tool call or the prompt is adversarial,
execution happens before anyone can intervene.

## What KiLu does

KiLu inserts an authority check between intent and execution:

```
Agent → MCP Server → Tool → KiLu → ALLOW / REQUIRE_CONFIRM / BLOCK → Execute / Stop
```

For every tool call, KiLu evaluates the proposed action against a policy
and returns a deterministic decision **before** execution.

## Without KiLu / With KiLu

### Without KiLu (fail-open)

```ts
server.tool("send_email", schema, async (args) => {
  return sendEmail(args);  // no approval, no audit, no gate
});
```

- ❌ Any tool call executes immediately
- ❌ No record of what was authorized
- ❌ Dangerous actions cannot be intercepted

### With KiLu

```ts
server.tool("send_email", schema, withKiluGate(
  { actor: "agent:mcp", action: "email.send" },
  async (args) => { return sendEmail(args); }
));
```

- ✅ Every tool call passes through policy evaluation
- ✅ High-risk actions require human confirmation
- ✅ Forbidden actions are blocked before execution
- ✅ Every decision has an auditable ID

**Integration diff: ~5 lines per tool.**

## Run

```bash
cd examples/mcp-tool-gate
npm install
npm run dev
```

## Expected outcomes

| Tool | Risk | KiLu Outcome | Result |
|------|------|-------------|--------|
| `read_file` | Low | `ALLOW` | Executes immediately |
| `send_email` | Medium | `REQUIRE_CONFIRM` | Paused for human approval |
| `delete_database` | High | `BLOCK` | Rejected by policy |

## Architecture

```
MCP Client (simulated agent)
  │
  ▼
MCP Server (tool host)
  │
  ├── read_file      → KiLu → ALLOW            → ✅ execute
  ├── send_email     → KiLu → REQUIRE_CONFIRM   → ⏸️ pause
  └── delete_database → KiLu → BLOCK            → 🚫 reject
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

One import, one client init, one line swap.
