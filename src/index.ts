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
export { KiluClient, KiluClientOptions, AAXClient, AAXClientOptions } from "./client";

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

// Moltbook identity helpers
export {
    MoltbookAgent,
    VerifyIdentityResponse,
    GenerateTokenResponse,
    verifyMoltbookIdentity,
    generateIdentityToken
} from "./moltbook";
