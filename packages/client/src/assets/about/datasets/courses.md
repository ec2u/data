EC2U courses are described using a controlled subset of the [Schema.org](../vocabularies/schema-resource.md) data
model.

| prefix  | namespace                   | description                   |
|---------|-----------------------------|-------------------------------|
| ec2u:   | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary |
| schema: | https://schema.org/         | [Schema.org] vocabulary       |

![course data model](index/courses.svg)

# Course

| term                              | type                                                      | # | description                                                                               |
|-----------------------------------|-----------------------------------------------------------|---|-------------------------------------------------------------------------------------------|
| **ec2u:Course**                   | [ec2u:Offering], [schema:Course], [schema:CourseInstance] |   | A degree, vocational or personal development course offered by an EC2U university |
| ec2u:term                         | [ec2u:Term]                                               | * | academic terms in which the course is delivered                                           |
| [schema:instructor]               | [ec2u:Person]                                             | * | persons teaching the course                                                               |
| [schema:audience]                 | [ec2u:Topic]                                              | * | groups the course is intended for, in the [EC2U Stakeholders] taxonomy                    |
| ‹inProgram› = ^[schema:hasCourse] | [ec2u:Program]                                            | * | programs the course is part of                                                            |

# Term

Academic term in which a course is offered.

| value    | description                  |
|----------|------------------------------|
| `Annual` | the full academic year       |
| `First`  | the first (autumn) semester  |
| `Second` | the second (spring) semester |
| `Summer` | a summer school              |
| `Open`   | open enrolment               |

[ec2u:Offering]: ./index.md#offering

[schema:Course]: ../vocabularies/schema-resource.md#course

[schema:CourseInstance]: ../vocabularies/schema-resource.md#course-instance

[schema:instructor]: https://schema.org/instructor

[schema:audience]: https://schema.org/audience

[schema:hasCourse]: https://schema.org/hasCourse

[ec2u:Person]: persons.md#person

[ec2u:Program]: programs.md#program

[ec2u:Term]: #term

[ec2u:Topic]: taxonomies.md#topic

[EC2U Stakeholders]: /taxonomies/stakeholders/

[Schema.org]: https://schema.org/
