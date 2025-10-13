---
title: Prompt Engineering Guidelines
description: |
  Universal principles and techniques for developing effective AI prompts through iterative testing and refinement.
---

# Effective Techniques

## Explicit Exclusions

Use "NOT X" lists with bold emphasis and concrete examples.

**Example:**

```markdown
The following are NOT valid items:
- **Research themes** (e.g., "Cancer Biology", "Climate Science")
- **Individual people** (e.g., personal faculty pages)
- **External collaborations** (e.g., partnerships with other institutions)
```

## CRITICAL/IMPORTANT Markers

Highlight rules that must never be violated.

**Example:**

```markdown
CRITICAL: Do not include individual people's pages as organizational units.

IMPORTANT: All entries MUST include a summary field.
```

## Concrete Examples

Provide actual examples from the domain (URLs, data samples, etc.).

**Example:**

```markdown
Valid subdomain pattern: lab.department.edu
Invalid: person-name.department.edu (individual's page)
```

## Stopping Conditions

Use numbered gates that must ALL be satisfied before completion.

**Example:**

```markdown
Do NOT stop until ALL of the following are satisfied:
1. You have explored all navigation links in the main content area
2. You have visited at least one level deeper than the starting page
3. You have extracted summaries for all units found
4. You have verified no research themes were included
```

## Key Distinctions

Provide if/then rules for disambiguation.

**Example:**

```markdown
If the page describes a topical area → NOT a structural unit
If the page describes an organizational entity with dedicated space → structural unit
```

## Dual Representation

State requirements in multiple sections (Definitions, Requirements, Guidelines, Output).

**Example:**

```markdown
# Definitions
A "unit" is an organizational entity with dedicated resources...

# Requirements
- MUST extract only organizational units (not themes)
- MUST include summary for each unit

# Guidelines
When evaluating pages, remember:
- Units have organizational structure
- Themes are topical groupings

# Output Format
{
  "summary": "required - description of the unit",
  ...
}
```

## Required Fields

Explicitly mark schema fields as required vs optional.

**Example:**

```typescript
{
	summary: string;        // REQUIRED
	homepage ? : string;      // optional - omit if not available
}
```

## Optional Field Guidance

Add "(omit if not available)" to guide behavior for optional fields.

**Example:**

```markdown
homepage (string, optional): The unit's homepage URL. Omit if not available.
```

## Front-load Critical Info

Place critical definitions before requirements.

**Structure:**

```markdown
1. Definitions (what is/isn't in scope)
2. Requirements (what MUST be done)
3. Guidelines (how to approach the task)
4. Output format (expected structure)
```

## Strong Language

Use "MUST" instead of "should", "try to", or "consider".

**Less Effective:**

```markdown
You should try to find the homepage URL when available.
Consider including a summary of each unit.
```

**More Effective:**

```markdown
You MUST extract the homepage URL when available.
You MUST include a summary for each unit.
```

# Less Effective Techniques

## Implicit Expectations

❌ **Don't:** Assume model will infer correct behavior without explicit guidance

✅ **Do:** State expectations explicitly with examples

## Weak/Vague Language

❌ **Don't:** Use "should", "try to", "consider", or "try to find"

✅ **Do:** Use strong, directive language: "MUST", "REQUIRED", "CRITICAL"

## Single Mention

❌ **Don't:** Only state a requirement once

✅ **Do:** Repeat critical requirements in multiple sections

## Optional Fields Without Guidance

❌ **Don't:** Make fields optional without instructions on when to omit

✅ **Do:** Add clear guidance: "(omit if not available)"

## Buried Requirements

❌ **Don't:** Place critical rules deep in the prompt

✅ **Do:** Front-load critical definitions and requirements

# Common Issue Patterns

## Pattern Recognition Issues

**Symptoms:** Model confuses similar concepts or misclassifies inputs

**Solution Approach:**

- Add explicit exclusion lists with examples
- Add key distinction rules with if/then logic
- Add principles with "Do NOT..." statements
- Provide concrete examples of each category

## Missing Information

**Symptoms:** Required fields or information not being extracted or generated

**Solution Approach:**

- Mark fields as REQUIRED in schema
- Add explicit requirements with "MUST" language
- Add to stopping conditions/completion gates
- Add IMPORTANT/CRITICAL markers in relevant sections
- Provide examples showing complete outputs

## Scope Issues

**Symptoms:** Including too much (out-of-scope content) or too little (stopping prematurely)

**Solution Approach:**

- Clarify boundaries explicitly
- Strengthen stopping conditions with numbered gates
- Add "Do NOT stop until ALL..." with explicit checklist
- Define what is in-scope vs out-of-scope with examples

## Navigation/Process Issues

**Symptoms:** Model not following required steps, skipping stages, or missing intermediate work

**Solution Approach:**

- Add explicit multi-step instructions
- Strengthen stopping conditions
- Add explicit process patterns
- Provide step-by-step examples

# Key Learnings

## Schema Design

- Without explicit `required` fields, models omit fields unpredictably
- Field descriptions like "(omit if not available)" guide model behavior for optional fields
- Separate optional fields preserve multiple types of information when both available
- Schema-level constraints are more reliable than prose instructions

## Prompt Structure

- Front-load critical definitions before requirements
- State requirements as MUSTs, not suggestions
- Use stopping conditions as mandatory gates
- Repeat critical points in multiple sections
- Structure matters: Definitions → Requirements → Guidelines → Output format

## Limitations

- Some extraction tasks remain inconsistent despite prompt strengthening
- May require alternative approaches: function calling, structured extraction, multi-step prompting
- Pure prompt engineering has limits - know when to switch to architectural solutions

# When to Move Beyond Prompting

## Architectural Approaches

When pure prompt engineering proves insufficient, consider these system-level solutions:

- **Single-level operations + application-level iteration** - Cleaner than prompt-based recursion
- **Multi-phase pipelines** - Separate concerns (e.g., analyze → structure) for flexibility
- **Explicit empty result handling** - Prevents false positives at the application layer
- **Separation of concerns** - One prompt per clear responsibility

# Best Practices Summary

This summary reinforces key principles through dual representation (see "Dual Representation" technique above).

## Do

- ✅ Use strong, explicit language (MUST, REQUIRED, CRITICAL)
- ✅ Provide concrete examples from the domain
- ✅ State requirements in multiple sections
- ✅ Use explicit exclusion lists
- ✅ Add stopping conditions/completion gates
- ✅ Mark schema fields as required explicitly
- ✅ Front-load critical definitions
- ✅ Use if/then rules for disambiguation
- ✅ Provide guidance for optional fields

## Don't

- ❌ Assume the model will infer requirements
- ❌ Use weak language (should, try to, consider)
- ❌ State critical requirements only once
- ❌ Make fields optional without guidance
- ❌ Bury critical rules deep in the prompt
- ❌ Continue pure prompt engineering when architectural solutions are needed
- ❌ Use implicit expectations
