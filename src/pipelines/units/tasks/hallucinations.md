# Hallucination Investigation Summary

## Problem

Multiple unrelated research units were incorrectly identified as "Research Group on Artificial Intelligence and Machine
Learning" with identical, fabricated descriptions during the scraping process.

## Root Cause

The hallucination occurs due to a two-stage API call pattern with empty intermediate content:

1. **First API call** (`scrape()` function): Gemini is invoked with `automaticFunctionCalling` enabled to fetch and
   analyze unit information
2. **Function calls execute**: Tools like `fetchPage` and `matchTopics` are automatically invoked
3. **Empty response**: In some cases, after function calls complete, Gemini returns a response containing **only
   function call parts with no text content**
4. **Second API call** (`data()` function): The empty text is extracted and passed to `data()` for structured extraction
5. **Hallucination**: The `data()` function makes a new API call with empty input, causing Gemini to fabricate plausible
   but false content

## Evidence

### Test Results

- **Empty string input** � Hallucinates "Universidade de Coimbra"
- **Whitespace-only input** � Hallucinates "Institut de Recherche en Informatique et Syst�mes Al�atoires"
- **Function-call-only response** � Hallucinates "Universidade de Coimbra"
- **"Not provided" text** � Correctly returns "Not provided" (no hallucination)

### Diagnostic Output

```
=� INPUT:
(completely empty)

=� OUTPUT:
{
  "formal": "Research Group on Artificial Intelligence and Machine Learning",
  "type": "https://data.ec2u.eu/organizations/research-group",
  "topics": [...],
  "summary": "The Research Group on AI and ML focuses on...",
  ...
}
```

## Solution

### Multi-Layer Defense Strategy

#### Layer 1: Fix in `scrape()` (Root Cause)

- Detect when Gemini response contains no text after automatic function calling
- Make explicit follow-up call to synthesize function call results into structured report
- Prevents empty content from reaching `data()`

#### Layer 2: Safeguard in `data()` (Defense in Depth)

- Validate input is non-empty before making API call
- Throw meaningful error instead of hallucinating
- Prevents hallucinations even if Layer 1 fails

#### Layer 3: Schema-level Constraints (Data Quality)

- Update system instructions to explicitly prohibit fabrication
- Instruct model to return error indicator when source contains no information

## Files Modified

- `src/utilities/gcp/gemini.ts` - Added diagnostic logging to detect hallucinations
- `src/pipelines/units/tasks/scrape.ts` - Added logging to trace empty responses
- `src/pipelines/units/tasks/test-empty-input.ts` - Test cases to reproduce issue
- `src/pipelines/units/tasks/test-function-call-response.ts` - Test for function-call-only responses

## Next Steps

1. Implement safeguard in `data()` to reject empty input
2. Implement fix in `scrape()` to handle empty responses
3. Test with known problematic units
4. Re-run scraping process
5. Decide on diagnostic logging retention strategy
