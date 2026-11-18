---
title: Offerings › Pavia › Training
summary: Integration status for the Pavia University advanced training courses
description: Integration status for the advanced training courses (corsi di perfezionamento) listed by Pavia University.
status: active
---

Authoritative integration status for the advanced training courses listed by Pavia University.

# 2026-10-29 – Portal catalogue

Courses listed on the paged master and advanced training catalogue of the university portal, each course page then read
and its course extracted by model and stated one at a time, unchanged pages skipped.

| Source                                                        | Description                        | Notes                                          |
|---------------------------------------------------------------|------------------------------------|------------------------------------------------|
| [portale.unipv.it/it/…/offerta-didattica][training-catalogue] | master and training catalogue [it] | paged as `?page=0…`; shared with Pavia masters |

Every page the catalogue pager links to is read, and every card on it (`.card-corsi`) headed `Corso di
perfezionamento` lists a course; cards headed as masters are left to the Pavia masters source. A course is keyed by its
page address, named in Italian as listed, dated with the academic year the card states (`A.A. 2026/27`), stated at ISCED
2011 level 7 and awarding a certificate, with the credits and the main teaching language the card states (`Italiana`,
`Inglese`, possibly `Prevalentemente`). Summary, contents, learning outcomes, admission and completion requirements are
extracted from the course page, then translated to English and classified as needed.

A catalogue page that fails to load lists no course and is logged like any other failure. A run naming fewer than three
quarters of the stored courses retracts nothing and fails, so a failed page never retracts its courses.

- **2026-10-29** – initial integration

[training-catalogue]: https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-didattica
