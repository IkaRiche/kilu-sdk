# KiLu SDK

**Authority for autonomous execution.**

KiLu SDK adds an authority layer between an AI agent and real execution.

It does not replace your model, planner, or agent framework.  
It sits between **intent** and **execution**.

## Why KiLu

Modern agents can reason well enough to be useful.  
The real problem is not reasoning anymore. The real problem is **execution authority**.

Most agent stacks still look like this:

`Model -> Tool / API / UI -> Execute`

KiLu enforces a safer pattern:

`Model -> Proposed Action -> KiLu -> ALLOW / REQUIRE_CONFIRM / BLOCK -> Execute`

That means your model can propose actions, but it does **not** authorize itself to act.

## What KiLu gives you

For every proposed action, KiLu returns one of three outcomes:

- `ALLOW`
- `REQUIRE_CONFIRM`
- `BLOCK`

This lets you keep reasoning flexible while making execution:

- governed
- bounded
- auditable
- model-agnostic

## Use KiLu when...

Use KiLu if your agent currently:

- calls tools directly
- clicks or browses without approval
- executes shell commands without a policy gate
- performs API mutations without human confirmation
- lacks verifiable authorization records
- mixes reasoning with execution authority

KiLu is especially useful for:

- MCP tool gating
- browser agents
- shell / infra agents
- approval-heavy workflows
- high-risk API actions
- regulated or auditable agent systems

## Not another agent framework

KiLu is **not**:

- a chat agent
- a planner
- a browser automation framework
- a workflow builder
- a general-purpose orchestration platform

KiLu is the **authority layer** for autonomous execution.

## 60-second example

```ts
import { KiLuClient } from "@kilu/sdk";

const kilu = new KiLuClient({
  baseUrl: process.env.KILU_BASE_URL!,
  apiKey: process.env.KILU_API_KEY!,
});

const decision = await kilu.submitIntent({
  actor: "agent:browser",
  action: "browser.click",
  target: "button#confirm-transfer",
  context: {
    session_id: "sess_123",
    risk_level: "high",
    environment: "production",
  },
});

switch (decision.outcome) {
  case "ALLOW":
    // execute action
    break;

  case "REQUIRE_CONFIRM":
    // show approval flow
    break;

  case "BLOCK":
    // stop execution and log
    break;
}
```

## Core idea

KiLu separates **cognition** from **action**.

Your model may generate:

* plans
* tool requests
* browser actions
* shell commands
* API mutations

KiLu determines whether those actions may be:

* executed immediately
* escalated for human confirmation
* blocked before execution

## Design principles

### 1. Reasoning is not authority

A model can propose an action.
It should not directly grant itself the right to execute it.

### 2. Human approval is first-class

Some actions should never execute without explicit confirmation.

### 3. Execution is bounded

Authorization should be constrained by policy, scope, and context.

### 4. Records matter

A useful authority layer should produce durable, auditable decisions.

### 5. Models are replaceable

Today you may use hosted reasoning APIs.
Tomorrow you may use local models.
KiLu stays in the same place in the control path.

## Security model

KiLu is designed around a simple trust boundary:

* the LLM is a reasoning component
* KiLu is the authority layer
* execution happens only after an explicit decision
* sensitive actions can require human confirmation
* reasoning engines remain replaceable without redesigning control

In other words:

**Agents decide. KiLu authorizes.**

## Example integrations

This repository includes focused examples for common pain points:

* [`examples/mcp-tool-gate`](./examples/mcp-tool-gate)
  Put an authority gate in front of MCP tool calls.

* [`examples/langgraph-approval-gate`](./examples/langgraph-approval-gate)
  Add policy-driven approval to LangGraph tool execution.

* [`examples/browser-approval`](./examples/browser-approval)
  Require approval before high-risk browser actions.

See [`examples/README.md`](./examples/README.md) for the full list.

## Typical outcomes

### ALLOW

Low-risk action within policy.

Examples:

* read-only tool calls
* safe internal navigation
* low-risk API reads

### REQUIRE_CONFIRM

Action may be valid, but requires explicit human approval.

Examples:

* browser checkout or payment confirmation
* outbound email send
* production API mutation
* deployment actions
* shell operations with side effects

### BLOCK

Action is not admissible under the current policy.

Examples:

* dangerous shell commands
* forbidden external exfiltration
* policy-violating browser actions
* out-of-scope API mutations

## Minimal API shape

The SDK centers around one idea: submit a proposed action and receive a decision.

```ts
type KiLuDecision =
  | { outcome: "ALLOW"; decisionId: string }
  | { outcome: "REQUIRE_CONFIRM"; decisionId: string; reason?: string }
  | { outcome: "BLOCK"; decisionId: string; reason?: string };

await client.submitIntent({
  actor: "agent:shell",
  action: "shell.exec",
  target: "rm -rf /tmp/cache",
  context: {
    working_directory: "/srv/app",
    environment: "production",
  },
});
```

## Installation

```bash
npm install @kilu/sdk
```

## Environment

```bash
KILU_BASE_URL=https://your-kilu-control-plane.example
KILU_API_KEY=your_api_key
```

## Quickstart

1. Install the SDK
2. Create a `KiLuClient`
3. Wrap one high-risk action behind `submitIntent()`
4. Handle `ALLOW / REQUIRE_CONFIRM / BLOCK`
5. Expand coverage gradually across your execution surface

If you are evaluating KiLu, start with one of these:

* browser click confirmation
* shell command guard
* MCP tool approval
* external API mutation gate

## Who this is for

KiLu is a good fit if you are building:

* agentic SaaS
* browser agents
* internal automation with side effects
* enterprise copilots with approval paths
* infra / DevOps agents
* financial or regulated workflows
* systems where observability alone is too late

## Why this matters now

The ecosystem is rapidly improving agent reasoning.

The missing layer is **controlled execution**.

Approval flows, audit trails, and post-hoc logs are useful, but they are not the same as an authority layer that decides whether execution may occur **before** it happens.

That is the role KiLu is designed to fill.

## Repository structure

```text
.
├── src/
├── examples/
│   ├── mcp-tool-gate/
│   ├── langgraph-approval-gate/
│   └── browser-approval/
├── docs/
│   └── why-kilu.md
└── README.md
```

## Current status

Early SDK, focused on the execution-authority pattern.

Near-term priorities:

* stable core client surface
* sharper examples
* stronger approval-path demos
* clearer integration docs
* more concrete framework adapters

## Docs

* [`docs/why-kilu.md`](./docs/why-kilu.md)
* [`examples/README.md`](./examples/README.md)

## Positioning in one line

**KiLu is the authority layer for autonomous execution.**

## License

TBD
