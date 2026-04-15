# KiLU Authority: The Authority Layer for AI Agents

**"Moltbook gives identity. KiLU Authority gives authority."**

KiLU Authority is an infrastructure gateway that provides deterministic transaction security for autonomous agents. Built on the **DeTAK** kernel.

### What this is NOT:
- Does not host, run, or control agents
- Does not execute actions (receipt-only)
- Does not persist or log Moltbook identity tokens

## Why KiLU?

In the modern agent economy, Identity is not enough. For an agent to perform financially significant actions, they need **Authority**, constrained by clear **Policies**.

## Live Integration Demos

KiLU works as a drop-in authority layer for any agent framework. Here's what it looks like in practice:

### MCP Tool Gating

Every MCP tool call passes through KiLU's deterministic gate — ALLOW, REQUIRE_CONFIRM, or BLOCK — before execution.

<a href="https://kilu.network/mcp-tool-gating">
  <img src="https://kilu.network/assets/videos/mcp-demo-v2.webp" alt="KiLu MCP Tool Gating Demo" width="720" />
</a>

### LangGraph Approval Workflow

KiLu intercepts LangGraph tool nodes and pauses execution for human review when policy requires it.

<a href="https://kilu.network/langgraph-approval">
  <img src="https://kilu.network/assets/videos/langgraph-demo-v2.webp" alt="KiLu LangGraph Approval Demo" width="720" />
</a>

### Browser Action Control

Playwright and browser-use actions are gated per-click — safe navigation proceeds, risky interactions require confirmation or are blocked entirely.

<a href="https://kilu.network/browser-action-control">
  <img src="https://kilu.network/assets/videos/browser-demo-v2.webp" alt="KiLu Browser Action Control Demo" width="720" />
</a>

## Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Deterministic** | Decisions are made by a Finite State Machine (FSM), not a probabilistic LLM model |
| **Receipt-Only** | We issue signed permissions, we do not execute code |
| **Human-in-the-Loop** | Integrated approval mechanism for high-risk operations |
| **Audit-Ready** | Every receipt is stored in an immutable log for future auditing |

## Quick Start

### 1. Get Moltbook Identity Token

```bash
curl -X POST https://moltbook.com/api/v1/agents/me/identity-token \
  -H "Authorization: Bearer YOUR_MOLTBOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"audience": "authority.kilu.network"}'
```

### 2. Submit Intent to KiLU Authority

```bash
curl -X POST https://authority.kilu.network/v1/intent \
  -H "Authorization: Bearer <moltbook_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment",
    "target": "stripe_api",
    "amount": 100,
    "currency": "EUR"
  }'
```

### 3. Receive Signed Receipt

```json
{
  "decision": "ALLOW",
  "receipt": {
    "intent_hash": "a1b2c3d4e5f6...",
    "signature": "base64...",
    "version": "0.1.0",
    "timestamp": 1706803200,
    "authority_id": "kilu_authority_prod"
  }
}
```

## Authorization Decisions

| Decision | HTTP Status | Meaning |
|----------|-------------|---------|
| `ALLOW` | 200 | Intent approved, receipt issued |
| `DENY` | 403 | Intent rejected based on policy |
| `HUMAN_APPROVAL_REQUIRED` | 200 | Requires manual approval |

## SDK Integration

```typescript
import { KiluClient, generateIdentityToken } from "@kilu/sdk";

// 1. Get Moltbook identity token
const tokenResult = await generateIdentityToken(
    process.env.MOLTBOOK_API_KEY!,
    "authority.kilu.network"
);

// 2. Initialize client
const client = new KiluClient({ 
    apiUrl: "https://authority.kilu.network" 
});
client.setMoltIdentity(tokenResult.identity_token!);

// 3. Submit intent
const result = await client.submitIntent({
    action: "payment",
    amount: 100,
    currency: "EUR"
});

console.log("Decision:", result.decision);
```

## Developer Resources

- [KiLU SDK](https://github.com/IkaRiche/kilu-authority) — TypeScript SDK for integration
- [Moltbook Developers](https://moltbook.com/developers) — Identity Provider docs
- [Moltbook Auth Instructions](https://moltbook.com/auth.md?app=KiLU%20Authority&endpoint=https://authority.kilu.network/v1/intent)

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1
- **Identity**: Moltbook
- **Crypto**: Ed25519 (noble-ed25519)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MOLTBOOK_APP_KEY` | Your Moltbook developer app key (`moltdev_...`) |
| `MOLTBOOK_AUDIENCE` | Your service domain for audience restriction |

---

KiLU® and DeTAK™ are trademarks.
This license does not grant rights to use the trademarks in competing services.

## License

MIT
