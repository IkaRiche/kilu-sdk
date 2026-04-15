/**
 * KiLU SDK - Client
 * 
 * @packageDocumentation
 * @module @kilu/sdk
 */

import { ApiError, AuthError, RateLimitError } from "./errors";
import type { IntentPayload, AuthorizationResult } from "./receipt";
import { normalizeAuthResult } from "./receipt";

/**
 * KiLU Client configuration options.
 * 
 * Supports two auth modes:
 * - apiKey: simple API key authentication (new)
 * - Moltbook Identity: Bearer token via setMoltIdentity() (legacy)
 */
export interface KiluClientOptions {
    /** Base URL of the KiLU Authority API */
    baseUrl?: string;
    /** @deprecated Use baseUrl instead */
    apiUrl?: string;
    /** API key for authentication (new, preferred) */
    apiKey?: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeoutMs?: number;
}

/**
 * KiLU Authority Client
 * 
 * Provides methods to interact with the KiLU Authority API.
 * 
 * @example
 * ```typescript
 * // New style (apiKey)
 * const client = new KiluClient({
 *   baseUrl: "https://authority.kilu.network",
 *   apiKey: process.env.KILU_API_KEY,
 * });
 * 
 * const result = await client.submitIntent({
 *   actor: "agent:browser",
 *   action: "browser.click",
 *   target: "button#confirm",
 * });
 * 
 * // result.outcome: "ALLOW" | "REQUIRE_CONFIRM" | "BLOCK"
 * ```
 * 
 * @example
 * ```typescript
 * // Legacy style (Moltbook Identity)
 * const client = new KiluClient({ apiUrl: "https://authority.kilu.network" });
 * client.setMoltIdentity(moltToken);
 * ```
 */
export class KiluClient {
    private apiUrl: string;
    private timeoutMs: number;
    private apiKey?: string;
    private moltbookIdentityToken?: string;

    constructor(options: KiluClientOptions) {
        const url = options.baseUrl || options.apiUrl || "";
        this.apiUrl = url.replace(/\/$/, ""); // Remove trailing slash
        this.timeoutMs = options.timeoutMs || 10000;
        this.apiKey = options.apiKey;
    }

    // --- Moltbook Identity Methods (legacy) ---

    /**
     * Sets Moltbook identity token.
     * Token is kept in-memory only and never persisted or logged.
     * 
     * @deprecated Prefer apiKey in constructor options.
     * @param token - Opaque Moltbook bearer token (not JWT, do not decode)
     */
    setMoltIdentity(token: string): void {
        this.moltbookIdentityToken = token;
    }

    /**
     * Clear Moltbook Identity token from memory
     * @deprecated
     */
    clearMoltIdentity(): void {
        this.moltbookIdentityToken = undefined;
    }

    /**
     * Check if Moltbook Identity is set
     * @deprecated
     */
    hasMoltIdentity(): boolean {
        return !!this.moltbookIdentityToken;
    }

    /**
     * Core Fetch Wrapper — supports both apiKey and Moltbook auth
     * @internal
     */
    private async request<T>(method: string, path: string, body?: any): Promise<T> {
        // Resolve auth header
        let authHeader: string | undefined;
        if (this.apiKey) {
            authHeader = `Bearer ${this.apiKey}`;
        } else if (this.moltbookIdentityToken) {
            authHeader = `Bearer ${this.moltbookIdentityToken}`;
        }

        if (!authHeader) {
            throw new AuthError("No authentication configured. Provide apiKey in options or call setMoltIdentity().");
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": authHeader,
        };

        // Prepare body
        const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

        // Execute Fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const res = await fetch(`${this.apiUrl}${path}`, {
                method,
                headers,
                body: bodyStr,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle Errors
            if (!res.ok) {
                // Rate Limit
                if (res.status === 429) {
                    const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10);
                    throw new RateLimitError("rate_limited", retryAfter);
                }

                // Auth Error - generic message (no decision leakage)
                if (res.status === 401) {
                    throw new AuthError("auth_failed");
                }
                if (res.status === 403) {
                    throw new AuthError("access_denied");
                }

                // General API Error - generic codes only
                let errorCode = "api_error";
                try {
                    const errBody: any = await res.json();
                    // Only expose error code, not detailed message
                    if (errBody.error && typeof errBody.error === "string") {
                        errorCode = errBody.error;
                    }
                } catch { }

                throw new ApiError(errorCode, res.status);
            }

            // Return Data
            if (res.status === 204) {
                return {} as T;
            }
            return await res.json() as T;

        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                throw new ApiError("request_timeout", 408);
            }
            throw err;
        }
    }

    // --- Authority Methods ---

    /**
     * Submit an intent for authorization.
     * 
     * The response is normalized to canonical naming:
     * - outcome: "ALLOW" | "REQUIRE_CONFIRM" | "BLOCK"
     * 
     * Old server responses using "DENY" or "HUMAN_APPROVAL_REQUIRED"
     * are automatically normalized.
     * 
     * @param payload - Intent payload with actor, action, target, context
     * @returns Authorization result with outcome and optional receipt
     */
    async submitIntent(payload: IntentPayload): Promise<AuthorizationResult> {
        const raw = await this.request<any>("POST", "/v1/intent", payload);
        return normalizeAuthResult(raw);
    }
}

/** @deprecated Use KiluClient instead */
export const AAXClient = KiluClient;

/** @deprecated Use KiluClientOptions instead */
export type AAXClientOptions = KiluClientOptions;
