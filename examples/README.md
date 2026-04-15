# Examples

Live compatibility proofs for KiLu SDK.

Each example demonstrates KiLu as the authority layer for a specific agent stack.
All examples use a local mock authority — no external infrastructure needed.

## Examples

| Example | Stack | Pain Without KiLu | KiLu Adds |
|---------|-------|-------------------|-----------|
| [mcp-tool-gate](./mcp-tool-gate) | MCP | Tool calls execute without approval | Authority gate per tool call |
| [langgraph-approval-gate](./langgraph-approval-gate) | LangGraph | No deterministic policy for interrupt() | Policy-driven approval decisions |
| [browser-approval](./browser-approval) | Playwright | Dangerous clicks execute freely | Action-level authorization |

## Structure

Every example follows the same pattern:

```
examples/<name>/
├── README.md           # Problem / What KiLu does / Without vs With / Run
├── package.json
├── tsconfig.json
└── src/
    ├── kilu-mock.ts    # Local mock authority (swap for real KiluClient)
    ├── ...             # Integration-specific code
    └── run.ts          # Entry point — npm run dev
```

## Running

```bash
cd examples/<name>
npm install
npm run dev
```

## Visual pattern

All examples follow the same execution flow:

```
Agent → Proposed Action → KiLu → ALLOW / REQUIRE_CONFIRM / BLOCK → Execute / Stop
```

## Swapping mock for real KiLu

In each example's `src/kilu-mock.ts`:

```ts
// Replace this:
const decision = mockAuthorize(intent);

// With this:
import { KiluClient } from "@kilu/sdk";
const client = new KiluClient({ baseUrl: "...", apiKey: "..." });
const decision = await client.submitIntent(intent);
```
