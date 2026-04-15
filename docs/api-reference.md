# KiLu SDK API Reference

The `@kilu-control/sdk` package exports a single `KiluClient` for submitting execution intents, along with typescript interfaces for payload shaping and methods for client-side receipt verification.

## `KiluClient`

The primary class for interacting with a KiLu control plane.

### Constructor

```typescript
const client = new KiluClient(options: KiluClientOptions);
```

**`KiluClientOptions`**:
*   `baseUrl` (string): Base URL of the KiLu Authority API (e.g. `https://authority.kilu.network`).
*   `apiKey` (string): Your project's API key for authenticating intent submissions.
*   `timeoutMs` (number, optional): Request timeout in milliseconds (default: 10000).

### `submitIntent()`

Submits an autonomous action intent to the control plane for a deterministic policy decision.

```typescript
async submitIntent(payload: IntentPayload): Promise<AuthorizationResult>
```

---

## Types

### `IntentPayload`

The structure of a proposed action sent to the KiLu control plane.

```typescript
interface IntentPayload {
  actor?: string;      // Identity of the acting agent or service
  action: string;      // Action being proposed (e.g., "browser.click", "shell.exec")
  target?: string;     // Target of the action (e.g., selector, command, URL)
  amount?: number;     // Optional magnitude or cost
  currency?: string;   // Optional currency code
  context?: Record<string, any>; // Arbitrary structured context for policy matching
}
```

### `AuthorizationResult`

The normalized evaluation outcome from the control plane.

```typescript
interface AuthorizationResult {
  outcome: "ALLOW" | "REQUIRE_CONFIRM" | "BLOCK";
  reason?: string;              // High-level reason string
  decisionId?: string;          // Unique audit trail ID
  pending_approval_id?: string; // Included only if outcome is REQUIRE_CONFIRM
  receipt?: ExecutionReceipt;   // Included only if outcome is ALLOW
}
```

#### Outcomes:
*   `ALLOW`: The action matches the active policy and is safe to execute. Includes a cryptographic `receipt`.
*   `REQUIRE_CONFIRM`: The action is valid but flagged by policy to require human approval. Does not execute immediately.
*   `BLOCK`: The action directly violates a hard constraint. Must not execute.

---

## Verification

If your execution engine requires proof that an action was authorized, the SDK provides a helper to cryptographically verify the control plane's signature against the original intent.

### `verifyReceiptForIntent()`

```typescript
async verifyReceiptForIntent(
  intent: IntentPayload,
  receipt: ExecutionReceipt,
  publicKeyHex: string
): Promise<{ valid: boolean; error?: string }>
```

*   **What it does:** Re-canonicalizes the `intent`, hashes it, and verifies the Ed25519 `signature` in the `receipt` against the provided `publicKeyHex`.
*   **Returns:** An object with `valid: true` or `valid: false` along with an error reason (e.g., `"hash_mismatch"` or `"invalid_signature"`).

*(For a conceptual deep-dive on verification, see [Receipts and Verification](./receipts-and-verification.md).)*

---

## Basic Usage Example

```typescript
import { KiluClient, IntentPayload } from '@kilu-control/sdk';

const kilu = new KiluClient({
  baseUrl: process.env.KILU_BASE_URL,
  apiKey: process.env.KILU_API_KEY,
});

async function runGatedTool(toolName: string, args: any) {
  const intent: IntentPayload = {
    actor: 'agent-1',
    action: toolName,
    target: JSON.stringify(args)
  };

  const auth = await kilu.submitIntent(intent);

  switch (auth.outcome) {
    case 'ALLOW':
      console.log('Authorized. Receipt:', auth.receipt);
      return actuallyRunTool(toolName, args);
      
    case 'REQUIRE_CONFIRM':
      console.log('Paused for human approval:', auth.pending_approval_id);
      return haltExecution();
      
    case 'BLOCK':
      throw new Error(`Agent policy violation: ${auth.reason}`);
  }
}
```