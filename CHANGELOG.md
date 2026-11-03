# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/ec2u/data/commits/edge)

### Added

- Integration notes for the taxonomy pipes (`documents`, `euroscivoc`, `events`, `isced-2011`, `isced-f-2013`,
  `organizations`, `stakeholders`) and for the `wikidata` university pipe, recording the sources each one depends on
- `/resources/` endpoint listing the resources published in issued datasets, queried like any stored collection
- University pages list the datasets holding resources of the university in the order of the home page, each with its
  resource count and linked to the dataset catalogue filtered on the university
- Catalogue pages for units, programs, courses, documents and events are filtered by the criteria their address
  carries, and count matches rather than items while filtered
- Catalogue pages for datasets, universities, units, programs, courses, documents, events and taxonomies offer a name
  search and the facets of the legacy client through the shared facet widgets, with a reset clearing every filter
- Datasets are introduced at an address of their own under their catalogue, as `/universities/~`, with description,
  publisher, license and dates, linked from the info icon on the catalogue and on the pages of its resources

### Changed

- Shapes served by the API endpoints declare the identifier pattern of their resources, and every property they state
  carries a definition, recovered from the dataset and vocabulary docs pages where they gave one
- Dataset and vocabulary docs pages state the types, cardinalities, definitions and properties the shapes declare
- Views show values formatted for the reader: durations, credits, counts, years and dates localised, event days and
  times by the instant they fall on, and language tags, course terms and attendance modes, and event statuses by name
- Detail views follow the layout of the legacy client: long descriptions rendered as Markdown, labelled blocks for
  credentials, links and sections, and catalogue links filtered on the university and the value shown
- Universities are named by their short name, as `Coimbra`, in views, catalogue cards and facets; the `University`
  shape requires the short name as `skos:altLabel`
- The sidebar takes the width of the legacy hub sidebar
- Event pages credit the image in a caption under it, in place of an `Image Credits` entry among the event details
- Event pages set the location one part per line, the venue text split at its commas, so long addresses are not clipped
- The clear control of catalogue name searches matches the one in facet headers: a smaller glyph in a round hover fill
  kept clear of the field border
- Detail pages set their title, labelled blocks and sections evenly apart, each label a step clear of its content
- About and dataset docs pages render their Markdown in place of the raw text, titled by a trail from the section to
  the page title and outlined by a table of contents in the sidebar, as in the legacy client
- Detail pages list links, credentials and concept trees in a property panel below the description, each label beside
  its values and several values one per line, leaving labelled blocks to the Markdown sections
- Catalogue facets other than the university one open compact, and links across the hub take their strong look from
  the shared page style rather than from each view
- The GitHub link in the footer is set a step larger than the copyright notice beside it
- Taxonomy pages gather the concept count, version and dates in a single sidebar panel

- Shape definitions, vocabularies and dataset metadata moved from `@ec2u/data-loader` to `@ec2u/data-shared`, so that
  endpoints and clients state a resource without pulling in the ingestion machinery; the topic retrieval and embedding
  operations stay with the loader
- Workspace packages declare the dependencies they import, in place of a single dependency set on the workspace root
- Test projects are discovered from `packages/*`, each package stating its own resolution conditions and typecheck
  configuration
- SPARQL queries and store steps come from the released `@metreeca/pipe-sparql` and `@metreeca/pipe-store` packages,
  replacing the copies incubated in `@metreeca/work`, which no longer carries them or their dependencies
- Upgrade `@metreeca/pipe-url` to `^0.11.1`
- The development environment is named `edge` in place of `yard`: branch, default environment, secrets
  (`edge-gdb-{service}-*`, `edge-googleai-key`), GraphDB repository `data-edge` and users `data-edge-{service}`
- Services read their environment from `DATA_ENVIRONMENT` in place of `PIPE_ENVIRONMENT`; Cloud Run services, runtime
  service accounts and images are named `{environment}-{service}`, deployed as `deployer` into the `images` registry

### Removed

- The Java harvesters, server and React UI deployed to App Engine, superseded by the pipe loader, server and client;
  the last Java state stays reachable at the `java-legacy` tag for reference and for backports to `main` and `next`
- Dataset metadata links (`rdfs:isDefinedBy`) to the dataset docs pages, superseded by the dataset introductions
