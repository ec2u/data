---
title: Events › Pavia › University – Keyword Quality
summary: Assessment of the event topics assigned to the stored University of Pavia events
description: Reviews the keyword assignments on the 46 stored Pavia events, listing the defects that make them
  unreliable for filtering and the taxonomy branches they never reach.
---


!!! at most 5 keywords
!!! performance

# Scope

Assessment of the `keywords` assigned by the classification step to the events drawn from
https://www.unipv.news/eventi, as held in the `data-work` repository on 2026-09-15.

- **46** events stored for the University of Pavia
- **193** keyword assignments, between 2 and 9 per event, 4.2 on average
- **61** of the **127** topics in the `events` taxonomy ever used

# Findings

Ordered by the harm they do to a reader filtering the catalogue.

## Contradictory audience sets

A single event is offered to audiences that exclude one another, so an audience filter returns events nobody in that
audience would attend.

- *Memory is a wonderful but fallacious tool* – `audience/students/doctoral`, `audience/schools`, `audience/public`
- *Professionalism and Amateurism Compared* – `audience/staff/teaching`, `audience/staff/researchers`,
  `audience/students`, `audience/public`

## Audience applied inconsistently

`audience/public` carries 15 events and `audience/students` 12, while 16 of the 46 events carry no audience topic at
all. Filtering by audience hides events rather than narrowing them, and a missing topic cannot be read as the event
being closed to that audience.

## Sibling formats on one event

An event is stated as being two formats at once, where the taxonomy offers the siblings as alternatives.

- *Alessandro Volta at the University of Pavia* – `format/talks/presentation` and `format/talks/lecture`
- *Digital technologies and cultural heritage* – `format/talks/seminar`, `format/displays/guided-visit`,
  `format/teaching/workshop`
- *Mobility for Everyone* – `format/talks/debate`, `format/teaching/workshop`, `format/ceremonies/award`

## Subject tags contradicted by the event

- *Alessandro Volta at the University of Pavia. Instruments, places, itineraries* – `subject/arts/performing-arts`
- *Preview of Horti Aperti at the Botanical Garden* – `subject/arts/visual-arts`, `subject/environment/climate`
- *Discovering the Unknown: AI in Healthcare* – `subject/humanities/philosophy`

## Mixed granularity

Bare parents are used where other events reach the leaf: `format/talks` on one event against 14 uses of
`format/talks/lecture`, and `subject/environment` against its own children. A filter on the leaf misses the event filed
under the parent.

## Unbounded tag count

Nothing caps the assignments, per facet or in total: the distribution runs 2 keywords (5 events), 3 (15), 4 (11), 5 (3),
6 (7), 7 (4), 9 (1), and almost every defect above sits in the 6-to-9 band.

## Systematic taxonomy gaps

43 leaf topics are never reached. Some are absent for good reason (`format/ceremonies/graduation`,
`format/ceremonies/thesis-defence`), but two clusters are not:

- the whole `subject/education` branch (`higher-education`, `lifelong-learning`, `study-skills`, `teaching`), against
  the courses, summer schools and welcome sessions present in the set;
- `subject/computing/computer-science`, `data-science` and `cybersecurity`, while `subject/computing/ai` is applied
  twice.

# Frequency

The 15 most used topics, of the 61 used.

| Topic                           | Events |
|---------------------------------|-------:|
| `audience/public`               |     15 |
| `format/talks/lecture`          |     14 |
| `audience/students`             |     12 |
| `subject/humanities/literature` |      9 |
| `audience/professionals`        |      8 |
| `audience/schools`              |      7 |
| `subject/humanities/history`    |      6 |
| `format/gatherings/festival`    |      5 |
| `format/talks/conference`       |      5 |
| `subject/arts/visual-arts`      |      5 |
| `subject/humanities/heritage`   |      5 |
| `subject/humanities/philosophy` |      5 |
| `audience/staff/researchers`    |      4 |
| `format/talks/presentation`     |      4 |
| `format/teaching/summer-school` |      4 |

The tail is thin: 19 topics carry a single event each.
