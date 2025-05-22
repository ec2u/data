# Data Model

EC2U assets are described using a controlled subset
of
the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) data model.

| prefix | namespace                   | definition                                                                                                                |
|--------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary                                                                                             |
| dct:   | http://purl.org/dc/terms/   | [Dublin Core](https://www.dublincore.org) [DCMI Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) |

![dataset data model](index/assets.svg#75)

## Asset

| term                                                                                                                        | type                          | #    | description                                                                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------|------|---------------------------------------------------------------------------------------------------------------------------------------------|
| **ec2u:Asset**                                                                                                              | [rdfs:Resource](resources.md) |      | EC2U Knowledge Hub asset                                                                                                                    |
| [dct:title](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/)                                  | text                          | 1    | complete name                                                                                                                               |
| [dct:alternative](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/alternative/)                      | text                          | 0..1 | shortened / informal name                                                                                                                   |
| [dct:description](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/)                      | text                          | 0..1 | content and intended usage description                                                                                                      |
| [dct:publisher](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/publisher)       | [org:Organization](agents.md) | 0..1 | link to the organisation responsible for publishing the asset                                                                               |
| [dct:source](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/source)             | [rdfs:Resource](resources.md) | 0..1 | link to a third-party source the asset was derived from                                                                                     |
| [dct:created](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/)                              | date                          | 0..1 | creation date                                                                                                                               |
| [dct:issued](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/)                                | date {≥ dct:created}          | 0..1 | formal issuance date; only assets with a defined issuance date are exposed through user facing search interfaces                            |
| [dct:modified](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/)                            | date {≥ dct:created}          | 0..1 | latest modification date                                                                                                                    |
| [dct:rights](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/rights)             | string                        | 0..1 | copyright statement (for instance, `Copyright © 2022 EC2U Alliance`)                                                                        |
| [dct:accessRights](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/accessRights) | text                          | 0..1 | human-readable, localised description of access rights and policies for partners and other stakeholders                                     |
| [dct:license](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/license)           | [rdfs:Resource](resources.md) | *    | links to the public text of the licensing terms for the assets as a whole; entries listed in the asset may define their own licensing terms |
| [dct:extent](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/extent)             | integer                       | 0..1 | asset size in terms of referenced resources                                                                                                 |

> [!WARNING]
> Published assets, that is assets that specify a `dct:issued` date, must also include at least
> one `dct:license`.
