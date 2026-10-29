---
title: Offerings › LLL
summary: Integration status for the cross-alliance lifelong learning courses
description: Integration status for the cross-alliance Lifelong Learning (LLL) course offerings dataset.
status: active
---

Authoritative integration status for the cross-alliance Lifelong Learning (LLL) course offerings dataset.

# 2026-07-17 – Curated spreadsheet

Data loaded from a manually curated cross-alliance Google Sheet, one row per course, stated one at a time as courses of
the partner university each row names, so an interrupted run keeps the courses it stated and the next one carries on;
unchanged rows are skipped. A sheet naming fewer than three quarters of the stored offerings retracts nothing and fails,
so pruning it below that share requires a forced reload, once the withdrawal is confirmed with the curators.

| Source              | Description                         | Notes                                                                                                   |
|---------------------|-------------------------------------|---------------------------------------------------------------------------------------------------------|
| `offerings-lll-url` | cross-alliance LLL spreadsheet [en] | CSV export URL held in GCP Secret Manager under this key; field reference at https://ec2u.atlassian.net/wiki/x/AYDCTg |

A course is keyed by its `Code` or, failing that, by its English or local title, prefixed with `LLL/` so that it never
names the course another source lists under the same code; `Year` and `Term` place it in its academic period, so the
same code in another year or term is another course. A year of `each semester` is read as no year, and the course is
dated with the academic year current at retrieval, switching in August; any other value that
is not `YYYY/YYYY` drops the row with a warning, as do a row naming no partner
university and one stating no title; a non-blank `-` column disables a row. A program named in `Program (English)` is
stated as a program of its own, keyed by name and the course year, and the course links to it. Closed-set columns
(`Term`, `Mode`, `Fee`, `Test`, `Grade`, `Scale`) leave out values they do not recognise rather than guess them.

- **2026-10-29** – ported to the TypeScript loader: courses stated one at a time with unchanged rows skipped and a
	retraction floor; courses named by key, academic year and terms, `each semester` ones dated at retrieval
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
