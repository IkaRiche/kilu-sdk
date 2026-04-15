# KiLu SDK

**Authority for autonomous execution.**

Add an `ALLOW / REQUIRE_CONFIRM / BLOCK` policy gate *before* high-risk tool calls, browser actions, or agent executions.

---

## ⚡ Live Proofs & Integrations

KiLu does not replace your model, planner, or framework. It wraps your execution surface with a deterministic policy gate. See how it works in 3 common stacks:

* 🛠️ **[MCP Tool Gate](./examples/mcp-tool-gate/)** — Wrap MCP handlers to pause for human approval on destructive actions.
* 🤖 **[LangGraph Approval Gate](./examples/langgraph-approval-gate/)** — Use KiLu to cleanly drive LangGraph's `interrupt()` flow.
* 🌐 **[Browser Approval](./examples/browser-approval/)** — Intercept Playwright/Puppeteer actions with a `beforeAction()` hook to prevent autonomous hallucinations.

All examples are runnable locally with a mock authority layer. Replacing the mock with a real KiLu client is shown in code.

---

## 🚀 Quickstart (Node.js/TypeScript)

```bash
# not yet published to npm — install from repo
npm install github:IkaRiche/kilu-sdk
```

KiLu returns one of: **`ALLOW`** / **`REQUIRE_CONFIRM`** / **`BLOCK`**

```typescript
import { KiluClient, IntentPayload } from '@kilu/sdk';

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

  // ALLOW -> execute
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

## Example Repository Structure

* [`examples/mcp-tool-gate`](./examples/mcp-tool-gate)
* [`examples/langgraph-approval-gate`](./examples/langgraph-approval-gate)
* [`examples/browser-approval`](./examples/browser-approval)
* [`examples/README.md`](./examples/README.md) — Index of all examples
* [`docs/why-kilu.md`](./docs/why-kilu.md) — Architecture and reasoning model
