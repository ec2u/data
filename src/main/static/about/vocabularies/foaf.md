---
title: Friend of a Friend (FOAF)
---

The [Friend of a Friend (FOAF)](http://xmlns.com/foaf/spec/) vocabulary describes persons, their activities and their
relationships to other people and objects. FOAF is a machine-readable ontology describing persons, their activities and
their relations to other people and objects, providing a foundation for representing and connecting people,
organizations, and their social relationships on the web.

| prefix | namespace                  | description                                                       |
|--------|----------------------------|-------------------------------------------------------------------|
| foaf:  | http://xmlns.com/foaf/0.1/ | [FOAF Vocabulary Specification 0.99](http://xmlns.com/foaf/spec/) |

![FOAF data model](index/foaf.svg#50)

# Agent

| term                                                         | type   | # | description                                  |
|--------------------------------------------------------------|--------|---|----------------------------------------------|
| [foaf:Agent](http://xmlns.com/foaf/spec/#term_Agent)         |        |   | an agent (for instance, a person or a group) |
| [foaf:depiction](http://xmlns.com/foaf/spec/#term_depiction) | URI    | * | a link to an image depicting the agent       |
| [foaf:homepage](http://xmlns.com/foaf/spec/#term_homepage)   | URI    | * | a link to the homepage of the agent          |
| [foaf:mbox](http://xmlns.com/foaf/spec/#term_mbox)           | string | * | a mailbox for the agent                      |
| [foaf:phone](http://xmlns.com/foaf/spec/#term_phone)         | string | * | a phone number for the agent                 |

> [!WARNING]
> Known deviations from standard:
>
> * `foaf:mbox` and `foaf:phone` should be IRIs; they are represented as strings to ease interoperability with frontend
    applications

# Organization

| term                                                                   | type                 | # | description     |
|------------------------------------------------------------------------|----------------------|---|-----------------|
| **[foaf:Organization](http://xmlns.com/foaf/spec/#term_Organization)** | [foaf:Agent](#agent) |   | an organization |

# Person

| term                                                           | type                 | #    | description                                           |
|----------------------------------------------------------------|----------------------|------|-------------------------------------------------------|
| **[foaf:Person](http://xmlns.com/foaf/spec/#term_Person)**     | [foaf:Agent](#agent) |      | a person                                              |
| [foaf:title](http://xmlns.com/foaf/spec/#term_title)           | string               | 0..1 | personal professional title; for instance `Professor` |
| [foaf:givenName](http://xmlns.com/foaf/spec/#term_givenName)   | string               | 1    | the given name of the person                          |
| [foaf:familyName](http://xmlns.com/foaf/spec/#term_familyName) | string               | 1    | the family name of the person                         |
