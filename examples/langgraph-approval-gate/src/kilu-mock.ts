/**
 * KiLu Mock Authority — LangGraph variant
 * 
 * Local mock for the KiLu authority layer.
 * Evaluates a static policy and returns ALLOW / REQUIRE_CONFIRM / BLOCK.
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

let decisionCounter = 0;

/**
 * Mock authorization — replace with: await client.submitIntent(intent)
 */
export function mockAuthorize(intent: KiluIntent): KiluDecision {
    decisionCounter++;
    const id = `mock_decision_${decisionCounter}_${Date.now()}`;

    // Policy: search is safe
    if (intent.action === "web.search" || intent.action === "file.read") {
        return { outcome: "ALLOW", decisionId: id };
    }

    // Policy: invoicing requires confirmation
    if (intent.action === "invoice.send" || intent.action === "email.send") {
        return {
            outcome: "REQUIRE_CONFIRM",
            decisionId: id,
            reason: "Outbound financial communication requires human approval",
        };
    }

    // Policy: destructive DB operations are blocked
    if (intent.action === "database.drop" || intent.action === "database.truncate") {
        return {
            outcome: "BLOCK",
            decisionId: id,
            reason: "Destructive database operations are forbidden",
        };
    }

    // Default: ALLOW
    return { outcome: "ALLOW", decisionId: id };
}
