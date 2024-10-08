---
title: Create a New Dataset
---

- define dedicated ontology
  - declare dataset individual
      - e.g. `</universities/> a void:Dataset`
  - declare top-level dataset classes as subclasses of `ec2u:Resource`
    - e.g. `ec2u:University rdfs:subClassOf ec2u:Resource`
  - associate top-level dataset classes to the dataset using the `void:rootResources` property
    - e.g. `</universities/> void:rootResource ec2u:University`
    - supports entity counting in `Datasets.Updater`
    - supports top-level collection navigation in metreeca/self
- define datasheet in `docs/datasets`
  - review linked datasets docs
  - update links/description in `index.md`
