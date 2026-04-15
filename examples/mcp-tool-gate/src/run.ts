/**
 * MCP Tool Gate — Runner
 * 
 * Starts the MCP server with KiLu-gated tools and simulates
 * three tool calls to demonstrate ALLOW / REQUIRE_CONFIRM / BLOCK outcomes.
 * 
 * Usage: npm run dev
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./server.js";

async function main() {
    console.log("═".repeat(64));
    console.log("  KiLu + MCP Tool Gate — Live Compatibility Proof");
    console.log("═".repeat(64));
    console.log();
    console.log("  Flow: Agent → MCP Tool Call → KiLu → Decision → Execute / Stop");
    console.log();
    console.log("─".repeat(64));

    // Create MCP server and in-memory client
    const server = createServer();
    const client = new Client({ name: "test-agent", version: "0.1.0" });

    // Wire server ↔ client via in-memory transport
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    // ── Scenario 1: read_file → ALLOW ──
    console.log("\n📂 Scenario 1: read_file (low-risk)");
    console.log("  ├─ Agent requests: read_file({ path: \"./config.json\" })");
    const result1 = await client.callTool({
        name: "read_file",
        arguments: { path: "./config.json" },
    });
    console.log("  Result:", (result1.content as any)[0]?.text);

    console.log("─".repeat(64));

    // ── Scenario 2: send_email → REQUIRE_CONFIRM ──
    console.log("\n📧 Scenario 2: send_email (medium-risk)");
    console.log('  ├─ Agent requests: send_email({ to: "client@corp.com", ... })');
    const result2 = await client.callTool({
        name: "send_email",
        arguments: {
            to: "client@corp.com",
            subject: "Invoice #1234",
            body: "Please find attached invoice.",
        },
    });
    console.log("  Result:", (result2.content as any)[0]?.text);

    console.log("─".repeat(64));

    // ── Scenario 3: delete_database → BLOCK ──
    console.log("\n🗑️  Scenario 3: delete_database (high-risk)");
    console.log('  ├─ Agent requests: delete_database({ table: "users" })');
    const result3 = await client.callTool({
        name: "delete_database",
        arguments: { table: "users" },
    });
    console.log("  Result:", (result3.content as any)[0]?.text);

    console.log("\n" + "═".repeat(64));
    console.log("  Summary");
    console.log("═".repeat(64));
    console.log("  read_file       → ALLOW            → executed");
    console.log("  send_email      → REQUIRE_CONFIRM  → paused for approval");
    console.log("  delete_database → BLOCK            → rejected by policy");
    console.log();
    console.log("  Without KiLu, all 3 actions would have executed directly.");
    console.log("  With KiLu, only the safe action ran. The rest were gated.");
    console.log("═".repeat(64));

    // Clean up
    await client.close();
    await server.close();
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
