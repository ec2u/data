> **⚠️** **Work in progress…**

Shared resources published on the EC2U Knowledge Hub.

# Data Model

![resource data model](index/resources.svg)

All generic human-readable labels and descriptions are localized either in English or in one of the local EC2U partner
languages.

| prefix | namespace                                   | description                                                                                                    |
|--------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/                 | EC2U Knowledge Hub vocabulary                                                                                  |
| rdf:   | http://www.w3.org/1999/02/22-rdf-syntax-ns# | [Resource Description Framework 1.1 (RDF)](https://www.w3.org/TR/2014/REC-rdf11-concepts-20140225/) vocabulary |
| rdfs:  | http://www.w3.org/2000/01/rdf-schema#       | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/) vocabulary                                        |
|        |                                             |                                                                                                                |

## Resource

> *:information_source:* Resource data models are not intended to be used in isolation but only to provide base
> definitions factoring generic properties shared by the specialised models defined by each [dataset](index.md).

| term                                                                    | type                                    | #    | definition                                                                                                                             |
|-------------------------------------------------------------------------|-----------------------------------------|------|----------------------------------------------------------------------------------------------------------------------------------------|
| ***[rdfs:Resource](https://www.w3.org/TR/rdf-schema/#ch_resource)***    |                                         |      | a resource included in the EC2U Knowledge Hub                                                                                          |
| [rdf:type](https://www.w3.org/TR/rdf-schema/#ch_type)                   | id                                      | *    | links to RDF classes the resources is an instance of                                                                                   |
| [rdfs:label](https://www.w3.org/TR/rdf-schema/#ch_label)                | text {maxLength(100)}                   | 1    | human readable label for the resource; should uniquely identify the entity even out of context and optimally not exceed 50 characters  |
| [rdfs:comment](https://www.w3.org/TR/rdf-schema/#ch_comment)            | text {maxLength(1000)}                  | 0..1 | human readable label for the resource; should uniquely identify the entity even out of context and optimally not exceed 500 characters |
| [rdfs:seeAlso](https://www.w3.org/TR/rdf-schema/#ch_seealso)            | id                                      | *    | links to other resource describing the same subject                                                                                    |
| [rdfs:isDefinedBy](https://www.w3.org/TR/rdf-schema/#ch_isdefinedby)    | id                                      | 0..1 | link to a human or machine-readable specification providing a formal definition of the resource or its data model                      |
| **ec2u:Resource**                                                       | [rdfs:Resource](#resource)              |      | a resource included in one of the EC2U Knowledge Hub [datasets](./index.md)                                                            |
| ec2u:synced                                                             | instant                                 | 0..1 | timestamp of the last synchronisation of the resource description with its primary data source                                         |
| ec2u:owner                                                              | [org:Organization](agents#organization) | 0..1 | link to an organisation responsible for providing the resource to the EC2U Knowledge Hub; usually  one the EC2U partner university     |
| *dataset* = ^[rdfs:member](https://www.w3.org/TR/rdf-schema/#ch_member) | [ec2u:Dataset](./index.md)              | 0..1 | link to the EC2U Knowledge Hub dataset the resource belongs to                                                                         |

