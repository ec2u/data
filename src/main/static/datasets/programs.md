EC2U programs are described using a controlled subset of the [Schema.org](../about/vocabularies/schema-resource.md) data
model.

| prefix  | namespace                   | description                         |
|---------|-----------------------------|-------------------------------------|
| ec2u:   | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary       |
| schema: | https://schema.org/         | [Schema.org] vocabulary |

![program data model](index/programs.svg)

# Program

| term                                         | type                                                                                                 | #    | description                                                                           |
|----------------------------------------------|------------------------------------------------------------------------------------------------------|------|---------------------------------------------------------------------------------------|
| **ec2u:Program**                             | [ec2u:Resource], [schema:EducationalOccupationalProgram] |      | EC2U Knowledge Hub program                                                            |
| [schema:hasCourse]               | [ec2u:Course]                                                                                | *    | links to courses included in the program                                              |
| [schema:provider]                  | [ec2u:Organization]                                                                    | 1    | link to the organization providing the program                                        |
| [schema:educationalLevel] | [ec2u:Topic]                                                                                  | *    | links to educational levels in the [ISCED 2011] taxonomy                  |
| [schema:about]                        | [ec2u:Topic]                                                                                  | *    | links to educational and training fields in the [ISCED-F 2013] taxonomy |

[Schema.org]: https://schema.org/

[ec2u:Resource]: ./index.md#resource

[schema:EducationalOccupationalProgram]: ../about/vocabularies/schema-resource.md#educational-occupational-program

[schema:hasCourse]: https://schema.org/hasCourse

[ec2u:Course]: courses.md#course

[schema:provider]: https://schema.org/provider

[ec2u:Organization]: organizations.md#organization

[schema:educationalLevel]: https://schema.org/educationalLevel

[ec2u:Topic]: taxonomies.md#topic

[ISCED 2011]: /taxonomies/isced-2011/

[schema:about]: https://schema.org/about

[ISCED-F 2013]: /taxonomies/isced-f-2013/
