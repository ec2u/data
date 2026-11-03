---
title: Friend of a Friend (FOAF)
---

The [Friend of a Friend (FOAF)](http://xmlns.com/foaf/spec/) vocabulary describes persons, their activities and their
relationships to other people and objects. FOAF is a machine-readable ontology describing persons, their activities and
their relations to other people and objects, providing a foundation for representing and connecting people,
organizations, and their social relationships on the web.

| prefix | namespace                  | description                          |
|--------|----------------------------|--------------------------------------|
| foaf:  | http://xmlns.com/foaf/0.1/ | [FOAF Vocabulary Specification 0.99] |

![FOAF data model](index/foaf.svg#50)

# Agent

| term                     | type  | # | description                                  |
|--------------------------|-------|---|----------------------------------------------|
| [foaf:Agent][term-agent] |       |   | an agent (for instance, a person or a group) |
| [foaf:depiction]         | URI   | * | images depicting the agent                   |
| [foaf:homepage]          | URI   | * | homepages of the agent                       |
| [foaf:mbox]              | email | * | email addresses of the agent                 |
| [foaf:phone]             | phone | * | phone numbers of the agent                   |

> [!WARNING]
> Known deviations from standard:
>
> * `foaf:mbox` and `foaf:phone` should be IRIs; they are represented as strings to ease interoperability with frontend
    applications

# Organization

| term                    | type                | # | description     |
|-------------------------|---------------------|---|-----------------|
| **[foaf:Organization]** | [foaf:Agent][agent] |   | an organization |

# Person

| term              | type                | #    | description                                   |
|-------------------|---------------------|------|-----------------------------------------------|
| **[foaf:Person]** | [foaf:Agent][agent] |      | a person                                      |
| [foaf:title]      | string              | 0..1 | professional or honorific title of the person |
| [foaf:givenName]  | string              | 1    | the given name of the person                  |
| [foaf:familyName] | string              | 1    | the family name of the person                 |

[FOAF Vocabulary Specification 0.99]: http://xmlns.com/foaf/spec/

[term-agent]: http://xmlns.com/foaf/spec/#term_Agent

[foaf:depiction]: http://xmlns.com/foaf/spec/#term_depiction

[foaf:homepage]: http://xmlns.com/foaf/spec/#term_homepage

[foaf:mbox]: http://xmlns.com/foaf/spec/#term_mbox

[foaf:phone]: http://xmlns.com/foaf/spec/#term_phone

[agent]: #agent

[foaf:Organization]: http://xmlns.com/foaf/spec/#term_Organization

[foaf:Person]: http://xmlns.com/foaf/spec/#term_Person

[foaf:title]: http://xmlns.com/foaf/spec/#term_title

[foaf:givenName]: http://xmlns.com/foaf/spec/#term_givenName

[foaf:familyName]: http://xmlns.com/foaf/spec/#term_familyName
