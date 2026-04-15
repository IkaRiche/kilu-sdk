# Receipts and Verification

In the KiLu architecture, the control plane does not execute actions. Instead, it issues a **cryptographic receipt** when an agent's intent is authorized under the active policy.

This document explains what these receipts are, how they work, and what security guarantees they actually provide.

## What is a Receipt?

A receipt is a proof of an authorized execution decision.

When you call `submitIntent()`, and the outcome is `ALLOW`, the SDK receives a JSON payload that looks like this:

```json
{
  "intent_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signature": "base64...",
  "version": "0.1.0",
  "timestamp": 1706803200,
  "authority_id": "kilu_production_1"
}
```

This receipt can be passed to an execution engine, recorded in a database for audit purposes, or verified client-side to ensure the control plane actually approved the *exact* action the agent is attempting to perform.

## What is Signed?

The signature in a receipt is generated over the **Hash of the Canonicalized Intent**.

The flow is:
1.  **Canonicalization**: The intent payload (`actor`, `action`, `target`, `context`, etc.) is serialized into a deterministic JSON string. Keys are sorted, and spacing is normalized.
2.  **Hashing**: The canonical string is hashed using SHA-256. This is the `intent_hash`.
3.  **Signing**: The `intent_hash` is signed using the control plane's private Ed25519 key.

This ensures that any change to the intent payload—even flipping a single boolean in the context—produces a different hash, rendering the signature invalid.

## What Verification Proves

When you use the SDK's `verifyReceiptForIntent()` function, you cryptographically prove three things:

1.  **Data Integrity:** The `intent` payload you are about to execute hashes to the exact `intent_hash` stored in the receipt. The payload hasn't been tampered with.
2.  **Authority Origin:** The `signature` is valid and was definitively produced by the expected KiLu control plane's private key.
3.  **Authorization:** Because the control plane only issues receipts for `ALLOW` outcomes, the existence of a valid signature proves the action was authorized by the policy at the `timestamp` indicated.

## What Verification Does NOT Prove

> [!WARNING]  
> It is critical to understand the boundaries of this security model to avoid false complacency.

A valid receipt **does not prove**:

*   **Model Correctness:** It doesn't prove the LLM's goal was "good" or that it understood the user's overarching desire. It only proves the *specific action* was allowed by the policy.
*   **Business Validity:** If your policy allows "buy $100 of AWS credits", and the agent hallucinates that action, KiLu will authorize it. Verification doesn't prevent authorized hallucinations.
*   **Execution Success:** It proves the action was *allowed*, not that the action *succeeded* or even *occurred*.
*   **Runtime Security:** It does not protect against a compromised execution environment. If the server running the tool is compromised, the receipt check can simply be bypassed.

Verification is a point-in-time check that a deterministic policy gate approved a specific payload. It does not replace defense-in-depth, runtime isolation (like sandboxes), or sane business limits.

## Client-Side Usage

You can verify a receipt entirely client-side without making a network request, provided you know the control plane's public key.

```typescript
import { verifyReceiptForIntent } from '@kilu-control/sdk';

const { valid, error } = await verifyReceiptForIntent(
    intentPayload,
    receipt,
    "your_control_plane_public_key_hex"
);

if (!valid) {
    throw new Error(`Execution blocked: invalid receipt (${error})`);
}

// Safe to proceed
```