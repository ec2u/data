---
title: Schema.org Things
---

*Things* describe generic items of interest made available on the *EC2U Knowledge Hub* and described according to [schema.org](https://schema.org) vocabularies.

The resource data model is *abstract*, that is is not intended to be used in isolation but only to provide a base
definition factoring generic properties shared by the specialized models defined by each [dataset](index.md).

# Model

![thing data model](index/things.svg)

EC2U things are described using a controlled subset of
the  [schema.org](https://schema.org) data model, with the
following major deviations:

* property types and cardinality are tightly specified and constrained

All generic human-readable labels and descriptions are localized either in English or in one of the local EC2U partner
languages.

| property                                                     | description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [schema:url](https://schema.org/url)                         | link to the original event page                              |
| [schema:name](https://schema.org/name)                       | title; if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system |
| [schema:image](https://schema.org/image)                     | link to a related image                                      |
| [schema:description](https://schema.org/description)         | extended  description; if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system |
| [schema:disambiguatingDescription](https://schema.org/disambiguatingDescription) | short description; if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system; if missing, may be automatically extracted from `schema:description` |