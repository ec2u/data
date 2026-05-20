---
title: OpenAI → Gemini Migration
summary: Delivered state of the migration from the OpenAI backend to Google Gemini
description: Record of what was delivered for the OpenAI → Gemini migration, plus outstanding work and rollback.
---

# OpenAI → Gemini Migration

## Status

Delivered to branch `feature/gemini`; `mvn compile` is green. Gemini is now the wired AI
provider; the `eu.ec2u.work.ai.open` package and the `flow-openai` dependency are left intact
as a fallback.

## Delivered

- New package `eu.ec2u.work.ai.gemini`, mirroring `open` 1:1 and reusing the generic
  `eu.ec2u.work.Throttle`:
  - `Gemini` — client wrapper with adaptive retry
  - `GeminiAnalyzer`, `GeminiEmbedder`, `GeminiTranslator` — `Analyzer` / `Embedder` /
    Metreeca `Translator` implementations
- Dependency `com.google.genai:google-genai:1.53.0`, version pinned (not in the
  `com.metreeca:flow` BOM).
- `Data.java` rewired: `gemini()` service (key `gemini-key`, 60 s timeout); models
  `gemini-2.5-flash-lite` (analyzer + translator — cheapest GA tier) and
  `gemini-embedding-001` (embedder); `Data::chat` / `Data::embedding` replaced by
  `Data::generate` (seed 0, temperature 0, `maxOutputTokens` 4096, thinking disabled for
  cost).
- Structured output: `responseMimeType=application/json` plus `responseJsonSchema` populated
  from the analyzer schema string.
- Rate-limit handling: transient HTTP 429 backs off via the adaptive `Throttle`; permanent
  quota/billing 429 is detected from the flattened error message (`perday`, or the billing
  phrase without a `RetryInfo` `retrydelay`) and propagated immediately — mirrors the OpenAI
  `insufficient_quota` abort.

## Outstanding

- **Topic-embedding rebuild (blocks topic matching):** event ingestion itself uses no
  embeddings, but `Event.about` / `audience` match through `Taxonomies.Matcher`, which
  embeds the query *at runtime* with the current embedder and cosine-compares it against
  stored topic vectors. Those stored vectors (taxonomies `EC2U_EVENTS` /
  `EC2U_STAKEHOLDERS`, produced by `Topic` + `StoreEmbedder`) are still OpenAI
  `text-embedding-3-small` (1536-dim) — a different space from Gemini
  `gemini-embedding-001` (default 3072-dim; `Vector.cosine` throws on length mismatch).
  Regenerate the **topic taxonomy** embeddings with the Gemini embedder before relying on
  topic/audience tagging; event embeddings are not the issue. Deferred by request.
- **Prompt / schema re-validation:** the `responseJsonSchema` plumbing compiles, but
  behaviour against the live Gemini API is unverified. Specific concerns, all requiring
  manual before/after checks on representative inputs across the ~10 analyzer call sites
  (events, units, programs, courses, offerings, …) — there are no automated tests, matching
  the existing `open` package:
  - **Schema dialect:** the analyzer schemas were authored for OpenAI strict `json_schema`.
    Gemini's `responseJsonSchema` takes standard JSON Schema but ignores/rejects some
    keywords (`$ref`, `additionalProperties`, certain `format`s); confirm each schema is
    *enforced*, not silently dropped.
  - **Model downgrade:** `gemini-2.5-flash-lite` has lower reasoning capability than
    `gpt-4o-mini`; nuanced extraction quality may regress and needs side-by-side
    comparison.
  - **Prompt portability:** system prompts were tuned for OpenAI instruction-following;
    verify JSON-only adherence, field fidelity, and that no commentary leaks in.
  - **Translation:** `GeminiTranslator` has no schema — verify it retains full content
    (the prompt forbids abridging) and adds no preamble.
  - **Determinism:** `seed`/`temperature` are 0, but Gemini's determinism guarantees differ
    from OpenAI; confirm stable repeated outputs.
- **Throttle tuning:** parameters carried over from OpenAI verbatim (min 100 ms / max
  60 000 ms / buildup 1.10 / backoff 1.10 / recover 0.95); not yet tuned to Gemini's
  RPM/TPM limits.
- **Quota heuristic fragility:** detection is string-based on `ApiException.message()`
  because the SDK exposes no structured `error.details`; robust for the documented cases but
  will drift if Google rewords the messages.

## Enabler

Consumers depend on `Analyzer` / `Embedder` / `Translator`, never on provider types — the
abstraction is why the swap was confined to the new package plus `Data.java` wiring.

## Rollback

Revert the `Data.java` service wiring to the `eu.ec2u.work.ai.open` implementations; the
`open` package and `flow-openai` remain in place, so no other change is required.
