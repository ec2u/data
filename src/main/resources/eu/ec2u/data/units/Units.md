Provides identifying and background information about
research and innovation units and supporting structures at EC2U partner universities.

# Model

EC2U research units and facilities are described using a controlled subset of
the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended with:

* [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations

## ec2u:Unit

| property                                                     | description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| all [ec2u:Resource](/datasets/resources) properties                 | inherited properties                                         |
| [foaf:homepage](http://xmlns.com/foaf/0.1/#term_homepage)    | the URL of an institutional home page                        |
| [foaf:mbox](http://xmlns.com/foaf/0.1/#term_mbox)            | an institutional email address                               |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#labels) | the human-readable, localized official name of the unit      |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#labels) | human-readable, localized alternate/shortened names for the unit; may be used also for informal acronyms |
| [org:identifier](https://www.w3.org/TR/vocab-org/#org:identifier) | unique machine-readable unit registration identifier         |
| [org:classification](https://www.w3.org/TR/vocab-org/#org:classification) | a link to an organization type in the `/concepts/units/` SKOS concept scheme |
| [org:unitOf](https://www.w3.org/TR/vocab-org/#org:unitOf)    | a link to a parent unit; parent links must reference a resource listed either in the [EC2U Universities Dataset](universities.md) or  in the *EC2U Research Units Dataset* |
| [org:hasUnit](https://www.w3.org/TR/vocab-org/#org:hasUnit)  | a link to a child unit; must reference a resource listed in the *EC2U Research Units Dataset* |
| [org:hasMember](https://www.w3.org/TR/vocab-org/#property-hasmember) | a link to an affilated member [staff](persons.md)            |

## ec2u:University

> ❗️ Move to [universities](universities.md)

| property                                                    | description                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [org:hasUnit](https://www.w3.org/TR/vocab-org/#org:hasUnit) | a link to a child unit; must reference a resource listed in the [research units](units.md) dataset |

## ec2u:Person

❗️ Move to [persons](persons.md)

| property                                                     | description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [org:headOf](https://www.w3.org/TR/vocab-org/#property-headof) | a link to a [research unit](units.md) the person is leading  |
| [org:memberOf](https://www.w3.org/TR/vocab-org/#property-memberof) | a link to a [research unit](units.md) the person is affiliated with |
