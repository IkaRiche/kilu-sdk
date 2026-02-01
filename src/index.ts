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
    AuthorizationDecision,
    AuthorizationResult,
    verifyReceipt,
    verifyReceiptForIntent
} from "./receipt";

// Reference canonicalization (for verification only)
export { canonicalize } from "./canonical";
