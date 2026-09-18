---
title: Gemini Model Comparison
summary: Price, capacity and positioning of the Gemini models, with selection guidance for the pipeline tasks.
description: |
  Reference for choosing the Gemini model a pipeline task runs on, comparing the current offering on price, capacity
  and intended workload, and listing the levers that move the bill.
---

# Overview

A task binding the Gemini client names the model it runs on, and that choice settles both the quality of its output and
the size of the bill. This document compares the current offering so that a task states a deliberate model rather than
inheriting whichever one the neighbouring module happens to use.

Prices are USD per million tokens on the paid tier, as published at
[Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing). Capacities are token limits, as published at
[Gemini models](https://ai.google.dev/gemini-api/docs/models). Both move: verify against the source before committing to
a figure that matters.

> [!WARNING]
> The price table in `_gemini-cost.ts` covers the 2.x generation only, and its `gemini-2.5-flash` row still carries the
> preview rates rather than the current ones. A task running on a 3.x model is costed at `gemini-2.5-flash` rates, so
> every reported figure for it is wrong. Add a row before trusting a cost estimate.

# Text Models

## Flash-Lite

The cheapest tier, and the one built for the work the pipeline does most: reading one page and returning the properties
it states.

| Model                   | Status | Input | Output | Context  | Suited to                                                        |
|-------------------------|--------|-------|--------|----------|------------------------------------------------------------------|
| `gemini-3.5-flash-lite` | stable | $0.30 | $2.50  | 1M / 64k | high-throughput subagent tasks and document parsing              |
| `gemini-3.1-flash-lite` | stable | $0.25 | $1.50  | 1M / 64k | translation, transcription, data extraction, document processing |
| `gemini-2.5-flash-lite` | stable | $0.10 | $0.40  | 1M / 64k | the cheapest option, at a generation's remove from the rest      |

## Flash

The general-purpose tier, worth its premium where a task reasons over what it reads rather than transcribing it.

| Model              | Status | Input  | Output | Context  | Suited to                                                       |
|--------------------|--------|--------|--------|----------|-----------------------------------------------------------------|
| `gemini-3.8-flash` | stable | $0.75¹ | $3.75¹ | 1M / 64k | long-horizon agents, software engineering, enterprise workflows |
| `gemini-3.7-flash` | stable | $0.75¹ | $3.75¹ | 1M / 64k | the preceding generation, kept for pinned deployments           |
| `gemini-3.6-flash` | stable | $0.75¹ | $3.75¹ | 1M / 64k | frontier-level reasoning at speed, rapid agentic loops          |
| `gemini-3.5-flash` | stable | $1.50  | $9.00  | 1M / 64k | high-throughput work, superseded on price by 3.6 and later      |
| `gemini-2.5-flash` | stable | $0.30  | $2.50  | 1M / 64k | the generation the pipeline tasks currently run on              |

## Pro

The reasoning tier, priced for depth rather than volume. Both models charge a higher rate above 200k input tokens.

| Model                    | Status  | Input (≤200k) | Output (≤200k) | Input (>200k) | Output (>200k) | Caching        |
|--------------------------|---------|---------------|----------------|---------------|----------------|----------------|
| `gemini-3.1-pro-preview` | preview | $2.00         | $12.00         | $4.00         | $18.00         | $0.20 / $0.40  |
| `gemini-2.5-pro`         | stable  | $1.25         | $10.00         | $2.50         | $15.00         | $0.125 / $0.25 |

## Embeddings

| Model                        | Status  | Text  | Images | Audio | Video  |
|------------------------------|---------|-------|--------|-------|--------|
| `gemini-embedding-2-preview` | preview | $0.20 | $0.45  | $6.50 | $12.00 |
| `gemini-embedding-001`       | stable  | $0.15 | n/a    | n/a   | n/a    |

# Selecting a Model

- **Extraction and translation over feed pages**: `gemini-3.5-flash-lite`, which Google positions for document parsing
  and prices exactly where `gemini-2.5-flash` sits today, so a task moves up a generation at no extra cost.
- **Bulk work where cost dominates and the reading is shallow**: `gemini-3.1-flash-lite`, cheaper again and aimed at
  data extraction, at the price of the reasoning depth relative dates and closed vocabularies draw on.
- **Tasks reasoning over what they read**: a 3.x Flash model, where the premium buys judgement the Lite tier does not
  reliably supply.
- **Tasks driving tools through many turns**: a 3.x Flash model, both for the agentic positioning and because only
  generation 3 onwards accepts a response schema alongside tools. Earlier models reply in prose and pay for a second
  request converting it, as `createGoogleAI` documents.

# Cost Levers

- **Thinking level**: 3.x models think by default, at `medium` since 3.5 Flash, and thinking tokens bill as output.
  Classification and extraction are the tasks Google names for `minimal`, so a task left at the default pays for
  reasoning it does not use.
- **Batch mode**: halves both rates, at the cost of synchronous results. Suited to a full feed sync, not to a request a
  caller waits on.
- **Context caching**: charged per model at the rates above, and worth the bookkeeping only where a large prompt prefix
  repeats across requests.
- **Long context**: the Pro tier doubles its input rate above 200k tokens. A task feeding whole pages stays well under
  that, so the surcharge bites only on deliberately large prompts.

# Generation 3 Constraints

> [!IMPORTANT]
> `temperature`, `top_p` and `top_k` are no longer recommended on any 3.x model: the guidance is to remove them from
> every request, as the reasoning is tuned for the defaults. `candidate_count` is unsupported.

A task carrying `temperature: 0` for reproducibility loses that guarantee when it moves to a 3.x model, and any claim
its documentation makes about consistency across runs needs revisiting alongside the model change.

# Notes

¹ Promotional rate through 31 December 2026, doubling to $1.50 input and $7.50 output on 1 January 2027.

# Sources

- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [What's new in Gemini 3.5 Flash](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)
- [Gemini 3.6 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash)
