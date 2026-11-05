# KiLu SDK

[![CI](https://github.com/IkaRiche/kilu-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/IkaRiche/kilu-sdk/actions/workflows/test.yml)

**Agent execution authority SDK — evaluation-stage integration surface.**

KiLu is an execution authority layer for AI systems. It places an explicit decision boundary before tool calls, browser actions, and other high-risk execution paths.

> **Status:** SDK v0.2.1 published; current source under proprietary notice. Example integrations use mocks and do not demonstrate the full canonical grant → bounded execution → signed report → receipt protocol. The legacy `/v1/intent` route is not execution authority.

```mermaid
flowchart LR
    A["🤖 Agent\n(model)"] --> B["⚙️ Proposed Action\n(tool, browser, shell, API)"]
    B --> C{"🛡️ KiLu\n(policy gate)"}
    
    C -- "ALLOW" --> D["✅ Execute"]
    C -- "REQUIRE_CONFIRM" --> E["⏸ Pause"]
    C -- "BLOCK" --> F["🚫 Block"]
```

---

## 🚀 Quickstart

Start with one execution surface: one tool, one browser action, or one approval path.

```bash
npm install @kilu-control/sdk
```

```typescript
import { KiluClient, IntentPayload } from '@kilu-control/sdk';

const kilu = new KiluClient({
  baseUrl: process.env.KILU_BASE_URL!,
  apiKey: process.env.KILU_API_KEY!,
});

async function executeAgentTool(toolName: string, args: Record<string, any>) {
  const intent: IntentPayload = {
    actor: 'agent-01',
    action: toolName,
    target: JSON.stringify(args),
  };

  const auth = await kilu.submitIntent(intent);

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

## Integration Examples (mock-based; not production authority proofs)

### 🛠️ MCP Tool Gate
Wrap MCP tool handlers so destructive actions pause for human approval before execution.
<br><img src="https://kilu.network/assets/videos/mcp-demo-v2.webp" alt="MCP Tool Gate" width="600"/>
→ [`examples/mcp-tool-gate`](./examples/mcp-tool-gate/)

### 🤖 LangGraph Approval Gate
Drive LangGraph's `interrupt()` flow with a deterministic policy gate instead of fragile prompt checks.
<br><img src="https://kilu.network/assets/videos/langgraph-demo-v2.webp" alt="LangGraph Approval Gate" width="600"/>
→ [`examples/langgraph-approval-gate`](./examples/langgraph-approval-gate/)

### 🌐 Browser Action Control
Intercept Playwright/Puppeteer actions with a `beforeAction()` hook to prevent autonomous hallucinations.
<br><img src="https://kilu.network/assets/videos/browser-demo-v2.webp" alt="Browser Approval" width="600"/>
→ [`examples/browser-approval`](./examples/browser-approval/)

All examples include local mock authority. Connecting to the legacy `/v1/intent` API does **not** provide canonical execution authorization or post-execution receipts. Do not allow real side-effectful tool execution from an `ALLOW` decision unless a scoped, single-use grant has been verified by the executor through the canonical KiLu protocol.

---

## Developer References

* [API Reference](./docs/api-reference.md)
* [Receipts & Verification](./docs/receipts-and-verification.md)
* [Examples](./examples/README.md)

---

## How KiLu Compares

| Approach | What it does | What it misses |
|---|---|---|
| Prompt guardrails | Hints the model via system prompt | Fragile, bypassable, no enforcement |
| Logs / audit trails | Records what happened | Too late — damage already done |
| HITL on every action | Adds manual review | Approval fatigue, no policy semantics |
| `securitySchemes` / OAuth | Controls access to APIs | No per-action policy, no decision audit |
| Custom decorators / wrappers | Adds local checks around sensitive tools | Fragmented policy, duplicated logic, weak consistency, poor auditability |
| **KiLu** | **Decides before execution** | **Authority layer with receipts** |

---

## Typical Outcomes

| Outcome | When | Example |
|---|---|---|
| **`ALLOW`** | Low-risk action within policy | `file.read`, `browser.hover`, `mcp.read` |
| **`REQUIRE_CONFIRM`** | Valid action, needs human approval | `email.send`, `shell.exec`, `payment.charge` |
| **`BLOCK`** | Violates current policy | `system.rm`, `database.drop`, `shell.exec.dangerous` |

---

## Use Cases

**Use KiLu when your agent currently...**

- 🔧 Calls MCP tools directly without context checks
- 🌐 Clicks or browses without human approval
- 💻 Executes shell commands without a policy gate
- 🔄 Performs API mutations without confirmation
- 📜 Lacks verifiable authorization records

---

## What KiLu Is Not

KiLu is **not**:
- an agent framework
- a planner
- a browser automation library
- a general-purpose policy platform

KiLu is strictly the **authority layer** for autonomous execution.
Your model proposes actions. KiLu decides whether they run.

---

## Trust & Verification

- 3 illustrative integration examples (MCP, simulated LangGraph, Browser), mostly mock-backed
- ✅ Mock authority for local development
- Legacy control plane intent endpoint (`POST /v1/intent`), non-authoritative; fail-closed hardening under review
- SDK Ed25519 intent-signature verification helper; a signed pre-execution intent is **not** a post-execution receipt
- Audit persistence is part of the legacy cloud route; end-to-end execution evidence requires the canonical Trust Center / Runner / Verifier path
- ✅ Deterministic policy evaluation (no LLM in the decision path)

Read more: [API Reference](./docs/api-reference.md) · [Receipts & Verification](./docs/receipts-and-verification.md) · [Examples](./examples/README.md)

---

## FAQ

<details>
<summary><strong>Is KiLu another agent framework?</strong></summary>

No. It sits *between* your agent and execution as a policy gate. KiLu does not replace LangGraph, CrewAI, or AutoGen.
</details>

<details>
<summary><strong>Does it replace MCP or LangGraph?</strong></summary>

No. It wraps MCP tool handlers and drives LangGraph's `interrupt()` flow.
</details>

<details>
<summary><strong>Do examples require a live backend?</strong></summary>

No. Every example ships with a local mock authority layer that you can easily swap for a real control plane.
</details>

<details>
<summary><strong>What does REQUIRE_CONFIRM mean?</strong></summary>

The action is valid but needs explicit human approval before execution. Forward the `pending_approval_id` to a reviewer.
</details>

<details>
<summary><strong>Can I run it against a real control plane?</strong></summary>

The legacy endpoint is not sufficient for authorizing real execution. Use the separately verified KiLu Trust Center → grant → bound Runner → execution report → receipt path.
</details>

---

Status: evaluation-stage SDK; complete canonical authority integration remains unverified.

## License

The current repository revision is proprietary and does not grant a general-use license. See [LICENSE](./LICENSE). Earlier distributed versions or copies may retain rights granted under their accompanying licenses.
