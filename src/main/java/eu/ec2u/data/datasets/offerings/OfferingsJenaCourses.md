---
title: Offerings › Jena › Courses
summary: Integration status for Jena courses
description: Integration status for the Jena university courses offerings from the Friedolin module catalogue.
status: active
---

Authoritative integration status for the Jena courses.

# 2026-06-24 – Friedolin module catalogue

Courses harvested from the Friedolin module catalogue across all degree types and deduplicated by module number; the
guest-studies subset is tagged as continuing-education. Programme links are not yet established.

- module catalogue
	- crawled from the Friedolin tree, all degree types, current examination regulations only
- module details
	- per-module description panel: name, code, ECTS, workload, content, learning outcomes, prerequisites, language
	- deduplicated by the stable module number; guest-studies (*Gasthörer*) modules tagged continuing-education
	- field of study classified downstream; not yet linked to programmes
- identifiers
	- minted from the stable module number (no per-module catalogue URL is available)

| Source                                                                       | Description           |
|------------------------------------------------------------------------------|-----------------------|
| [friedolin.uni-jena.de/qisserver/rds?state=modulBeschrGast…][friedolin-root] | module catalogue [de] |

- **2026-06-24** – initial integration

Friedolin is Jena's branded instance of the HIS eG (Hochschul-Informations-System, Hannover) campus-management system in
its older **QIS/LSF** generation (LSF = *Lehre, Studium, Forschung*, the course-catalogue module); **HISinOne** is the
newer unified successor. Its module catalogue is a server-rendered tree, browsable anonymously. Because Friedolin is a
stock HIS product, the same structure and module-description pages recur at other German EC2U universities running QIS,
so this approach should largely transfer.

The catalogue nests five levels (PO = *Prüfungsordnung*, a programme's examination regulations):

| Level       | Node          | Yields                                            |
|-------------|---------------|---------------------------------------------------|
| root        | catalogue     | 15 degree types (*Abschluss*); `96` = Gaststudium |
| degree type | *Abschluss*   | study programmes (*Studiengang*)                  |
| programme   | *Studiengang* | examination-regulation (PO) versions              |
| PO version  | regulation    | modules                                           |
| module      | module        | exam and course units                             |

The degree types are Bachelor, Master, Staatsexamen, Lehramt, …, and `96` Gaststudium (guest studies); the harvester
scans them all, taking only each programme's current PO. Many programmes are empty: module descriptions appear only for
programmes already published in Friedolin. The same module recurs across several programmes and degree types, so courses
are deduplicated by module number; guest-studies (Gaststudium) modules form the continuing-education subset.

Each module carries a description panel with: module name and number, module code, ECTS credits, workload, duration,
recurrence, content (*Inhalte*), learning outcomes (*Lern- und Qualifikationsziele*), teaching forms, teaching language,
and prerequisites. There is no stable per-module URL (the same module is reached through different placement-specific
panels), so course identity rests on the module number.

[friedolin-root]: https://friedolin.uni-jena.de/qisserver/rds?state=modulBeschrGast&moduleParameter=modDescr&struct=auswahlBaum&navigation=Y&next=tree.vm&nextdir=qispos/modulBeschr/gast&nodeID=auswahlBaum&expand=0&lastState=modulBeschrGast&asi=
