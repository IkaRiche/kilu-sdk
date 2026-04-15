/**
 * KiLu Mock Authority — Browser variant
 * 
 * Local mock for the KiLu authority layer.
 * Evaluates browser actions against a static policy.
 * 
 * In production, replace mockAuthorize() with the real KiluClient:
 * 
 *   import { KiluClient } from "@kilu/sdk";
 *   const client = new KiluClient({ baseUrl: "...", apiKey: "..." });
 *   const result = await client.submitIntent(intent);
 * 
 * @module mock
 */

export type AuthorizationOutcome = "ALLOW" | "REQUIRE_CONFIRM" | "BLOCK";

export interface KiluIntent {
    actor: string;
    action: string;
    target?: string;
    context?: Record<string, any>;
}

export interface KiluDecision {
    outcome: AuthorizationOutcome;
    decisionId: string;
    reason?: string;
}

// Dangerous selectors / URL patterns
const BLOCKED_TARGETS = [
    /delete[-_]account/i,
    /deactivate/i,
    /destroy/i,
    /wipe[-_]data/i,
];

const CONFIRM_TARGETS = [
    /confirm[-_]purchase/i,
    /checkout/i,
    /submit[-_]payment/i,
    /place[-_]order/i,
    /send[-_]transfer/i,
    /approve[-_]transaction/i,
];

let decisionCounter = 0;

/**
 * Mock authorization for browser actions.
 * Replace with: await client.submitIntent(intent)
 */
export function mockAuthorize(intent: KiluIntent): KiluDecision {
    decisionCounter++;
    const id = `mock_decision_${decisionCounter}_${Date.now()}`;
    const target = intent.target || "";

    // BLOCK: dangerous destructive actions
    for (const pattern of BLOCKED_TARGETS) {
        if (pattern.test(target)) {
            return {
                outcome: "BLOCK",
                decisionId: id,
                reason: `Dangerous browser action blocked: target matches "${pattern.source}"`,
            };
        }
    }

    // REQUIRE_CONFIRM: financial / commitment actions
    for (const pattern of CONFIRM_TARGETS) {
        if (pattern.test(target)) {
            return {
                outcome: "REQUIRE_CONFIRM",
                decisionId: id,
                reason: "High-risk browser action requires human confirmation",
            };
        }
    }

    // REQUIRE_CONFIRM: form submissions
    if (intent.action === "browser.submit") {
        return {
            outcome: "REQUIRE_CONFIRM",
            decisionId: id,
            reason: "Form submission requires human confirmation",
        };
    }

    // ALLOW: navigation, safe clicks, reads
    return { outcome: "ALLOW", decisionId: id };
}
