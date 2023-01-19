Describse generic items of interest made available on the *EC2U Knowledge Hub*.

The resource data model is *abstract*, that is, is not intended to be used in isolation but only to provide a base
definition factoring generic properties shared by the specialized models defined by each [dataset](index.md).

# Model

EC2U resources are described using a controlled subset of
the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) data model.

All generic human-readable labels and descriptions are localized either in English or in one of the local EC2U partner
languages.

## ec2u:Resource

| property                                                     | description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [rdf:type](https://www.w3.org/TR/rdf-schema/#ch_type)        | a reference to the data model of the resource                |
| [dct:title](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/) | the human-readable, localized name of the resource           |
| [dct:description](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/) | a human-readable, localized description of the resource      |
| [dct:publisher](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/publisher/) | a link to the entity responsible for making the resource available |
| [dct:source](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/source/) | a link to a related resource from which the described resource is derived |
| [dct:issued](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/) | the date of formal issuance of the resource                  |
| [dct:created](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/) | the date of creation of the resource                         |
| [dct:modified](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/) | the latest date on which the resource was changed            |
| [dct:type](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/type/) | a link to a classification for the resource; must reference one the SKOS concepts managed by the *Knowledge Hub* |
| [dct:subject](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/subject/) | a link to a topic for the resource; must reference one the SKOS [concepts](https://data.ec2u.eu/concepts/) managed by the *Knowledge Hub* |
| ec2u:university                                              | a link to an EC2U partner [university](universities.md) associated with the resource |

> ❓Replace `ec2u:university` with `dct:coverage` ?
>
> ❓Convert `ec2u:Coverage` to concept scheme?

