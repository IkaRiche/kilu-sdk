/**
 * KiLU SDK - Client
 * 
 * @packageDocumentation
 * @module @kilu/sdk
 */

import { ApiError, AuthError, RateLimitError } from "./errors";
import type { IntentPayload, AuthorizationResult } from "./receipt";

/**
 * KiLU Client configuration options.
 * Uses Moltbook Identity (Bearer token) for authentication.
 */
export interface KiluClientOptions {
    /** Base URL of the KiLU Authority API */
    apiUrl: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeoutMs?: number;
}

/**
 * KiLU Authority Client
 * 
 * Provides methods to interact with the KiLU Authority API.
 * Authentication is handled via Moltbook Identity tokens.
 * 
 * @example
 * ```typescript
 * const client = new KiluClient({ apiUrl: "https://authority.kilu.network" });
 * client.setMoltIdentity(moltToken);
 * const result = await client.submitIntent({ action: "payment", amount: 100 });
 * ```
 */
export class KiluClient {
    private apiUrl: string;
    private timeoutMs: number;
    private moltbookIdentityToken?: string;

    constructor(options: KiluClientOptions) {
        this.apiUrl = options.apiUrl.replace(/\/$/, ""); // Remove trailing slash
        this.timeoutMs = options.timeoutMs || 10000;
    }

    // --- Moltbook Identity Methods ---

    /**
     * Sets Moltbook identity token.
     * Token is kept in-memory only and never persisted or logged.
     * 
     * @param token - Opaque Moltbook bearer token (not JWT, do not decode)
     */
    setMoltIdentity(token: string): void {
        this.moltbookIdentityToken = token;
    }

    /**
     * Clear Moltbook Identity token from memory
     */
    clearMoltIdentity(): void {
        this.moltbookIdentityToken = undefined;
    }

    /**
     * Check if Moltbook Identity is set
     */
    hasMoltIdentity(): boolean {
        return !!this.moltbookIdentityToken;
    }

    /**
     * Core Fetch Wrapper - Bearer Auth Only
     * @internal
     */
    private async request<T>(method: string, path: string, body?: any): Promise<T> {
        if (!this.moltbookIdentityToken) {
            throw new AuthError("Moltbook Identity token not set. Call setMoltIdentity() first.");
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.moltbookIdentityToken}`,
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
     * Submit an intent for authorization
     * 
     * @param payload - Intent payload with action and optional parameters
     * @returns Authorization result with decision and optional receipt
     */
    async submitIntent(payload: IntentPayload): Promise<AuthorizationResult> {
        return this.request<AuthorizationResult>("POST", "/v1/intent", payload);
    }
}

/** @deprecated Use KiluClient instead */
export const AAXClient = KiluClient;

/** @deprecated Use KiluClientOptions instead */
export type AAXClientOptions = KiluClientOptions;
