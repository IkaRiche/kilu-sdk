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

// --- PUBLIC TYPES ---

export interface ExecutionReceipt {
    intent_hash: string;
    signature: string;
    version: string;
    timestamp: number;
    authority_id: string;
}

export interface IntentPayload {
    action: string;
    target?: string;
    amount?: number;
    currency?: string;
    params?: Record<string, any>;
    [key: string]: any;
}

export type AuthorizationDecision = "ALLOW" | "DENY" | "HUMAN_APPROVAL_REQUIRED";

export interface AuthorizationResult {
    decision: AuthorizationDecision;
    receipt?: ExecutionReceipt;
    /** Generic reason code (no internal policy details exposed) */
    reason?: string;
    pending_approval_id?: string;
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
