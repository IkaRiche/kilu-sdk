/**
 * Kilu SDK Integration Example
 * 
 * Demonstrates the basic flow for:
 * 1. Getting Moltbook Identity token
 * 2. Submitting intent to KiLU Authority
 * 3. Handling authorization result
 * 
 * Usage: bun run examples/basic-flow.ts
 * 
 * Environment variables:
 *   MOLTBOOK_API_KEY - Your Moltbook API key
 *   AUTHORITY_URL - KiLU Authority URL (default: https://authority.kilu.network)
 */

import { KiluClient, generateIdentityToken } from "../src/index";

const AUTHORITY_URL = process.env.AUTHORITY_URL || "https://authority.kilu.network";
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;

async function main() {
    console.log("═".repeat(60));
    console.log("       KILU SDK v0.1.0 - Integration Example");
    console.log("═".repeat(60));

    if (!MOLTBOOK_API_KEY) {
        console.log("\n⚠️  MOLTBOOK_API_KEY not set");
        console.log("   Set environment variable: export MOLTBOOK_API_KEY=your_key\n");
        process.exit(1);
    }

    try {
        // 1. Get Moltbook identity token
        console.log("\n📋 Getting Moltbook Identity Token...");
        const tokenResult = await generateIdentityToken(
            MOLTBOOK_API_KEY,
            "authority.kilu.network"
        );

        if (!tokenResult.success || !tokenResult.identity_token) {
            console.error("❌ Failed to get identity token:", tokenResult.error);
            return;
        }

        console.log("✅ Got identity token");
        console.log("   Expires in:", tokenResult.expires_in, "seconds");

        // 2. Initialize Kilu client
        const client = new KiluClient({
            apiUrl: AUTHORITY_URL
        });

        // Set Moltbook identity (Bearer token)
        client.setMoltIdentity(tokenResult.identity_token);
        console.log("✅ Client initialized with Moltbook Identity");

        // 3. Submit intent for authorization
        console.log("\n📤 Submitting Intent for Authorization...");
        const result = await client.submitIntent({
            action: "payment",
            target: "stripe_api",
            amount: 100,
            currency: "EUR"
        });

        console.log("\n✅ Authorization Result:");
        console.log("   Decision:", result.decision);

        if (result.receipt) {
            console.log("   Intent Hash:", result.receipt.intent_hash.slice(0, 32) + "...");
            console.log("   Timestamp:", new Date(result.receipt.timestamp * 1000).toISOString());
        }

        if (result.reason) {
            console.log("   Reason:", result.reason);
        }

        console.log("\n🎉 Flow Complete!");

    } catch (err: any) {
        console.error("\n❌ Error:", err.message || err);
    }
}

main().catch(console.error);
