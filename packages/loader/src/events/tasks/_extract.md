---
title: Events › Coimbra › University – Withheld Readings
summary: Diagnosis of the crash that aborts the Coimbra crawl on a page the model declines to render
description: Records why one Coimbra agenda page fails extraction with a JSON parse error, what the model actually
  answers, and what the extraction step has to do about it.
---

# Scope

Diagnosis of the crash aborting `src/events/pipes/coimbra-university.ts` on every run, observed against the
`https://content.fw.uc.pt/v1/agenda/events/search` crawl on 2026-09-15. No code was changed.

The failure surfaces as:

```
Error: malformed model response: Unexpected end of JSON input
    at json (src/_/muse-google/index.ts:736:9)
    at <anonymous> (src/events/tasks/extract.ts:124:7)
```

# Findings

## One page in 150 is withheld as recitation

All 150 event pages the crawl reaches were fetched and submitted to `gemini-3.5-flash-lite` under the production
prompt, schema and generation settings. Exactly one fails, and it fails identically on every attempt:

| Page                                                 | Title                                       | Outcome                    |
|------------------------------------------------------|---------------------------------------------|----------------------------|
| https://agenda.coimbra.pt/event/o8hnjcn20qym2l9n     | *José Afonso, ao Vivo nos Coliseus, 1983*   | `finishReason: RECITATION` |
| the other 149                                        | –                                           | `finishReason: STOP`       |

The response carries one candidate with `content: {}`, no `candidatesTokenCount` at all, and citation metadata naming
the source the output was held to be reciting:

```json
{
  "citations": [{
    "startIndex": 1228,
    "endIndex": 1527,
    "uri": "https://www.agenda-porto.pt/en/evento/jose-afonso-ao-vivo-nos-coliseus/",
    "license": ""
  }]
}
```

Three consecutive requests returned the same reason and the same citation. The page carries a biographical passage on
José Afonso's last concerts whose English rendering matches a translation already published on `agenda-porto.pt`
closely enough for the guard to fire.

## `RECITATION` is a copyright guard, not a safety block or a quota

The API matches generated tokens against an index of known web text and abandons the candidate where a long enough run
matches. It is distinct from `SAFETY` and `PROHIBITED_CONTENT`, carries no configurable threshold, and bills the input
tokens regardless.

Two consequences for this pipe:

- **`seed: 0` and `temperature: 0` make it permanent.** The same page yields the same near-verbatim output and the same
  block on every run, so the SDK retry path and the throttle cannot clear it.
- **Extraction is the shape of task that provokes it.** The prompt asks for the descriptive text of the event, so a
  faithful answer is by construction close to text that may already be published elsewhere. Any source republishing a
  press release across sites can trip the same guard.

## The error message names the wrong cause

`text()` (`src/_/llms-google/index.ts:695`) rejects an empty generation only where
`automaticFunctionCallingHistory` is set. With no function calling in play it returns `""`, which `json()` then hands to
`JSON.parse`, and the resulting `SyntaxError` is reported as `malformed model response`.

A withheld generation is therefore indistinguishable in the logs from a truncated one. `extract.log.md` §Output Budget
already instructs a reader to suspect an exhausted `maxOutputTokens` on exactly this message, which is a dead end here:
the page is 4 092 characters and the budget is 16 384 tokens.

For the record, output budget is not close to binding anywhere in this source. The largest page (30 336 characters,
`sqomtuf6llovm03p`) answers in full at 6 995 output tokens.

# Consequences

- **One page aborts the whole run.** The error escapes `extract()` through the feed, so nothing downstream of it
  commits: the 149 readable pages are lost along with the unreadable one, on every run.
- **Nothing is recorded, so nothing recovers.** No digest is stored for the failing page, which is correct in itself,
  but the crawl cannot get past it to store anything else either.

# Recommendations

Two separate defects, worth fixing in order.

1. **Report the block as itself.** Have `text()` reject any response carrying no output text, whatever the reason, and
   name the `finishReason`. A withheld generation then reads as one in the logs instead of as malformed JSON, and the
   misleading guidance in `extract.log.md` §Output Budget can be corrected.

2. **Leave one unreadable page unread.** Have `extract()` drop a page whose generation produced nothing, log it, and
   carry on, on the same footing as a reading whose values a conversion cannot carry: no digest recorded, so the page
   is offered again on the next run. One page carrying content the model declines to render should not cost the run
   the other 149.

Not recommended for now: raising the temperature for a retry, or asking the prompt for a paraphrase rather than a
rendering. Both would clear this page, and both pull directly against the reproducibility and the description-scope
rules `extract.log.md` records as hard-won. Measure before touching either.

# Method

The sweep is reproducible with a throwaway `src/~probe.ts` that pages the search API for all 150 keys, fetches each
event page through `fetch() → html() → focus() → untag()`, submits it under the production configuration, and reports
`finishReason`, `usageMetadata` and whether the output text parses. Cost of a full sweep is roughly 400 000 input
tokens.
