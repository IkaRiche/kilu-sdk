/**
 * Browser Approval — Runner
 * 
 * Simulates a browser agent performing 4 actions on a web page.
 * Each action passes through KiLu authority before execution.
 * 
 * This example does NOT require a real browser.
 * It simulates the agent's action sequence and shows KiLu decisions.
 * In a real integration, each gated action would wrap a Playwright call.
 * 
 * Flow:
 *   Browser Agent → Proposed Action → KiLu Gate → ALLOW / REQUIRE_CONFIRM / BLOCK
 * 
 * Usage: npm run dev
 */

import { beforeAction, type BrowserAction } from "./kilu-gate.js";

// ─────────────────────────────────────────────
// Simulated browser agent action sequence
// ─────────────────────────────────────────────

const AGENT_ACTIONS: Array<{ label: string; action: BrowserAction }> = [
    {
        label: "🌐 Action 1: Navigate to store",
        action: {
            type: "navigate",
            target: "https://store.example.com/products",
            url: "https://store.example.com/products",
        },
    },
    {
        label: "🛒 Action 2: Click 'Add to Cart'",
        action: {
            type: "click",
            target: "#add-to-cart",
            url: "https://store.example.com/products/widget-pro",
        },
    },
    {
        label: "💳 Action 3: Click 'Confirm Purchase'",
        action: {
            type: "click",
            target: "#confirm-purchase",
            url: "https://store.example.com/checkout",
        },
    },
    {
        label: "⚠️  Action 4: Click 'Delete Account'",
        action: {
            type: "click",
            target: "#delete-account",
            url: "https://store.example.com/settings",
        },
    },
];

// ─────────────────────────────────────────────
// Run the agent
// ─────────────────────────────────────────────

function main() {
    console.log("═".repeat(64));
    console.log("  KiLu + Browser Agent — Authority Gate Demo");
    console.log("═".repeat(64));
    console.log();
    console.log("  A browser agent wants to perform 4 actions.");
    console.log("  Each action passes through KiLu before execution.");
    console.log();
    console.log("  Flow: Agent → Proposed Action → KiLu → Decision → Execute / Stop");
    console.log();
    console.log("─".repeat(64));

    const results: Array<{ label: string; outcome: string; executed: boolean }> = [];

    for (const { label, action } of AGENT_ACTIONS) {
        console.log(`\n${label}`);
        console.log(`  ├─ Type:   ${action.type}`);
        console.log(`  ├─ Target: ${action.target}`);
        console.log(`  ├─ URL:    ${action.url || "—"}`);

        const gate = beforeAction(action);

        console.log(`  ├─ KiLu outcome:  ${gate.decision.outcome}${gate.decision.reason ? ` — ${gate.decision.reason}` : ""}`);
        console.log(`  ├─ Decision ID:   ${gate.decision.decisionId}`);

        switch (gate.decision.outcome) {
            case "ALLOW":
                console.log(`  └─ ✅ Action executed`);
                console.log(`       // await page.${action.type}("${action.target}")`);
                break;
            case "REQUIRE_CONFIRM":
                console.log(`  └─ ⏸️  Action paused — awaiting human approval`);
                console.log(`       // Show approval UI with decision ID: ${gate.decision.decisionId}`);
                break;
            case "BLOCK":
                console.log(`  └─ 🚫 Action blocked — not executed`);
                console.log(`       // Agent receives rejection, must choose alternative`);
                break;
        }

        results.push({
            label: action.target,
            outcome: gate.decision.outcome,
            executed: gate.shouldExecute,
        });

        console.log("─".repeat(64));
    }

    // Summary
    console.log();
    console.log("═".repeat(64));
    console.log("  Summary");
    console.log("═".repeat(64));
    console.log();
    for (const r of results) {
        const icon = r.outcome === "ALLOW" ? "✅" : r.outcome === "REQUIRE_CONFIRM" ? "⏸️ " : "🚫";
        const pad = r.label.padEnd(22);
        console.log(`  ${pad} → ${r.outcome.padEnd(16)} ${icon} ${r.executed ? "executed" : "not executed"}`);
    }
    console.log();
    console.log("  Without KiLu:");
    console.log("    All 4 actions would execute. Including 'Delete Account'.");
    console.log("    The agent has no concept of authorization.");
    console.log();
    console.log("  With KiLu:");
    console.log("    Navigation and safe clicks → ALLOW.");
    console.log("    Financial action → REQUIRE_CONFIRM → human reviews.");
    console.log("    Destructive action → BLOCK → never executes.");
    console.log("═".repeat(64));
}

main();
