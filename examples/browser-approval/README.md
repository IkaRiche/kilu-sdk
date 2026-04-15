# Browser Approval

Require KiLu authorization before browser agent actions.

## Problem

Browser agents (Playwright, Puppeteer, browser-use) can click buttons,
submit forms, and navigate without any authorization check.

Without an authority layer:

```
Agent decides to click → click happens → consequences are irreversible
```

The agent reasons about what to do and then does it.
There is nothing between intent and execution.

This means:
- **A hallucinated action executes** — model clicks wrong button
- **A prompt injection takes effect** — adversarial page content triggers an action
- **A high-risk action goes unreviewed** — payment confirmed, account deleted

## What KiLu does

KiLu inserts an authority check before every browser action:

```
Agent proposes action → KiLu evaluates → ALLOW / REQUIRE_CONFIRM / BLOCK → Execute / Stop
```

Low-risk actions pass through. High-risk actions require approval.
Dangerous actions are blocked before the browser ever acts.

## Without KiLu / With KiLu

### Without KiLu

```ts
// Browser agent — no authority layer
async function agentStep(page: Page, action: AgentAction) {
  await page.click(action.selector);  // no gate, no audit, no review
}
```

- ❌ Every click executes immediately
- ❌ No distinction between "read page" and "delete account"
- ❌ No audit trail of what was authorized

### With KiLu

```ts
async function agentStep(page: Page, action: AgentAction) {
  const gate = beforeAction({
    type: "click",
    target: action.selector,
    url: page.url(),
  });

  switch (gate.decision.outcome) {
    case "ALLOW":
      await page.click(action.selector);
      break;
    case "REQUIRE_CONFIRM":
      // surface to human for review
      await showApprovalUI(gate.decision);
      break;
    case "BLOCK":
      console.log(`Blocked: ${gate.decision.reason}`);
      break;
  }
}
```

- ✅ Safe navigation passes through
- ✅ Financial actions require human confirmation
- ✅ Destructive actions are blocked
- ✅ Every decision has an auditable ID

**Integration diff: wrap action calls with `beforeAction()` — 5–8 lines.**

## Run

```bash
cd examples/browser-approval
npm install
npm run dev
```

No real browser required. The example simulates browser agent actions
and shows KiLu decisions. In production, each action wraps a real
Playwright call.

## Expected outcomes

| Action | Target | KiLu Outcome | Result |
|--------|--------|-------------|--------|
| Navigate | `https://store.example.com` | `ALLOW` | Page opens |
| Click | `#add-to-cart` | `ALLOW` | Item added |
| Click | `#confirm-purchase` | `REQUIRE_CONFIRM` | Paused for approval |
| Click | `#delete-account` | `BLOCK` | Rejected |

## Architecture

```
Browser Agent
  │
  ├── navigate(store)        → KiLu → ALLOW            → ✅ page opens
  ├── click(#add-to-cart)    → KiLu → ALLOW            → ✅ item added
  ├── click(#confirm-purchase) → KiLu → REQUIRE_CONFIRM → ⏸️ human reviews
  └── click(#delete-account) → KiLu → BLOCK            → 🚫 not executed
```

## Swap mock for real KiLu

In `src/kilu-mock.ts`, replace:

```ts
const decision = mockAuthorize(intent);
```

With:

```ts
import { KiluClient } from "@kilu/sdk";

const client = new KiluClient({
  baseUrl: process.env.KILU_BASE_URL!,
  apiKey: process.env.KILU_API_KEY!,
});

const decision = await client.submitIntent(intent);
```
