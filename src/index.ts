/**
 * @kilu/sdk - KiLU Authority SDK
 * 
 * Public SDK for interacting with KiLU Authority.
 * Provides types, client, and receipt verification helpers.
 * 
 * @packageDocumentation
 * @module @kilu/sdk
 */

// Client
export { KiluClient, KiluClientOptions } from "./client";

// Errors
export { ApiError, AuthError, RateLimitError } from "./errors";

// Receipt types and verification (PUBLIC)
export {
    ExecutionReceipt,
    IntentPayload,
    AuthorizationResult,
    verifyReceipt,
    verifyReceiptForIntent,
} from "./receipt";

// Canonical outcome type (new)
export type { AuthorizationOutcome } from "./receipt";

// Normalization helpers (for custom integrations)
export { normalizeOutcome, normalizeAuthResult } from "./receipt";

// Backward-compat: deprecated type re-export
/** @deprecated Use AuthorizationOutcome instead */
export type { AuthorizationDecision } from "./receipt";

// Reference canonicalization (for verification only)
export { canonicalize } from "./canonical";
