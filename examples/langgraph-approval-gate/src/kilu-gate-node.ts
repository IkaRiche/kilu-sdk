/**
 * KiLu Gate Node for LangGraph
 * 
 * This module provides a KiLu authority gate that integrates with LangGraph's
 * execution flow. It evaluates proposed tool calls and routes them to:
 * 
 *   ALLOW            → execute the tool immediately
 *   REQUIRE_CONFIRM  → use LangGraph interrupt() to pause for human approval
 *   BLOCK            → reject the action, skip execution
 * 
 * Key difference from LangGraph's built-in HITL:
 * 
 *   LangGraph interrupt() pauses execution and asks "should I continue?"
 *   KiLu answers WHY — based on deterministic policy, not model judgment.
 *   LangGraph decides WHEN to ask. KiLu decides WHAT the answer is.
 */

import { mockAuthorize, type KiluIntent, type KiluDecision } from "./kilu-mock.js";

export interface ToolProposal {
    toolName: string;
    args: Record<string, any>;
    kiluAction: string;
}

export interface GateResult {
    decision: KiluDecision;
    executed: boolean;
    output?: string;
}

/**
 * Evaluate a proposed tool call through KiLu and return the gate result.
 * 
 * This function is designed to be called inside a LangGraph node.
 * In a real integration:
 *   - REQUIRE_CONFIRM would trigger LangGraph's interrupt() for human review
 *   - ALLOW would let the tool execute inline
 *   - BLOCK would terminate the tool path
 * 
 * Replace mockAuthorize() with: await client.submitIntent(intent)
 */
export function evaluateToolProposal(
    proposal: ToolProposal,
    executor: (args: Record<string, any>) => string
): GateResult {
    const intent: KiluIntent = {
        actor: "agent:langgraph",
        action: proposal.kiluAction,
        target: proposal.toolName,
        context: {
            args: proposal.args,
            source: "langgraph-tool-node",
        },
    };

    // ── KiLu authority check ──
    // Replace with: const decision = await client.submitIntent(intent);
    const decision = mockAuthorize(intent);

    switch (decision.outcome) {
        case "ALLOW":
            return {
                decision,
                executed: true,
                output: executor(proposal.args),
            };

        case "REQUIRE_CONFIRM":
            // In a real LangGraph integration, this is where you'd call:
            //   const approval = interrupt({ proposal, decision });
            // For this demo, we simulate the pause
            return {
                decision,
                executed: false,
                output: `⏸️ Paused for human approval. Decision ID: ${decision.decisionId}`,
            };

        case "BLOCK":
            return {
                decision,
                executed: false,
                output: `🚫 Blocked: ${decision.reason}`,
            };
    }
}
