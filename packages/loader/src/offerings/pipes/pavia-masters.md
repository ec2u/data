---
title: Offerings › Pavia › Masters
summary: Integration status for the Pavia University first and second level masters
description: Integration status for the first and second level university masters listed by Pavia University.
status: active
---

Authoritative integration status for the first and second level university masters listed by Pavia University.

# 2026-10-29 – Portal catalogue

Masters listed on the paged master and advanced training catalogue of the university portal, each master page then read
and its program extracted by model and stated one at a time, unchanged pages skipped.

| Source                                                      | Description                        | Notes                                           |
|-------------------------------------------------------------|------------------------------------|-------------------------------------------------|
| [portale.unipv.it/it/…/offerta-didattica][master-catalogue] | master and training catalogue [it] | paged as `?page=0…`; shared with Pavia training |

Every page the catalogue pager links to is read, and every card on it (`.card-corsi`) headed `Master 1° livello` or
`Master 2° livello` lists a master; cards headed `Corso di perfezionamento` are left to the Pavia training source. A
master is keyed by its page address, which carries an edition suffix (`-0`) telling apart editions listed under the same
name. It is named in Italian as listed, dated with the academic year the card states (`A.A. 2026/27`), stated at ISCED
2011 level 7 and awarding the `Master universitario di primo livello` or `di secondo livello` degree, with the credits
and the yearly or two-year duration the card states. Summary, contents, learning outcomes, admission and completion
requirements are extracted from the master page, then translated to English and classified as needed.

A catalogue page that fails to load lists no master and is logged like any other failure. A run naming fewer than three
quarters of the stored masters retracts nothing and fails, so a failed page never retracts its masters.

- **2026-10-29** – initial integration

[master-catalogue]: https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-didattica
