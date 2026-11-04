The EC2U Knowledge Hub is the central knowledge sharing and semantic search facility of the
[EC2U Alliance](https://www.ec2u.eu/). It gathers content from partner universities and external sources, and publishes
it as cross-linked datasets about skills, courses, research, local events and other areas of common interest.

Each dataset is available through this interactive semantic search tool and through a machine-readable REST/JSON-LD API.
Both support faceted search and linked data navigation across every dataset and its cross-links.

Automated crawlers collect much of this content, and AI enriches it with descriptions, labels and classifications.
Either step may introduce errors or gaps, so always check important information against official sources before
acting on it. See [AI-Generated Content](ai) for details on how AI is used and how to use its output responsibly.

# Data Models

Data models for resource datasets published on the EC2U Knowledge Hub. Datasets are published as linked data: if you
are new to it, [Linked Data Models](rdf/) introduces the graph-based models and taxonomies it relies on.

- [Datasets](datasets/index.md)
  - [Taxonomies](datasets/taxonomies.md)
  - [Organizations](datasets/organizations.md)
    - [Universities](datasets/universities.md)
    - [Units](datasets/units.md)
  - [Persons](datasets/persons.md)
  - [Programs](datasets/programs.md)
  - [Courses](datasets/courses.md)
  - [Documents](datasets/documents.md)
  - [Events](datasets/events.md)

# Vocabularies

Well-known RDF vocabularies used in the definition of [data models](#data-models) for the EC2U Knowledge Hub.

- [Simple Knowledge Organization System (SKOS)](vocabularies/skos.md)
- [Friend of a Friend (FOAF)](vocabularies/foaf.md)
- [W3C Organization Ontology](vocabularies/org.md)
- [Schema.org](vocabularies/schema.md)
    - [Learning Resource](vocabularies/schema-resource.md)
    - [Event](vocabularies/schema-event.md)
