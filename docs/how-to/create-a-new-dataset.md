---
title: Create a New Dataset
---

- declare top-level dataset classes as `void:rootResources` in `eu/ec2u/data/terms/EC2U.ttl`
  - prevent garbage collection from `eu.ec2u.data.tasks.Chores#collect()`
- define dedicated or update shared ontology (`eu/ec2u/data/terms/EC2U.ttl`)
  - declare dataset individual
    - e.g. `https://data.ec2u.eu/universities/`
  - associate top-level dataset classes to the dataset using the `void:uriSpace` property
    - e.g. `ec2u:Universities void:uriSpace 'https://data.ec2u.eu/universities/'`
    - supports entity counting in `eu.ec2u.data.tasks.Inferences.ql`
- define datasheet in `docs/datasets`
  - review linked datasets docs
  - update links/description in index.md
