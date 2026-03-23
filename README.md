# kilu-sdk

Public TypeScript SDK for integrating external agents and planners into KiLu's approval-bound execution model.

`kilu-sdk` is the bridge between agent intent and KiLu authority. It allows an external client to submit intents, receive authorization decisions, and verify returned receipts — without giving the agent raw, unconstrained execution authority.

## What This Repository Is

This repository contains the public TypeScript integration layer for KiLu.

It is intended for:

- external planners
- agent frameworks
- orchestration layers
- tools that need to request execution authority from KiLu

The SDK helps a client:

- submit an intent for authorization
- receive a decision (`ALLOW` / `DENY` / `HUMAN_APPROVAL_REQUIRED`)
- handle human-approval flows
- verify returned receipts instead of trusting opaque callbacks or logs

## What This Repository Is Not

This repository is not the whole KiLu platform.

It is not:

- the control plane implementation
- the Android authority device
- the execution runtime
- a complete security solution by itself

Importing the SDK does not automatically make an unconstrained agent safe. The SDK becomes meaningful when execution is actually routed through KiLu-controlled authority and runtime boundaries.

## Current Status

`kilu-sdk` is a live public integration surface for early-access KiLu authority flows.

- package published: `@kilu/sdk` v0.1
- integration surface: `submitIntent`, `verifyReceipt`, `verifyReceiptForIntent`
- identity model: opaque bearer token (SDK does not decode, persist, or log it)

The public hostname and identity wording used in this README reflect the current v0.1 integration model. They should be read as the public SDK-facing surface, not as a complete map of KiLu's internal deployment topology.

## Decision Model

KiLu separates intent from authority.

An agent may propose an action, but KiLu returns one of three decision classes:

| Decision | Meaning |
|---|---|
| `ALLOW` | Intent approved, receipt issued |
| `DENY` | Intent rejected by policy |
| `HUMAN_APPROVAL_REQUIRED` | Flagged for human approval before execution proceeds |

This model keeps cognition and execution authority as separate concerns. The SDK is the interface to that boundary — not a bypass of it.

## What the SDK Enables

With `kilu-sdk`, an external agent or planner can:

- ask KiLu whether an action may proceed
- receive a structured, actionable decision
- defer high-risk steps to explicit human approval
- verify returned receipts against known public keys
- integrate into a KiLu authority flow without rewriting the agent itself

## Receipt Verification

The SDK supports cryptographic receipt verification.

This matters because KiLu is not just about deciding whether an action may proceed — it is also about producing evidence that the decision and execution path can be checked after the fact.

That is the difference between ordinary agent middleware and an approval-bound execution model.

```typescript
import { verifyReceipt, verifyReceiptForIntent } from "@kilu/sdk";

// Verify signature only
const valid = await verifyReceipt(receipt, authorityPublicKey);

// Verify signature + hash match against original intent
const result = await verifyReceiptForIntent(intent, receipt, authorityPublicKey);
```

## Installation

```bash
npm install @kilu/sdk
# or
bun add @kilu/sdk
```

## Minimal Example

```typescript
import { KiluClient } from "@kilu/sdk";

// v0.1 identity model: opaque bearer token
// See: https://github.com/IkaRiche/KiLu-Network for current access model
const client = new KiluClient({ apiUrl: "https://authority.kilu.network" });
client.setMoltIdentity(process.env.KILU_IDENTITY_TOKEN!);

const result = await client.submitIntent({
  action: "fetch",
  target: "https://example.com",
});

switch (result.decision) {
  case "ALLOW":
    // Proceed — authority issued receipt
    await verifyReceipt(result.receipt, authorityPublicKey);
    break;
  case "DENY":
    // Policy blocked — do not proceed
    break;
  case "HUMAN_APPROVAL_REQUIRED":
    // Pause and wait for human approval signal
    break;
}
```

> **v0.1 identity note:** `authority.kilu.network` is the current public endpoint. The identity model (opaque bearer + Moltbook identity provider) reflects the v0.1 integration surface. For integration access or current deployment topology, see [KiLu-Network](https://github.com/IkaRiche/KiLu-Network).

## API Reference

### `KiluClient`

```typescript
const client = new KiluClient({
  apiUrl: string,     // KiLu authority endpoint
  timeoutMs?: number  // default: 10000
});
```

| Method | Description |
|---|---|
| `setMoltIdentity(token)` | Set bearer token for authentication |
| `clearMoltIdentity()` | Clear stored token |
| `hasMoltIdentity()` | Check if token is set |
| `submitIntent(payload)` | Submit intent for authorization — returns decision + receipt |

### `verifyReceipt(receipt, publicKey)`

Verifies the Ed25519 signature on a KiLu authority receipt. Returns `true` if valid.

### `verifyReceiptForIntent(intent, receipt, publicKey)`

Verifies signature **and** confirms the receipt hash matches the original intent payload. Stronger guarantee than signature-only verification.

## Scope Limits / Honest Boundary

Using the SDK does not by itself secure an agent that still retains unrestricted direct access to shell, browser, network, or file system execution.

The SDK is effective when the execution path is actually routed through KiLu-controlled authority and runtime boundaries. An agent that calls `submitIntent` but then executes independently of the decision is not meaningfully constrained.

> The SDK is strongest when used to wrap existing agents whose execution surface is bounded by KiLu-controlled interfaces.

## Supported Integration Modes

- **Native SDK integration** — agent calls `submitIntent` directly, handles decision, verifies receipt
- **Planner/bridge integration** — orchestration layer mediates between cognition and execution, SDK sits at the authority boundary
- **Future gateway/runtime integration** — longer-term: execution paths routed through KiLu-controlled runtimes (Linux Hub, gateway adapters), SDK provides the intent/receipt contract

## Integration Position in the Ecosystem

```
External Agent / Planner
        │
        │  submitIntent()
        ▼
   [ kilu-sdk ]  ◄── you are here
        │
        │  Authorization decision
        ▼
   KiLu Control Plane  (KiLu-Network)
        │
        ├── Android Approver  (kilu-pocket-agent) — human authority
        └── Hub runtime — execution under grant
```

| Component | Role |
|---|---|
| **kilu-sdk** (this) | Public TypeScript integration surface |
| **KiLu-Network** | Canonical control-plane and operational repo |
| **kilu-pocket-agent** | Android authority device and validation runtime wedge |
| **Linux/gateway runtimes** | Production execution direction |

## Related Repositories

- **[KiLu-Network](https://github.com/IkaRiche/KiLu-Network)** — canonical operational repo, control plane, governance docs, ecosystem map
- **[kilu-pocket-agent](https://github.com/IkaRiche/kilu-pocket-agent)** — Android authority device (Approver) and validation runtime (Hub)
- **[KiLu / DeTAK](https://github.com/IkaRiche/KiLu)** — protocol and authority primitives

## Practical Reading Guide

- **read this repo** if you want to integrate an external agent or planner into KiLu's authority model
- **read `kilu-pocket-agent`** if you want to understand the Android authority device and validation runtime
- **read `KiLu-Network`** if you want the live operational picture, current deployment topology, and governance docs

---

## Core Thesis

Your agent may propose an action.  
KiLu decides whether that action may proceed.  
The SDK is the bridge between those two worlds.

---

KiLU® and DeTAK™ are trademarks.

## License

MIT
