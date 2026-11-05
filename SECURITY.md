# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| 0.2.x   | ✅        |
| < 0.2   | ❌        |

## Reporting a Vulnerability

If you discover a security vulnerability in KiLu SDK, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@kilu.network**

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

## Scope

This policy covers:
- The `@kilu-control/sdk` npm package
- The control plane endpoint (`/v1/intent`)
- Ed25519 verification of legacy signed intent artifacts (not execution receipts)
- API key authentication

## Security Design

- **No LLM in the decision path**: Policy evaluation is deterministic
- **Artifact boundary**: A signature over a proposed intent is not an execution grant or post-execution receipt. Canonical grant/report/receipt checks are separate.
- **Bearer authentication**: API keys are validated server-side, never embedded in client code
- **Fail-closed**: Unknown actions default to `REQUIRE_CONFIRM`, not `ALLOW`
