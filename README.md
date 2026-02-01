# @kilu/sdk

TypeScript SDK for KiLU Authority — the deterministic execution authority for AI agents.

**"Moltbook gives identity. KiLU Authority gives authority."**

## Installation

```bash
npm install @kilu/sdk
# or
bun add @kilu/sdk
```

## Quick Start

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

// 3. Submit intent for authorization
const result = await client.submitIntent({
    action: "payment",
    amount: 100,
    currency: "EUR"
});

console.log("Decision:", result.decision);
if (result.receipt) {
    console.log("Receipt hash:", result.receipt.intent_hash);
}
```

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

## Resources

- [KiLU Authority](https://authority.kilu.network) — Main service
- [Moltbook Developers](https://moltbook.com/developers) — Identity provider

---

KiLU® and DeTAK™ are trademarks.

## License

MIT
