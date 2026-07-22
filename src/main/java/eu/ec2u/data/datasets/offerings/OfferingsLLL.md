---
title: Offerings › LLL
summary: Integration status for LLL offerings
description: Integration status for the cross-alliance Lifelong Learning (LLL) course offerings dataset.
status: active
---

Authoritative integration status for the cross-alliance Lifelong Learning (LLL) course offerings dataset.

# 2026-07-17 – Curated spreadsheet

Data loaded from a manually curated cross-alliance Google Sheet, one row per course, mapped to `ec2u:Course`
entries; the sheet field reference is documented at https://ec2u.atlassian.net/wiki/x/AYDCTg.

- **2026-07-22** – map the `Badge` column to the awarded educational credential
  (`schema:educationalCredentialAwarded`), recorded as a `Badge` credential whose `schema:url` is the Open Badge
  definition
- **2026-07-21** – split the assessment mapping: the `Assessment` column now feeds the learning objectives
  (`schema:assesses`), the format/grade/scale summary table the examination requirements (`schema:competencyRequired`)
- **2026-07-21** – map the course instructors (`schema:instructor`), storing them as persons in the knowledge hub
- **2026-07-21** – read the ISCED-2011 column as a comma-separated list, mapping every valid code to an educational
  level
- **2026-07-21** – map the course assessment objectives (`schema:assesses`), prefixed with a summary table of the
  assessment format, grade nature and grading scale
- **2026-07-21** – map the course description (`schema:description`) and recognise the `certification` grading scheme
- **2026-07-21** – read ISCED-F 2013 codes from a single column, accepting 2 to 4 digit codes and expanding each to all
  its broader levels
- **2026-07-17** – map academic year (`ec2u:year`) and term (`ec2u:term`, comma-separated `annual`/`first`/`second`/
  `summer`/`open`)
- **2026-07-17** – initial integration of the restructured spreadsheet
