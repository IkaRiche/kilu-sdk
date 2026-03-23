# @kilu/sdk

TypeScript SDK for KiLU Authority — the deterministic execution authority for AI agents.

**"The cloud orchestrates. The phone authorizes. The Hub executes only with cryptographic mandate."**

<!-- SDK status: Shipped v0.1.0 — verified integration surface -->

## What This SDK Does

`@kilu/sdk` is the integration surface for external systems that want to submit intents for KiLu authority review and verify cryptographic receipts from the KiLu Control Plane.

It **does not**:
- Make execution decisions
- Store or decode bearer tokens
- Bypass the authority loop

It **does**:
- Submit intents (`submitIntent`) to the KiLu Control Plane
- Verify Ed25519-signed receipts (`verifyReceipt`, `verifyReceiptForIntent`)
- Canonicalize intent payloads (`canonical.ts`) for deterministic hashing

## Installation

```bash
npm install @kilu/sdk
# or
bun add @kilu/sdk
```

## Quick Start

```typescript
import { KiluClient } from "@kilu/sdk";

// Obtain a Moltbook identity token per Moltbook developer docs.
const moltToken = process.env.MOLTBOOK_IDENTITY_TOKEN!;

const client = new KiluClient({ apiUrl: "https://authority.kilu.network" });
client.setMoltIdentity(moltToken);

const result = await client.submitIntent({
    action: "payment",
    amount: 100,
    currency: "EUR",
});

console.log(result.decision);
```

> **Note**: Token is opaque bearer; SDK does not decode, persist, or log it.

> **Endpoint & Identity Status:**
> - `authority.kilu.network` is the public KiLu Control Plane endpoint (early access).
> - Moltbook (`www.moltbook.com`) is the v0.1 identity provider model — opaque bearer, not decoded by SDK.
> - For current integration status or to request access, see [KiLu-Network](https://github.com/IkaRiche/KiLu-Network).

## API Reference

### `KiluClient`

```typescript
const client = new KiluClient({ 
    apiUrl: string,    // KiLU Authority endpoint
    timeoutMs?: number // Request timeout (default: 10000)
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `setMoltIdentity(token)` | Set Moltbook bearer token for auth |
| `clearMoltIdentity()` | Clear stored token |
| `hasMoltIdentity()` | Check if token is set |
| `submitIntent(payload)` | Submit intent for authorization |

### Receipt Verification

```typescript
import { verifyReceipt, verifyReceiptForIntent } from "@kilu/sdk";

// Verify signature only
const valid = await verifyReceipt(receipt, authorityPublicKey);

// Verify signature + hash match
const result = await verifyReceiptForIntent(intent, receipt, authorityPublicKey);
```

## Authorization Decisions

| Decision | Meaning |
|----------|---------| 
| `ALLOW` | Intent approved, receipt issued |
| `DENY` | Intent rejected by policy |
| `HUMAN_APPROVAL_REQUIRED` | Needs manual approval |

## KiLu Ecosystem

This SDK is part of the KiLu authority fabric:

| Component | Role | Repo |
|---|---|---|
| **kilu-sdk** (this) | Integration surface for external agents | Public |
| **kilu-pocket-agent** | Android Approver + Hub (validation runtime) | [Public](https://github.com/IkaRiche/kilu-pocket-agent) |
| **KiLu-Network** | Control Plane, governance, canonical docs | Private |

- Android Approver = human authority device
- Android Hub = validation runtime (not production load)
- Linux Hub = production execution path (R3 target)

See [kilu-pocket-agent](https://github.com/IkaRiche/kilu-pocket-agent) for the full system context.

## Resources

- [kilu-pocket-agent](https://github.com/IkaRiche/kilu-pocket-agent) — Android wedge + authority device
- [Moltbook Developers](https://www.moltbook.com/developers) — Identity provider (v0.1 model)

---

KiLU® and DeTAK™ are trademarks.

## License

MIT
