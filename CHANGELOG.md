# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/ec2u/pipe/commits/HEAD)

### Added

- Integration notes for the taxonomy pipes (`documents`, `euroscivoc`, `events`, `isced-2011`, `isced-f-2013`,
  `organizations`, `stakeholders`) and for the `wikidata` university pipe, recording the sources each one depends on

### Changed

- Shape definitions, vocabularies and dataset metadata moved from `@ec2u/data-loader` to `@ec2u/data-shared`, so that
  endpoints and clients state a resource without pulling in the ingestion machinery; the topic retrieval and embedding
  operations stay with the loader
- Workspace packages declare the dependencies they import, in place of a single dependency set on the workspace root
- Test projects are discovered from `packages/*`, each package stating its own resolution conditions and typecheck
  configuration
