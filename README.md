# KiLu SDK

[![CI](https://github.com/IkaRiche/kilu-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/IkaRiche/kilu-sdk/actions/workflows/test.yml)

**Authority for autonomous execution.**

Add an `ALLOW / REQUIRE_CONFIRM / BLOCK` policy gate *before* high-risk tool calls, browser actions, or agent executions.

---

## ⚡ Live Proofs & Integrations

KiLu does not replace your model, planner, or framework. It wraps your execution surface with a deterministic policy gate. See how it works in 3 common stacks:

* 🛠️ **[MCP Tool Gate](./examples/mcp-tool-gate/)** — Wrap MCP handlers to pause for human approval on destructive actions.
  <br><img src="https://kilu.network/assets/videos/mcp-demo-v2.webp" alt="MCP Tool Gate" width="600"/>

* 🤖 **[LangGraph Approval Gate](./examples/langgraph-approval-gate/)** — Use KiLu to cleanly drive LangGraph's `interrupt()` flow.
  <br><img src="https://kilu.network/assets/videos/langgraph-demo-v2.webp" alt="LangGraph Approval Gate" width="600"/>

* 🌐 **[Browser Approval](./examples/browser-approval/)** — Intercept Playwright/Puppeteer actions with a `beforeAction()` hook to prevent autonomous hallucinations.
  <br><img src="https://kilu.network/assets/videos/browser-demo-v2.webp" alt="Browser Approval" width="600"/>

All examples are runnable locally with a mock authority layer. Replacing the mock with a real KiLu client is shown in code.

---

## 🚀 Quickstart (Node.js/TypeScript)

```bash
npm install @kilu-control/sdk
```

KiLu returns one of: **`ALLOW`** / **`REQUIRE_CONFIRM`** / **`BLOCK`**

```typescript
import { KiluClient, IntentPayload } from '@kilu-control/sdk';

const kilu = new KiluClient({
  baseUrl: process.env.KILU_BASE_URL!,
  apiKey: process.env.KILU_API_KEY!,
});

async function executeAgentTool(toolName: string, args: Record<string, any>) {
  // 1. Agent proposes an action
  const intent: IntentPayload = {
    actor: 'agent-01',
    action: toolName,
    target: JSON.stringify(args),
  };

  // 2. KiLu evaluates the policy
  const auth = await kilu.submitIntent(intent);

  // 3. Deterministic execution outcome
  if (auth.outcome === 'BLOCK') {
    throw new Error(`Execution blocked: ${auth.reason}`);
  }

  if (auth.outcome === 'REQUIRE_CONFIRM') {
    return triggerHumanApprovalFlow(intent, auth.pending_approval_id);
  }

  // ALLOW -> execute with cryptographic receipt
  return doActualExecution(toolName, args);
}
```

---

## Why KiLu?

Modern agents can reason well enough to be useful. The real problem is **execution authority**.

Most agent stacks still look like this:
`Model -> Tool / API / UI -> Execute`

KiLu enforces a safer pattern:
`Model -> Proposed Action -> KiLu -> Decision -> Execute`

This means your model can propose actions, but it does **not** authorize itself to act.

## How KiLu Compares

| Approach | What it does | What it misses |
|---|---|---|
| Prompt guardrails | Hints the model via system prompt | Fragile, bypassable, no enforcement |
| Logs / audit trails | Records what happened | Too late — damage already done |
| HITL on every action | Adds manual review | Approval fatigue, no policy semantics |
| `securitySchemes` / OAuth | Controls access to APIs | No per-action policy, no decision audit |
| Custom decorators / wrappers | Adds local checks around sensitive tools | Fragmented policy, duplicated logic, weak consistency, poor auditability |
| **KiLu** | **Decides before execution** | **Authority layer with receipts** |

## Typical Outcomes

* **`ALLOW`**: Low-risk action within policy (e.g., read-only tools, safe navigation).
* **`REQUIRE_CONFIRM`**: Action may be valid, but requires explicit human approval (e.g., executing shell command, processing payment, sending email).
* **`BLOCK`**: Action violates current policy (e.g., destructive database operation).

## Use KiLu when your agent currently...

* calls tools directly without context checks
* clicks or browses without human approval
* executes shell commands without a policy gate
* performs API mutations without confirmation
* lacks verifiable authorization records

## Not another agent framework

KiLu is **not**:
- a chat agent
- a planner
- a workflow builder
- a browser automation wrapper

KiLu is strictly the **authority layer** for autonomous execution. 
**Agents decide. KiLu authorizes.**

## Trust & Verification

- ✅ 3 runnable integration proofs (MCP, LangGraph, Browser)
- ✅ Mock authority for local development
- ✅ Real production control plane path (`POST /v1/intent`)
- ✅ Ed25519-signed execution receipts
- ✅ Durable decision log (D1-backed audit trail)
- ✅ Deterministic policy evaluation (no LLM in the decision path)

## Documentation

- [API Reference](./docs/api-reference.md) — SDK API surface & core types
- [Receipts & Verification](./docs/receipts-and-verification.md) — How the cryptographic receipts work
- [Architecture & Reasoning](./docs/why-kilu.md) — Why KiLu is built this way

## Example Repository Structure

* [`examples/mcp-tool-gate`](./examples/mcp-tool-gate)
* [`examples/langgraph-approval-gate`](./examples/langgraph-approval-gate)
* [`examples/browser-approval`](./examples/browser-approval)
* [`examples/README.md`](./examples/README.md) — Index of all examples
* [`docs/why-kilu.md`](./docs/why-kilu.md) — Architecture and reasoning model

## License

MIT © [KiLu Network](https://kilu.network)
