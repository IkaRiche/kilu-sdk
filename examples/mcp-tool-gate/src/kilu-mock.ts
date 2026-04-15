/**
 * KiLu Mock Authority
 * 
 * Local mock for the KiLu authority layer.
 * Evaluates a static policy and returns ALLOW / REQUIRE_CONFIRM / BLOCK.
 * 
 * In production, replace this with the real KiluClient:
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

// --- Static policy rules ---

interface PolicyRule {
    match: (intent: KiluIntent) => boolean;
    outcome: AuthorizationOutcome;
    reason: string;
}

const POLICY_RULES: PolicyRule[] = [
    // BLOCK: destructive database operations
    {
        match: (i) => i.action === "database.drop" || i.action === "database.delete",
        outcome: "BLOCK",
        reason: "Destructive database operations are not permitted",
    },
    // BLOCK: dangerous shell commands
    {
        match: (i) => i.action === "shell.exec" && /rm\s+-rf|DROP\s+TABLE|FORMAT/i.test(i.target || ""),
        outcome: "BLOCK",
        reason: "Dangerous shell command blocked by policy",
    },
    // REQUIRE_CONFIRM: email sending
    {
        match: (i) => i.action === "email.send" || i.action === "email.bulk_send",
        outcome: "REQUIRE_CONFIRM",
        reason: "Outbound email requires human confirmation",
    },
    // REQUIRE_CONFIRM: payment / financial
    {
        match: (i) => i.action.startsWith("payment.") || i.action.startsWith("billing."),
        outcome: "REQUIRE_CONFIRM",
        reason: "Financial actions require human confirmation",
    },
    // REQUIRE_CONFIRM: anything marked high-risk in context
    {
        match: (i) => i.context?.risk_level === "high",
        outcome: "REQUIRE_CONFIRM",
        reason: "High-risk context requires confirmation",
    },
];

let decisionCounter = 0;

/**
 * Mock authorization function.
 * Evaluates intent against static policy rules.
 * Default: ALLOW (fail-open for demo; production should be fail-closed).
 * 
 * Replace with: await client.submitIntent(intent)
 */
export function mockAuthorize(intent: KiluIntent): KiluDecision {
    decisionCounter++;
    const id = `mock_decision_${decisionCounter}_${Date.now()}`;

    for (const rule of POLICY_RULES) {
        if (rule.match(intent)) {
            return {
                outcome: rule.outcome,
                decisionId: id,
                reason: rule.reason,
            };
        }
    }

    // Default: ALLOW
    return {
        outcome: "ALLOW",
        decisionId: id,
    };
}
