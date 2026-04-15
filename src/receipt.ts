/**
 * Receipt types and verification helpers for KiLU SDK.
 * 
 * Types are PUBLIC. Verification is PUBLIC.
 * Receipt issuance is KERNEL-ONLY (see internal/receipt-issuer.ts).
 * 
 * @module @kilu/sdk
 */

import { canonicalize } from "./canonical";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex as toHex, hexToBytes } from "@noble/hashes/utils.js";
import * as ed from "@noble/ed25519";

// --- PUBLIC TYPES (canonical naming) ---

export interface ExecutionReceipt {
    intent_hash: string;
    signature: string;
    version: string;
    timestamp: number;
    authority_id: string;
}

export interface IntentPayload {
    /** Identity of the acting agent or service */
    actor?: string;
    /** Action being proposed (e.g. "browser.click", "shell.exec", "email.send") */
    action: string;
    /** Target of the action (e.g. selector, command, URL) */
    target?: string;
    /** Optional monetary amount */
    amount?: number;
    /** Optional currency code */
    currency?: string;
    /** Arbitrary structured context */
    context?: Record<string, any>;
    /** Legacy: additional params */
    params?: Record<string, any>;
    [key: string]: any;
}

/**
 * Canonical authorization outcomes.
 * 
 * - ALLOW: action may execute immediately
 * - REQUIRE_CONFIRM: action requires explicit human approval
 * - BLOCK: action is not admissible under current policy
 */
export type AuthorizationOutcome = "ALLOW" | "REQUIRE_CONFIRM" | "BLOCK";

export interface AuthorizationResult {
    /** Canonical outcome of the authorization decision */
    outcome: AuthorizationOutcome;
    /** Unique decision identifier for audit trail */
    decisionId?: string;
    /** Execution receipt (present when outcome = ALLOW) */
    receipt?: ExecutionReceipt;
    /** Generic reason code (no internal policy details exposed) */
    reason?: string;
    /** Approval flow ID (present when outcome = REQUIRE_CONFIRM) */
    pending_approval_id?: string;
}

// --- BACKWARD COMPATIBILITY ---

/**
 * @deprecated Use AuthorizationOutcome instead.
 * Maps old server values to new canonical names.
 */
export type AuthorizationDecision = "ALLOW" | "DENY" | "HUMAN_APPROVAL_REQUIRED";

/**
 * Normalize inbound server response to canonical outcome names.
 * Accepts both old naming (DENY, HUMAN_APPROVAL_REQUIRED, decision)
 * and new naming (BLOCK, REQUIRE_CONFIRM, outcome).
 * 
 * Public SDK surface always returns new naming.
 */
export function normalizeOutcome(raw: string): AuthorizationOutcome {
    switch (raw) {
        case "ALLOW":
            return "ALLOW";
        case "BLOCK":
        case "DENY":
            return "BLOCK";
        case "REQUIRE_CONFIRM":
        case "HUMAN_APPROVAL_REQUIRED":
            return "REQUIRE_CONFIRM";
        default:
            return "BLOCK"; // fail-closed on unknown
    }
}

/**
 * Normalize a raw server response object to canonical AuthorizationResult.
 * Handles both old field names (decision) and new (outcome).
 */
export function normalizeAuthResult(raw: any): AuthorizationResult {
    const outcomeRaw = raw.outcome || raw.decision || "BLOCK";
    return {
        outcome: normalizeOutcome(outcomeRaw),
        decisionId: raw.decisionId || raw.decision_id,
        receipt: raw.receipt,
        reason: raw.reason,
        pending_approval_id: raw.pending_approval_id,
    };
}

// --- PUBLIC VERIFICATION HELPERS ---

/**
 * Verify an Execution Receipt signature
 * 
 * @param receipt - The receipt to verify
 * @param publicKeyHex - Authority's Ed25519 public key (hex)
 */
export async function verifyReceipt(
    receipt: ExecutionReceipt,
    publicKeyHex: string
): Promise<boolean> {
    try {
        const intentHashBytes = hexToBytes(receipt.intent_hash);

        // Decode base64 signature
        let signatureBytes: Uint8Array;
        if (typeof Buffer !== "undefined") {
            signatureBytes = Uint8Array.from(Buffer.from(receipt.signature, "base64"));
        } else {
            signatureBytes = Uint8Array.from(atob(receipt.signature), (c: string) => c.charCodeAt(0));
        }

        const pubBytes = hexToBytes(publicKeyHex);

        return await ed.verifyAsync(signatureBytes, intentHashBytes, pubBytes);
    } catch {
        return false;
    }
}

/**
 * Verify that a receipt matches an intent
 * Checks both hash match and signature validity
 * 
 * @param intent - Original intent payload
 * @param receipt - The receipt to verify
 * @param publicKeyHex - Authority's Ed25519 public key (hex)
 */
export async function verifyReceiptForIntent(
    intent: IntentPayload,
    receipt: ExecutionReceipt,
    publicKeyHex: string
): Promise<{ valid: boolean; error?: string }> {
    // 1. Recreate canonical hash
    const canonicalPayload = canonicalize(intent);
    const intentHashBytes = sha256(new TextEncoder().encode(canonicalPayload));
    const expectedHash = toHex(intentHashBytes);

    // 2. Check hash match
    if (receipt.intent_hash !== expectedHash) {
        return { valid: false, error: "hash_mismatch" };
    }

    // 3. Verify signature
    const signatureValid = await verifyReceipt(receipt, publicKeyHex);
    if (!signatureValid) {
        return { valid: false, error: "invalid_signature" };
    }

    return { valid: true };
}
