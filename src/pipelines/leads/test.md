---
title: Leads Pipeline - Test Cases
summary: Significant test cases and expected behaviors for the leads pipeline
---

This document describes significant test cases used during development, with sample pages and expected behaviors.

# Test Case 1: Basic Laboratory Listing

**Sample URL:** https://iii.dip.unipv.it/it/ricerca/laboratori-di-ricerca

**Description:** Engineering department with comprehensive laboratory listing on a single page.

**Expected Behavior:**

- Extract all 35 laboratories listed
- Identify homepage URLs for labs with subdomain sites (e.g., lab-bioinfo.unipv.it, vision.unipv.it)
- Recognize subdomains as homepages, not profiles
- Generate summaries for each laboratory (~100 chars)

**Key Issues Tested:**

- Missing homepage URLs when directly visible in listing
- Subdomain confusion (treating subdomains as profiles vs homepages)
- Summary generation requirement

# Test Case 2: Research Themes vs Actual Labs

**Sample URL:** https://dbb.dip.unipv.it/it

**Description:** Biology department organizing research by thematic areas, with actual labs nested under themes.

**Expected Behavior:**

- Navigate to research themes/laboratories page (https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori)
- Recognize pages like "Bioinformatics and Big Data", "Neurofarmacologia" as themes, not actual units
- Explore each theme page to find actual laboratories underneath
- Extract actual labs: "Laboratorio di Genomica Computazionale" (under Bioinformatics theme), "Laboratorio di
  Neurofarmacologia Cellulare e Molecolare", etc.
- Fetch individual lab profile pages to find homepage links
- Example: Genomica Computazionale profile should reveal https://lescailab.unipv.it/

**Key Issues Tested:**

- Distinguishing research themes from actual structural units
- Exploring theme pages to find labs underneath
- Not reporting themes as units
- Homepage links embedded in lab profile pages
- Multi-level structure: department → themes → labs

# Test Case 3: Nested Subunits

**Sample URL:
** https://dbbs.dip.unipv.it/it/ricerca/attivita-di-ricerca/linee-e-temi-di-ricerca/unita-di-neurodiagnostica

**Description:** Research unit with explicitly listed nested subunits (sotto-unit�).

**Expected Behavior:**

- Report ONLY direct subunits of the input unit
- Do NOT include nested subunits in the output
- For this unit: should identify 3 sotto-unit� but not their sub-groups
- Application code will handle recursive exploration

**Key Issues Tested:**

- Single-level vs multi-level extraction
- Explicit exclusion of nested subunits from single call

**Related URLs:**

- https://dbbs.dip.unipv.it/it/ricerca/attivita-di-ricerca/linee-e-temi-di-ricerca/unita-di-neurologia-clinica-e-riabilitativa
- https://dbbs.dip.unipv.it/it/ricerca/attivita-di-ricerca/linee-e-temi-di-ricerca/unita-di-neuropsichiatria-infantile

# Test Case 4: Research Centers vs External Collaborations

**Sample URL:** https://giurisprudenza.dip.unipv.it/it/ricerca/persone-e-network/gruppi-e-centri-di-ricerca

**Description:** Law department with research centers that are structural subunits.

**Expected Behavior:**

- Include research centers that are "part of" the department
- Exclude external collaborations or coordinating bodies the unit participates in
- Expected centers: CEDANT, Centro di Studio sulla Simbolica Giuridica, Centro Studi sull'Unione Europea, Centro Studi
  Guido Rossi
- For Centro Studi Diritto e Sanità: extract both profile (institutional page) and
  homepage (https://dirittoesanita.unipv.it/)

**Key Issues Tested:**

- Research centers not being excluded as "coordinating bodies"
- Distinguishing "our centers" from "centers we participate in"
- Both profile and homepage extraction for centers

# Test Case 5: Multi-Level Navigation

**Sample URL:** https://giurisprudenza.dip.unipv.it/

**Description:** Department where research groups page is not directly linked from homepage.

**Navigation Path:**

1. Homepage: https://giurisprudenza.dip.unipv.it/
2. Intermediate: https://giurisprudenza.dip.unipv.it/it/ricerca/persone-e-network
3. Listing: https://giurisprudenza.dip.unipv.it/it/ricerca/persone-e-network/gruppi-e-centri-di-ricerca

**Expected Behavior:**

- Explore intermediate navigation pages (ricerca/persone-e-network)
- From intermediate page, identify and fetch listing pages
- Do NOT assume homepage directly links to all content
- Navigate through: section pages � subsection pages � listing pages

**Key Issues Tested:**

- Multi-level exploration requirement
- Intermediate navigation page handling
- Not relying solely on homepage content

# Test Case 6: Profile Types (Dedicated, Embedded, Mentioned)

**Description:** Different ways units can be described on institutional pages.

**Examples:**

- **Dedicated:** Unit has its own dedicated page within institutional site
- **Embedded:** Unit is described in a section spanning multiple pages
- **Mentioned:** Unit is briefly referenced among other units

**Expected Behavior:**

- All three types are valid profile URLs
- For embedded/mentioned: focus analysis on relevant content only
- Profile URL can point to shared page where unit is mentioned

**Key Issues Tested:**

- Flexible profile URL definition
- Handling units without dedicated pages

# Test Case 7: Empty Results

**Description:** Units with no structural subunits.

**Expected Behavior:**

- Return empty list `[]`
- This is valid and acceptable
- Should not force false positives

**Key Issues Tested:**

- Explicit empty list handling
- Avoiding forced extraction when no subunits exist

# Expected Output Format

For all test cases, each subunit should include:

```json
{
  "name": "Subunit Name",
  "summary": "Brief description (~100 chars)",
  "profile": "https://institutional.site/path/to/unit",
  // optional
  "homepage": "https://unit.subdomain.site/"
  // optional
}
```

**Requirements:**

- At least one URL (profile or homepage) required
- Summary field always required
- Profile: institutional page within parent site structure
- Homepage: subdomain or independent site

# Common Patterns to Verify

1. **Subdomain Recognition:** `lab-name.unipv.it` → homepage, not profile
2. **Homepage Discovery:** Check listing page, then fetch profile pages
3. **Research Centers:** Include if "part of" unit, exclude if external collaboration
4. **Multi-Level Navigation:** Explore intermediate pages to find listings
5. **Single-Level Extraction:** Report only direct subunits, not nested ones
6. **Research Themes vs Units:** Don't report themes/topics as units; explore them to find actual labs underneath
