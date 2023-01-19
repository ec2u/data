# Model

EC2U allied universities are described using a controlled subset of
the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended with:

* [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations
* some internal specialized properties

## ec2u:University

| property                                                     | definition                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| all [ec2u:Resource](/datasets/resources) properties                 | inherited properties                                         |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#labels) | the human-readable, localized offical name of the institution |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#labels) | human-readable, localized alternate/shortened names for the institution |
| ec2u:schac                                                   | the [SCHAC code](https://wiki.uni-foundation.eu/pages/viewpage.action?pageId=12746935) of the institution |
| ec2u:image                                                   | the URL of a generic outdoor image                           |


# Sources

* static content from application source code
* background information extracted from [Wikidata](https://www.wikidata.org/)

# Updating

* base static content is updated on demand by manually editing application source code
* background information extracted from Wikidata is crawled nightly using custom data integration scripts that extract
  structured data from its public SPARQL endpoint
