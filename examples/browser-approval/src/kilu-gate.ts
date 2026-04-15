/**
 * KiLu Browser Gate
 * 
 * Provides a beforeAction() hook that evaluates proposed browser
 * actions through KiLu authority before execution.
 * 
 * Designed to wrap Playwright (or any browser automation) actions.
 * 
 * Replace mockAuthorize() with: await client.submitIntent(intent)
 */

import { mockAuthorize, type KiluIntent, type KiluDecision } from "./kilu-mock.js";

export interface BrowserAction {
    type: "navigate" | "click" | "fill" | "submit";
    target: string;
    value?: string;
    url?: string;
}

export interface GateResult {
    action: BrowserAction;
    decision: KiluDecision;
    shouldExecute: boolean;
}

/**
 * Maps browser action types to KiLu action names.
 */
function mapActionType(type: BrowserAction["type"]): string {
    switch (type) {
        case "navigate": return "browser.navigate";
        case "click": return "browser.click";
        case "fill": return "browser.fill";
        case "submit": return "browser.submit";
    }
}

/**
 * Evaluate a proposed browser action through KiLu authority.
 * Call this BEFORE executing the Playwright action.
 * 
 * Usage:
 *   const gate = beforeAction({ type: "click", target: "#confirm-purchase" });
 *   if (gate.shouldExecute) {
 *     await page.click("#confirm-purchase");
 *   }
 */
export function beforeAction(action: BrowserAction): GateResult {
    const intent: KiluIntent = {
        actor: "agent:browser",
        action: mapActionType(action.type),
        target: action.target,
        context: {
            url: action.url,
            value: action.value,
            source: "browser-agent",
        },
    };

    // ── KiLu authority check ──
    // Replace with: const decision = await client.submitIntent(intent);
    const decision = mockAuthorize(intent);

    return {
        action,
        decision,
        shouldExecute: decision.outcome === "ALLOW",
    };
}
