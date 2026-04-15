/**
 * MCP Server with KiLu Authority Gate
 * 
 * Demonstrates how to wrap MCP tool handlers with a KiLu authority check.
 * Every tool call passes through KiLu before execution.
 * 
 * Flow: Agent → MCP Tool Call → KiLu Gate → ALLOW / REQUIRE_CONFIRM / BLOCK → Execute / Stop
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockAuthorize, type KiluIntent, type KiluDecision } from "./kilu-mock.js";

// ─────────────────────────────────────────────
// KiLu Gate Wrapper
// ─────────────────────────────────────────────

/**
 * Wraps an MCP tool handler with KiLu authorization.
 * 
 * WITHOUT KiLu (fail-open):
 *   server.tool("send_email", schema, async (args) => {
 *     return sendEmail(args);  // no approval, no audit
 *   });
 * 
 * WITH KiLu:
 *   server.tool("send_email", schema, withKiluGate(
 *     { actor: "agent:mcp", action: "email.send" },
 *     async (args) => { return sendEmail(args); }
 *   ));
 */
function withKiluGate<TArgs extends Record<string, unknown>>(
    intentBase: { actor: string; action: string },
    handler: (args: TArgs) => Promise<{ content: Array<{ type: string; text: string }> }>
) {
    return async (args: TArgs) => {
        // Build intent from tool call
        const intent: KiluIntent = {
            actor: intentBase.actor,
            action: intentBase.action,
            target: JSON.stringify(args),
            context: { source: "mcp-tool-call" },
        };

        // ── KiLu authority check ──
        // Replace with: const decision = await client.submitIntent(intent);
        const decision: KiluDecision = mockAuthorize(intent);

        console.log(`  ├─ KiLu decision: ${decision.outcome}${decision.reason ? ` (${decision.reason})` : ""}`);
        console.log(`  ├─ Decision ID:   ${decision.decisionId}`);

        switch (decision.outcome) {
            case "ALLOW":
                console.log(`  └─ ✅ Executing tool\n`);
                return handler(args);

            case "REQUIRE_CONFIRM":
                console.log(`  └─ ⏸️  Awaiting human confirmation\n`);
                return {
                    content: [{
                        type: "text" as const,
                        text: `⏸️ Action requires human confirmation.\nReason: ${decision.reason}\nApproval ID: ${decision.decisionId}\n\nAction was NOT executed. Forward this approval ID to a human reviewer.`,
                    }],
                };

            case "BLOCK":
                console.log(`  └─ 🚫 Blocked by policy\n`);
                return {
                    content: [{
                        type: "text" as const,
                        text: `🚫 Action blocked by KiLu authority.\nReason: ${decision.reason}\nDecision ID: ${decision.decisionId}\n\nThis action is not permitted under current policy.`,
                    }],
                };
        }
    };
}

// ─────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────

export function createServer(): McpServer {
    const server = new McpServer({
        name: "kilu-gated-tools",
        version: "0.1.0",
    });

    // ── Tool 1: read_file (low-risk → ALLOW) ──
    server.tool(
        "read_file",
        "Read file contents from the workspace",
        { path: z.string().describe("File path to read") },
        withKiluGate(
            { actor: "agent:mcp", action: "file.read" },
            async (args) => ({
                content: [{ type: "text", text: `[mock] Contents of ${args.path}: Hello, world!` }],
            })
        )
    );

    // ── Tool 2: send_email (medium-risk → REQUIRE_CONFIRM) ──
    server.tool(
        "send_email",
        "Send an email to a recipient",
        {
            to: z.string().describe("Recipient email"),
            subject: z.string().describe("Email subject"),
            body: z.string().describe("Email body"),
        },
        withKiluGate(
            { actor: "agent:mcp", action: "email.send" },
            async (args) => ({
                content: [{ type: "text", text: `[mock] Email sent to ${args.to}: ${args.subject}` }],
            })
        )
    );

    // ── Tool 3: delete_database (high-risk → BLOCK) ──
    server.tool(
        "delete_database",
        "Drop a database table",
        { table: z.string().describe("Table name to drop") },
        withKiluGate(
            { actor: "agent:mcp", action: "database.drop" },
            async (args) => ({
                content: [{ type: "text", text: `[mock] Dropped table ${args.table}` }],
            })
        )
    );

    return server;
}
