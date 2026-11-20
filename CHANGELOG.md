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
- Catalogue pages for units, programs, courses, documents and events are filtered by the criteria their address carries,
  and count matches rather than items while filtered
- Catalogue pages for datasets, universities, units, programs, courses, documents, events and taxonomies offer a name
	search and the facets of the legacy client through the shared facet widgets, with a reset clearing every filter
- Datasets are introduced at an address of their own under their catalogue, as `/universities/~`, with description,
	publisher, license and dates, linked from the info icon on the catalogue and on the pages of its resources
- Dataset introductions are headed by the dataset title and document its data model for each entry shape, outlined in
	the sidebar: the endpoint serving it, the shapes it extends and the properties referring to it, followed by a table of
  the properties it declares, with shapes linked to the introductions documenting them

### Changed

- Taxonomy entries are typed as `ec2u:Concept` rather than `ec2u:Topic` and shown as concepts throughout, since several
	taxonomies classify resources by level, audience or type rather than by topic; queries naming the old class must move
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
- About and dataset docs pages render their Markdown in place of the raw text, titled by a trail from the section to the
  page title and outlined by a table of contents in the sidebar, as in the legacy client
- Detail pages list links, credentials and concept trees in a property panel below the description, each label beside
	its values and several values one per line, leaving labelled blocks to the Markdown sections
- Catalogue facets other than the university one open compact, and links across the hub take their strong look from the
  shared page style rather than from each view
- Taxonomy pages gather the concept count, version and dates in a single sidebar panel
- Catalogues return to the top of their results whenever their filters change, so readers never land halfway down a
  list they have not read
- Event summaries run to 250–300 characters, filling the three lines catalogue cards show of them without being clipped;
	events extracted before the change keep their shorter summaries until their source page changes

- Shape definitions, vocabularies and dataset metadata moved from `@ec2u/data-loader` to `@ec2u/data-shared`, so that
	endpoints and clients state a resource without pulling in the ingestion machinery; the topic retrieval and embedding
	operations stay with the loader
- Workspace packages declare the dependencies they import, in place of a single dependency set on the workspace root
- Test projects are discovered from `packages/*`, each package stating its own resolution conditions and typecheck
	configuration
- SPARQL queries and store steps come from the released `@metreeca/pipe-sparql` and `@metreeca/pipe-store` packages,
	replacing the copies incubated in `@metreeca/work`, which no longer carries them or their dependencies
- Upgrade `@metreeca/blue` and `@metreeca/qest` to `^0.15.0`, `@metreeca/clay*` to `^0.3.0`, `@metreeca/gate` to
  `^0.14.0`, `@metreeca/gear*` to `^0.6.0`, `@metreeca/mime-*` to `^0.5.0`, `@metreeca/pipe-*` to `^0.14.0` and
  `@metreeca/tile*` to `^0.9.0`, each installed as a single copy shared by the client, the server and the loader
- Catalogue addresses carry their filters in plain form, without quoting, so shared links read as they are typed;
  addresses bookmarked or shared earlier keep opening the same filtered catalogue
- The development environment is named `edge` in place of `yard`, across its branch, its default environment and the
  cloud and GraphDB resources bound to it
- Services read their environment from `DATA_ENVIRONMENT` in place of `PIPE_ENVIRONMENT` and run on Cloud Run, one
	service per environment and role, each bound only to the resources of its own environment
- Data endpoints accept cross-origin requests, so browser applications on other sites can query the hub directly

### Removed

- The Java harvesters, server and React UI deployed to App Engine, superseded by the pipe loader, server and client; the
  last Java state stays reachable at the `java-legacy` tag for reference and for backports to `main` and `next`
- Dataset metadata links (`rdfs:isDefinedBy`) to the dataset docs pages, superseded by the dataset introductions

### Fixed

- Home page dataset cards no longer open a gap above their descriptions in Safari
- Dataset counts on the home page line up with the first line of the dataset names
- Page introductions in the sidebar break at the same points in every browser
- Icons keep the height of the text they sit in on the deployed site, where they were drawn at an oversized default
- Catalogue filters set on one page no longer carry over to other pages of the deployed site, such as the home page
