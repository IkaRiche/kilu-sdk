/**
 * LangGraph Approval Gate — Runner
 * 
 * Simulates a LangGraph agent with 3 tool calls that pass through
 * a KiLu authority gate. Demonstrates how KiLu complements
 * LangGraph's human-in-the-loop without replacing it.
 * 
 * Flow:
 *   Agent proposes tool call
 *     → KiLu evaluates policy
 *       → ALLOW: execute immediately
 *       → REQUIRE_CONFIRM: trigger LangGraph interrupt()
 *       → BLOCK: reject, no execution
 * 
 * Usage: npm run dev
 */

import { evaluateToolProposal, type ToolProposal } from "./kilu-gate-node.js";

// ─────────────────────────────────────────────
// Simulated tool implementations
// ─────────────────────────────────────────────

function searchWeb(args: Record<string, any>): string {
    return `[mock] Search results for "${args.query}": 3 relevant documents found.`;
}

function sendInvoice(args: Record<string, any>): string {
    return `[mock] Invoice #${args.invoice_id} sent to ${args.recipient}.`;
}

function dropTable(args: Record<string, any>): string {
    return `[mock] Table "${args.table}" dropped.`;
}

// ─────────────────────────────────────────────
// Simulated LangGraph agent flow
// ─────────────────────────────────────────────

function simulateAgentFlow() {
    console.log("═".repeat(64));
    console.log("  KiLu + LangGraph — Authority Gate Demo");
    console.log("═".repeat(64));
    console.log();
    console.log("  KiLu sits inside the LangGraph execution flow.");
    console.log("  It does NOT replace LangGraph's interrupt() mechanism.");
    console.log("  It provides the POLICY DECISION that drives interrupt behavior.");
    console.log();
    console.log("  LangGraph decides WHEN to ask → KiLu decides WHAT the answer is.");
    console.log();
    console.log("─".repeat(64));

    // Define 3 tool proposals the agent wants to execute
    const proposals: Array<{ proposal: ToolProposal; executor: (args: Record<string, any>) => string; label: string }> = [
        {
            label: "🔍 Scenario 1: search_web (low-risk)",
            proposal: {
                toolName: "search_web",
                args: { query: "KiLu SDK documentation" },
                kiluAction: "web.search",
            },
            executor: searchWeb,
        },
        {
            label: "📄 Scenario 2: send_invoice (medium-risk)",
            proposal: {
                toolName: "send_invoice",
                args: { invoice_id: "INV-2024-0042", recipient: "finance@acme.com", amount: 15000 },
                kiluAction: "invoice.send",
            },
            executor: sendInvoice,
        },
        {
            label: "🗑️  Scenario 3: drop_table (high-risk)",
            proposal: {
                toolName: "drop_table",
                args: { table: "production_users" },
                kiluAction: "database.drop",
            },
            executor: dropTable,
        },
    ];

    // Run each proposal through the KiLu gate
    for (const { label, proposal, executor } of proposals) {
        console.log(`\n${label}`);
        console.log(`  ├─ Agent proposes: ${proposal.toolName}(${JSON.stringify(proposal.args)})`);
        console.log(`  ├─ KiLu action:   ${proposal.kiluAction}`);

        const result = evaluateToolProposal(proposal, executor);

        console.log(`  ├─ KiLu outcome:  ${result.decision.outcome}${result.decision.reason ? ` — ${result.decision.reason}` : ""}`);
        console.log(`  ├─ Decision ID:   ${result.decision.decisionId}`);
        console.log(`  ├─ Executed:      ${result.executed}`);
        console.log(`  └─ Output:        ${result.output}`);

        // Show what LangGraph would do with this decision
        switch (result.decision.outcome) {
            case "ALLOW":
                console.log(`       → LangGraph: continue execution normally`);
                break;
            case "REQUIRE_CONFIRM":
                console.log(`       → LangGraph: call interrupt({ decision }) → pause graph → wait for human`);
                break;
            case "BLOCK":
                console.log(`       → LangGraph: skip tool node → return error to agent`);
                break;
        }

        console.log("─".repeat(64));
    }

    // Summary
    console.log();
    console.log("═".repeat(64));
    console.log("  Summary");
    console.log("═".repeat(64));
    console.log();
    console.log("  search_web   → ALLOW            → executed immediately");
    console.log("  send_invoice → REQUIRE_CONFIRM  → LangGraph interrupt() triggered");
    console.log("  drop_table   → BLOCK            → rejected, no execution");
    console.log();
    console.log("  Without KiLu:");
    console.log("    LangGraph can pause (interrupt), but has no policy engine.");
    console.log("    Approval decisions rely on prompting or hardcoded logic.");
    console.log();
    console.log("  With KiLu:");
    console.log("    LangGraph interrupt() is DRIVEN by KiLu policy decisions.");
    console.log("    Approval is deterministic, auditable, and model-agnostic.");
    console.log("═".repeat(64));
}

simulateAgentFlow();
