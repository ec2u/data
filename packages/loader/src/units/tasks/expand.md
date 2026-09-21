---
title: Units Expand Task - Working Notes
date: 2025-11-04
status: In Progress
---

# Current Issues

## Issue 1: External Collaborations Being Reported as Subunits

**Problem**: Physics department (https://fisica.dip.unipv.it/) was reporting external experiments (ATLAS, CMS, MEG,
etc.) as organizational subunits.

**Root Cause**: Research departments prominently feature international collaborations they participate in. Without
explicit guidance, the model reports these as structural subunits.

**Solution**: Updated `expand.ai` prompt with explicit external collaboration detection:

- Added CRITICAL section distinguishing external collaborations from internal subunits
- Key indicators of external collaborations:
  - Different institutional domains (e.g., atlas.cern vs fisica.dip.unipv.it)
  - Language patterns: "participate in", "collaborate with", "member of"
  - Hosted at external facilities (CERN, PSI, Fermilab, etc.)
  - Multi-institutional membership

**Status**: ✅ RESOLVED - Tested successfully, external experiments correctly excluded

**Test Results** (https://fisica.dip.unipv.it/):

- ✅ Found 6 internal research lines (correct)
- ✅ Excluded 11 external experiments (ATLAS, CMS, MEG, MUonE, RD_FCC, RD_MUCOL, ICARUS, HERD, ALICE, FAMU, MAMBO)

**Documented in**: `expand.md` test case "External Collaborations vs Internal Research Lines"

---

## Issue 2: Research Lines vs Functional Units

**Problem**: Research lines like "Didactics, History and Foundations of Physics" are thematic groupings that contain
actual functional units underneath:

- Didactics of Physics
- History of Physics
- Foundations of Physics

These subunits are being missed because expand() only reports the research line, not exploring deeper.

**Root Cause**: Two-level problem:

1. Research lines are organizational/thematic categories, not functional units
2. Current pipeline doesn't recursively expand discovered units

**Attempted Solution**: Updated `expand.ai` to explore research lines and report functional units underneath (not the
lines themselves).

**Result**: ❌ FAILED - Model attempted to explore too deeply in single call

- Hit `maximumRemoteCalls: 20` limit or generated responses too complex for structured extraction
- Error: "empty model response: unable to extract structured data" from `data()` function

**Current State**:

- Prompt updated to explore research lines and report only functional units
- `maximumRemoteCalls` increased to 100 (was 20)
- Added monitoring: logs function call count and warns if limit is hit

---

## Deep Dive: Why "empty model response" Error Occurs

### The Data Extraction Flow

Looking at `src/utilities/gcp/gemini.ts:99-144`, the `data()` function:

1. **Receives response** from `ai.models.generateContent()`
2. **Extracts text** using `text()` function (line 42-48):
  - Filters out non-text parts (thinking, function calls)
  - Joins text parts into a single string
  - Trims whitespace
3. **Validates text is not empty** (line 105-107):
   ```typescript
   if (!input || input.trim().length === 0) {
       throw new Error("empty model response: unable to extract structured data");
   }
   ```
4. **Sends to secondary model** (`gemini-2.5-flash-lite`) to structure the text into JSON
5. **Returns parsed JSON** matching the schema

### Why Complex Prompts Break This

The expand task in `expand.ts:53-104`:

```typescript
return data(await ai.models.generateContent({
	model: "gemini-2.5-flash",
	contents: md`...lead info...`,
	config: {
		systemInstruction: await file(".ai", import.meta.url),
		tools,
		automaticFunctionCalling: {
			maximumRemoteCalls: 20  // ← Key constraint
		}
	}
}), { type: Type.ARRAY, items: { ... } });
```

**With the complex "explore research lines" prompt**, the model attempts to:

1. Fetch main research page (1 call)
2. Fetch each of 6 research line pages (6 calls)
3. Fetch each functional unit page under each line (3-6 per line = 18-36 calls)

**Total needed**: ~25-43 function calls to complete the task

**Result when hitting the limit**:

- Model exhausts the `maximumRemoteCalls: 20` budget
- Stops mid-exploration without completing the task
- Returns a response with only function call results, **no final text synthesis**
- The `text()` function finds no text parts → empty string
- `data()` throws "empty model response: unable to extract structured data"
- `guard(expand)` catches error, logs it, returns `undefined`

### Why Simpler Prompts Work

The original prompt (report what you see at one level):

1. Fetch main research page (1 call)
2. Identify 6 research lines from that page
3. Generate text report listing them
4. Total: 1-2 function calls

**Result**: Stays well under the 20 call limit, completes successfully, generates text report that `data()` can
structure.

### Why We Can't Just Increase maximumRemoteCalls

Increasing the limit would:

- ✅ Allow more exploration
- ❌ Make calls much slower (each function call adds latency)
- ❌ Increase token usage exponentially
- ❌ Risk hitting other limits (context window, time limits)
- ❌ Make responses unpredictable and harder to debug
- ❌ Violate the "single-level extraction" design principle

### The Right Solution

**Keep the single-level design** and let application-level recursion handle depth:

- First call: `expand(department)` → 6 research lines (1-2 function calls)
- Second call: `expand(research_line_1)` → 3 functional units (2-4 function calls)
- Third call: `expand(research_line_2)` → 4 functional units (2-5 function calls)
- ...etc

Each call stays under the limit, completes successfully, and the application orchestrates the full tree exploration.

---

# Design Considerations

## Single-Level vs Multi-Level Extraction

**Current Design** (from expand.md):

- Single responsibility: Report only direct/immediate subunits (one level down)
- Application handles recursion by calling expand() on each discovered unit
- Simpler prompt, better control, more predictable token usage

**Alternative Considered**: Have model explore multiple levels in one call

- ❌ Makes prompt too complex
- ❌ Harder to control depth and termination
- ❌ Breaks structured data extraction (too much output)
- ❌ Less predictable performance

## Proposed Solutions for Research Lines Issue

### Option 1: Enable Recursive Processing (Simplest)

1. Uncomment line 110 in expand.ts: `(items(units.select({ expanded: Date.now()-stale })))`
2. Run expand() multiple times until all units processed
3. First pass: department → 6 research lines
4. Second pass: research lines → functional subunits
5. Mark units as `expanded: Date.now()` to avoid reprocessing

**Pros**:

- Follows existing design pattern
- Minimal prompt changes needed
- Clean separation of concerns

**Cons**:

- Requires multiple expand() runs
- Research lines remain in database (might be okay - can be filtered by checking if they have children)

### Option 2: Application-Level Filtering

1. Keep reporting research lines
2. After expansion completes, filter out units that have children
3. Only leaf nodes represent actual functional units

**Pros**:

- No prompt changes
- Clear separation of thematic groupings from functional units

**Cons**:

- Requires post-processing logic
- Research lines persist in intermediate state

### Option 3: Mark Non-Functional Units

1. Add optional `functional: boolean` field to Unit schema
2. Prompt reports all units but marks research lines as `functional: false`
3. Application can filter or handle accordingly

**Pros**:

- Explicit distinction in data model
- Flexible querying

**Cons**:

- Schema change required
- Adds complexity to prompt and schema

---

# Next Steps

**Immediate**:

1. Decide on solution approach (Option 1 recommended)
2. If Option 1: Test recursive expansion with research lines
3. Verify functional subunits are correctly discovered

**Future**:

- Consider if research lines should be stored or filtered out
- Document recursive expansion pattern in expand.md
- Add test case for multi-level structures
