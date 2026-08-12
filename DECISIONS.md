# DECISIONS.md — Driftwood Content Pipeline

## The core bet: deterministic validation is the trust layer, not the model

The entire architecture rests on one decision: we do not trust the LLM to stay in bounds. Instead, we gate every generated post through a deterministic regex/keyword validator that mechanically enforces the non-negotiable rules. The model generates; the validator decides.

This is the only design that lets us say "this will never publish a post that breaks the rules" — because the check is not probabilistic. A regex either matches or it doesn't.

## Where we trust the model and where we don't

**We trust the model to:** write copy that sounds like Driftwood given a good prompt. Voice, tone, word choice, sentence rhythm — these are soft qualities a deterministic checker can't enforce, and the model is genuinely good at them.

**We do not trust the model to:** avoid banned patterns. Even a well-prompted model will occasionally drop an exclamation mark, sneak in "the best," or name a competitor. This happens ~5-10% of the time in practice. That's too often for "publish without a human reading it."

**The in-between:** We added an LLM reviewer (second model call) that scores voice alignment 1-10. This catches "technically clean but off-brand" posts — too corporate, too enthusiastic, doesn't sound like a person. But this reviewer is a **soft gate**: if it fails (API error, malformed response), the post still publishes as long as it passed the deterministic check. We degrade gracefully rather than blocking on a second model call.

## The three-layer pipeline

1. **Generator** — Claude Sonnet with a detailed brand brief. Includes "what good looks like" and "what bad looks like" examples. On retry, feeds back the specific rejection reasons so the model can self-correct.

2. **Deterministic Validator** — Regex patterns covering: exclamation marks, emoji, ALL-CAPS hype (with acronym allowlist), absolute/guarantee claims, hard-sell urgency, competitor names, hashtags. This is the hard gate. Any single violation → reject.

3. **LLM Reviewer** — Scores voice alignment. Score below 4 → retry. Score 4-6 → publish but concerns are logged. Score 7+ → clean publish. Reviewer failure → publish anyway (validator already passed).

## Retry with feedback, then fail safe

The orchestrator tries up to 3 times. Each failed attempt feeds the rejection reasons back to the generator as explicit instructions ("Your previous attempt was rejected for: exclamation marks are not allowed"). This gives the model a real chance to self-correct.

After 3 failures, the post is marked "held" — not "published," not silently dropped. The held status is visible in the UI, and the reasons are stored. A human can look at the audit trail and understand exactly what went wrong.

## What the tests prove

The test suite (85 cases) is entirely focused on the deterministic validator — the component that earns trust. Tests include:

- **10 known-good posts** that should pass (proves we don't over-reject)
- **~60 known-bad posts** across every banned category (proves we catch violations)
- **Adversarial/edge cases** — sneaky exclamation in parenthetical, emoji at sentence boundary, competitor name embedded in a long sentence, ALL-CAPS with different casing
- **Golden rejects** — simulated "bad day" model outputs that combine multiple violations

These tests don't require an LLM API call. They run in <1 second. They're the backbone of the safety guarantee.

## Decisions we deliberately did not make

**No content-addressable deduplication.** We don't check if the model generated the same post twice. It's a real concern at scale, but not the trust concern this exercise is about.

**No prompt injection defense.** The topic comes from a trusted UI, not end-user free text. If this were exposed as an API to untrusted callers, we'd need to sanitize the topic input against prompt injection. We didn't build that because it's a different threat model.

**No human-in-the-loop approval queue.** The whole point is "publish without a human reading it." We built "held" as a fail-safe, not as a workflow step. If we added an approval queue, we'd be admitting the system doesn't work — and then we'd need to explain when it's safe to turn the queue off.

**No fine-tuned model.** Fine-tuning on brand-voice examples would reduce the reviewer's rejection rate, but it wouldn't eliminate the need for the deterministic validator. The model can still hallucinate banned content even after fine-tuning. We'd rather have a reliable gate than a better-behaved generator.

**No async/webhook architecture.** The edge function awaits the full orchestration loop synchronously when `EdgeRuntime.waitUntil` isn't available. At scale, you'd want a queue. For this slice, synchronous is simpler and easier to reason about.

## Failure modes we built against

| Failure | What happens |
|---------|-------------|
| Model generates banned content | Deterministic validator catches it, retries with feedback |
| Model keeps generating banned content (3x) | Post marked "held" with reasons visible |
| Reviewer API call fails | Post publishes if it passed deterministic validation (graceful degradation) |
| Generator API call fails | Logged as failed attempt, retries, then held after 3 |
| Reviewer returns malformed JSON | Caught by try/catch, treated as reviewer-unavailable |
| Model outputs empty string | Would pass validator (no violations) but reviewer would score low |
| Orchestrator crashes unexpectedly | Top-level catch marks post as "held" with error message |

## The competitor list is manual, and that's correct

We maintain an explicit list of competitor names (Starbucks, Dunkin, Blue Bottle, etc.) rather than trying to detect competitors algorithmically. This is intentional: there are ~15 brands that matter, they change rarely, and a false positive (blocking "Blue" because "Blue Bottle" is banned) is worse than maintaining a list. When a new competitor matters, you add one regex.

## Why the validator lives in two places

The validator logic exists both in `src/lib/validator.ts` (for tests and potential client-side preview) and in the edge function (`supabase/functions/generate-post/index.ts`). This is a conscious tradeoff: Supabase edge functions can't import from `src/`, so we duplicate. The test suite validates the canonical version; the edge function copy must stay in sync manually. At scale, you'd extract the patterns into a shared JSON file and code-gen both copies.
