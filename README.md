[![npm version](https://img.shields.io/npm/v/@kilu-control/sdk.svg)](https://www.npmjs.com/package/@kilu-control/sdk)
[![license](https://img.shields.io/npm/l/@kilu-control/sdk.svg)](./LICENSE)
[![examples](https://img.shields.io/badge/examples-3%20live%20proofs-blue)](./examples/)

**Agents decide. KiLu authorizes.**

Add an `ALLOW / REQUIRE_CONFIRM / BLOCK` policy gate *before* your agent executes anything — tool calls, browser actions, shell commands, or API mutations.

> **Status:** Published on npm · 3 live proofs · Real control plane path · Decisions durably recorded.

```
┌─────────┐     ┌──────────────────┐     ┌──────────┐     ┌─────────────────────────────────┐
│  Agent   │────▶│  Proposed Action  │────▶│   KiLu   │────▶│  ALLOW / REQUIRE_CONFIRM / BLOCK │
│ (model)  │     │  (tool, browser,  │     │ (policy  │     │                                 │
│          │     │   shell, API)     │     │  gate)   │     │  ✅ Execute  ⏸ Pause  🚫 Block  │
└─────────┘     └──────────────────┘     └──────────┘     └─────────────────────────────────┘
```

---

## 🚀 Quickstart
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

## ⚡ Live Integration Proofs
Every example runs locally with a mock authority layer — or connects to a **real production control plane** when `KILU_API_KEY` is set.

### 🛠️ MCP Tool Gate
Wrap MCP tool handlers so destructive actions pause for human approval before execution.
→ [`examples/mcp-tool-gate`](./examples/mcp-tool-gate/)

<a href="https://kilu.network/mcp-tool-gating">
  <img src="https://kilu.network/assets/videos/mcp-demo-v2.webp" alt="KiLu MCP Tool Gating — ALLOW / REQUIRE_CONFIRM / BLOCK" width="720" />
</a>

### 🤖 LangGraph Approval Gate
Drive LangGraph's `interrupt()` flow with a deterministic policy gate instead of fragile prompt checks.
→ [`examples/langgraph-approval-gate`](./examples/langgraph-approval-gate/)

<a href="https://kilu.network/langgraph-approval">
  <img src="https://kilu.network/assets/videos/langgraph-demo-v2.webp" alt="KiLu LangGraph Approval Gate — deterministic interrupt()" width="720" />
</a>

### 🌐 Browser Action Control
Intercept Playwright/Puppeteer actions with a `beforeAction()` hook to prevent autonomous hallucinations.
→ [`examples/browser-approval`](./examples/browser-approval/)

<a href="https://kilu.network/browser-action-control">
  <img src="https://kilu.network/assets/videos/browser-demo-v2.webp" alt="KiLu Browser Action Control — per-click gate" width="720" />
</a>

---

## How KiLu Compares
| Approach | What it does | What it misses |
|---|---|---|
| Prompt guardrails | Hints the model via system prompt | Fragile, bypassable, no enforcement |
| Logs / audit trails | Records what happened | Too late — damage already done |
| HITL on every action | Adds manual review | Approval fatigue, no policy semantics |
| `securitySchemes` / OAuth | Controls access to APIs | No per-action policy, no decision audit |
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
KiLu is **not** a chat agent, planner, workflow builder, or browser automation wrapper.

KiLu is strictly the **authority layer** for autonomous execution.
Your model proposes actions. KiLu decides whether they run.

---

## Trust & Verification
- ✅ 3 runnable integration proofs (MCP, LangGraph, Browser)
- ✅ Mock authority for local development
- ✅ Real production control plane path (`POST /v1/intent`)
- ✅ Ed25519-signed execution receipts
- ✅ Durable decision log (D1-backed audit trail)
- ✅ Deterministic policy evaluation (no LLM in the decision path)

---

## FAQ
<details>
<summary><strong>Is KiLu another agent framework?</strong></summary>

No. KiLu does not replace LangGraph, CrewAI, AutoGen, or any other agent framework. It sits *between* your agent's decision and execution — as a policy gate, not a planner.
</details>

<details>
<summary><strong>Does it replace MCP or LangGraph?</strong></summary>

No. KiLu integrates with both. It wraps MCP tool handlers and drives LangGraph's `interrupt()` flow. See the live examples.
</details>

<details>
<summary><strong>Do examples require a live backend?</strong></summary>

No. Every example ships with a local mock authority layer. Set `KILU_API_KEY` and `KILU_BASE_URL` to connect to a real control plane.
</details>

<details>
<summary><strong>What does REQUIRE_CONFIRM mean?</strong></summary>

The action is valid but needs explicit human approval before execution. KiLu returns a `pending_approval_id` that you can forward to a human reviewer.
</details>

<details>
<summary><strong>Can I run it against a real control plane?</strong></summary>

Yes. The SDK connects to a production Cloudflare Worker endpoint. Decisions are durably recorded and signed with Ed25519 receipts.
</details>

---

## Repository Structure
```
kilu-sdk/
├── src/                          # SDK source
├── examples/
│   ├── mcp-tool-gate/            # MCP integration proof
│   ├── langgraph-approval-gate/  # LangGraph integration proof
│   └── browser-approval/         # Browser automation proof
├── docs/
│   └── why-kilu.md               # Architecture and reasoning model
└── LICENSE
```

---

## License
MIT © [KiLu Network](https://kilu.network)
