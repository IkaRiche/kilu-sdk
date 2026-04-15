# Why KiLu

## Reasoning is not authority

Modern LLMs can reason well enough to plan complex actions.
But reasoning ability does not equal execution authority.

A model that can explain *why* it should delete a database
should not be the same component that *authorizes* the deletion.

Today, most agent stacks look like this:

```
Model → Tool / API / Browser → Execute
```

The model decides **and** authorizes in the same step.
There is no independent check between intent and action.

## The missing layer

KiLu adds an authority layer between reasoning and execution:

```
Model → Proposed Action → KiLu → ALLOW / REQUIRE_CONFIRM / BLOCK → Execute
```

For every proposed action, KiLu evaluates it against a deterministic policy
and returns one of three outcomes:

- **ALLOW** — low-risk, within policy, execute immediately
- **REQUIRE_CONFIRM** — valid but requires human approval before execution
- **BLOCK** — not permissible under current policy, do not execute

## Why logs are too late

Many agent systems add logging after execution.
Some add guardrails that analyze actions post-hoc.

This creates a timeline problem:

```
1. Agent proposes action
2. Action executes              ← damage happens here
3. System logs the action       ← observation happens here
4. Alert fires                  ← response happens here
```

By the time you observe a dangerous action, it has already executed.
Logs tell you *what happened*. They do not prevent it from happening.

KiLu moves the decision point **before** execution:

```
1. Agent proposes action
2. KiLu evaluates policy        ← decision happens here
3. If ALLOW: execute
4. If REQUIRE_CONFIRM: pause for human
5. If BLOCK: reject
```

The action only executes after explicit authorization.

## Why this layer is model-agnostic

KiLu does not know or care which model generated the action proposal.

- GPT-4, Claude, Gemini, local models — all produce the same type of output: proposed actions
- KiLu evaluates the *action*, not the *reasoning*
- If you swap models, KiLu stays in the same place in the control path

This means your security and authorization posture does not change
when you change your reasoning engine.

## Comparison

| Approach | What it does | Limitation |
|----------|-------------|------------|
| **Prompt guardrails** | Ask the model to self-restrict | Model can be jailbroken; no enforcement |
| **HITL (interrupt)** | Pause and ask a human | No policy engine; all or nothing |
| **RBAC** | Role-based access to APIs | Static; no action-level context |
| **Post-hoc logging** | Record what happened | Damage already done |
| **KiLu** | Deterministic policy gate before execution | Requires integration |

KiLu is complementary to all of the above.
It does not replace your RBAC, your logging, or your model guardrails.
It adds the layer that decides whether execution may occur **before** it happens.

## One sentence

**Agents decide. KiLu authorizes.**
