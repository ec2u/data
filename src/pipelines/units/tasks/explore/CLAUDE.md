# Leads Pipeline - Interactive Development Process

This document describes the iterative, test-driven approach used to develop and refine the leads pipeline for
extracting research unit hierarchies from university websites.

## Development Methodology

### Core Principles

1. **Iterative Testing:** Test the pipeline on real university websites, identify issues, refine the prompt
2. **Issue Documentation:** Document every issue discovered with concrete examples and URLs
3. **Solution Tracking:** Track what solutions were attempted and their effectiveness
4. **Test Case Library:** Build comprehensive test cases covering different organizational patterns

### Development Cycle

```
Test on real website ’ Identify issue ’ Document in @.md ’ Update prompt ’ Update test.md ’ Retest
```

## Working Files

### Primary Artifacts

- **`index.md`**: System prompt for the analyze() phase - the main artifact being refined
- **`index.ts`**: TypeScript implementation with Lead interface and pipeline functions
- **`@.md`**: Issues and Solutions - detailed documentation of problems encountered and fixes applied
- **`test.md`**: Test Cases - comprehensive test scenarios with sample URLs and expected behaviors

### Working Files

- **`work.ts`**: Scratch file for testing the pipeline with different URLs
- **`work.md`**: Textual report output from analyze() phase for inspection
- **`work.json`**: Structured JSON output from structure() phase for validation

## Testing Workflow

### 1. Select Test Case

Choose a representative university website that exhibits a specific organizational pattern:

- Basic laboratory listings (e.g., Engineering departments)
- Research themes with nested labs (e.g., Biology departments)
- Multi-level navigation requirements
- Research centers vs external collaborations
- Individual people vs organizational units

### 2. Run Pipeline

Execute the pipeline in `work.ts`:

```typescript
await test(
	analyze,
	structure,
	"https://example.edu/department/"
);
```

### 3. Inspect Outputs

- Review `work.md` for the textual analysis report
- Review `work.json` for the structured output
- Check for:
    - Missing units that should be reported
    - Incorrect units being reported (themes, people, external collaborations)
    - Missing homepage URLs
    - Missing or inadequate summaries

### 4. Document Issues

When an issue is found:

1. **Create section in `@.md`** with:
    - Clear issue description
    - Concrete examples with URLs
    - Root cause analysis
    - Solutions attempted/applied
    - Location in codebase where fixes were made

2. **Create or update test case in `test.md`** with:
    - Sample URL
    - Description of the pattern
    - Expected behavior
    - Key issues tested

### 5. Refine Prompt

Update `index.md` to address the issue:

- Add explicit exclusions (NOT subunits)
- Add key distinctions
- Strengthen requirements
- Add stopping conditions
- Provide concrete examples

### 6. Validate

- Retest on the original failing case
- Test on related cases to ensure no regression
- Update `@.md` with solution status

## Common Issue Patterns

### Pattern Recognition Issues

**Symptoms:** Model confuses similar concepts (themes vs units, people vs units)

**Solution Approach:**

- Add to "NOT subunits" list with explicit examples
- Add key distinction rules
- Add to key principles with "Do NOT..." statements

### Missing Information

**Symptoms:** Required fields (summaries, homepage URLs) not being extracted

**Solution Approach:**

- Make field REQUIRED in schema
- Add explicit requirement with "MUST"
- Add to stopping conditions
- Add IMPORTANT note in Output section

### Scope Issues

**Symptoms:** Including too much (nested subunits, external collaborations) or too little (stopping too early)

**Solution Approach:**

- Clarify single-level vs multi-level extraction
- Strengthen stopping conditions with numbered gates
- Add "Do NOT stop until..." with explicit checklist

### Navigation Issues

**Symptoms:** Model not exploring deep enough, missing intermediate pages

**Solution Approach:**

- Add multi-level navigation steps
- Strengthen stopping conditions
- Add explicit fetching patterns
- Provide navigation path examples

## Prompt Engineering Strategies

### Effective Techniques

1. **Explicit Exclusions:** Use "NOT subunits" list with bold emphasis
2. **CRITICAL/IMPORTANT Markers:** Highlight critical rules that must never be violated
3. **Concrete Examples:** Provide actual URLs and patterns (e.g., `labname.example.edu`)
4. **Stopping Conditions:** Use numbered gates that must ALL be satisfied
5. **Key Distinctions:** Provide if/then rules (e.g., "individual person ’ NOT a unit")
6. **Dual Representation:** State requirements in multiple sections (Definitions, Requirements, Guidelines, Output)

### Less Effective Techniques

1. **Implicit expectations:** Assuming model will infer correct behavior
2. **Vague language:** "Try to find" instead of "MUST fetch"
3. **Single mention:** Only stating a requirement once
4. **Optional fields without guidance:** Making fields optional without "(omit if not available)"

## Key Learnings

### Schema Design

- Without explicit `required` fields, models omit fields unpredictably
- Field descriptions like "(omit if not available)" guide model behavior
- Separate optional fields for profile and homepage preserve both when available

### Prompt Structure

- Front-load critical definitions before requirements
- State requirements as MUSTs, not suggestions
- Use stopping conditions as mandatory gates
- Repeat critical points in multiple sections

### Architectural Choices

- Single-level extraction + application recursion is cleaner than prompt-based recursion
- Two-phase pipeline (analyze ’ structure) provides flexibility
- Explicit empty list handling prevents false positives

### Persistent Challenges

- Homepage URL extraction from profile page content remains inconsistent despite multiple strengthening attempts
- May require function calling or structured extraction rather than pure prompt engineering

## Iteration History

### Major Milestones

1. **Initial implementation:** Basic two-phase pipeline with Lead interface
2. **Summary field fix:** Made summary REQUIRED in schema
3. **Profile vs Homepage clarity:** Distinguished institutional pages from self-managed sites
4. **Multi-level navigation:** Added requirements to explore intermediate pages
5. **Research centers inclusion:** Clarified "part of" vs "collaborate with"
6. **Research themes exclusion:** Distinguished topical groupings from structural units
7. **Individual people exclusion:** Added CRITICAL rule against reporting personal pages as units

### Current Status

-  Correctly identifies labs vs research themes
-  Explores multi-level navigation paths
-  Includes research centers, excludes external collaborations
-  Excludes individual people's pages
-  Generates summaries for all units
-  Homepage URL extraction remains inconsistent

## Guidelines for Future Development

### When Adding New Requirements

1. Test first to confirm the issue exists
2. Document in `@.md` with concrete examples
3. Update prompt in multiple places (Definitions, Requirements, Guidelines)
4. Add test case in `test.md`
5. Retest and validate
6. Update status in `@.md`

### When Encountering Regressions

1. Check if new requirement conflicts with existing ones
2. Review all sections that mention the concept
3. Consider if the requirement needs stronger emphasis (bold, CRITICAL marker)
4. Add to Common Patterns in `test.md`

### When Solutions Don't Work

1. Document failed attempts in `@.md` as "Solutions Attempted"
2. Note status as "Partially resolved" or "Persistent issue"
3. Consider alternative approaches (function calling, structured extraction)
4. Add to Key Learnings about limits of prompt engineering
