---
title: Offerings › Iași
summary: Integration status for the Alexandru Ioan Cuza University of Iași programs and courses
description: Integration status for the degree programs and courses of the Alexandru Ioan Cuza University of Iași, all sources planned.
status: planned
---

Authoritative integration status for the Alexandru Ioan Cuza University of Iași programs and courses.

# Work in Progress – Public study pages

No institutional API or agreed route is on record, so the public study pages of the university site are under
consideration as the source for programs, with courses left to the curricula they link.

| Source                                                      | Description                | Notes                                  |
|-------------------------------------------------------------|----------------------------|----------------------------------------|
| https://www.uaic.ro/studii/studii-universitare-de-licenta/  | bachelor's programmes [ro] | every programme, by faculty and field  |
| https://www.uaic.ro/studii/studii-universitare-de-masterat/ | master's programmes [ro]   | every programme, by faculty and field  |
| https://www.uaic.ro/studii/studii-universitare-de-doctorat/ | doctoral studies [ro]      |                                        |
| https://www.uaic.ro/studii/facultati-2/                     | faculties [ro]             | 15 faculty pages                       |
| https://www.uaic.ro/sitemap_index.xml                       | site sitemaps [ro]         | includes faculty and doctoral sitemaps |
| https://admitere.uaic.ro/                                   | admissions site [ro]       | not yet surveyed                       |

The site is open to crawlers (`robots.txt` blocks administration paths alone). The bachelor's and master's pages list
every programme under its faculty and field, stating the mode of study (`IF` full time, `IFR` reduced attendance, `ID`
distance), the teaching language when other than Romanian and the campus when other than Iași, and point to the
curricula (`Planurile de învățământ`) for details. They would support a crawl reading programs from these two listings,
while programs have no pages of their own to key them by, so a key would have to be built from faculty and programme
name. Courses would come from the curricula, likely published as documents, which remain to be surveyed.

- **2026-10-29** – public study pages surveyed as a source of programs; no institutional source on record
