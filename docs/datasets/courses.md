---
title: Courses
---

The [EC2U Courses Dataset](http://data.ec2u.eu/courses/) provides identifying and background information about
formal academic courses offered at EC2U partner universities.

![course data model](index/courses.svg)

# Model

EC2U courses are described using a controlled subset of the [schema:Course](https://schema.org/Course) data model.

## ec2u:Course

| property                                     | description          |
| -------------------------------------------- | -------------------- |
| all [ec2u:Resource](resources.md) properties | inherited properties |
| all [schema:Thing](things.md) properties     | inherited properties |
|                                              |                      |
|                                              |                      |

# Licensing

> ❗️ To be confirmed.

[EC2U Courses Dataset](https://data.ec2u.eu/units/) © 2022 by [EC2U Alliance](https://www.ec2u.eu/) is licensed
under [Attribution-NonCommercial-NoDerivatives 4.0 International](http://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)

# Sources

Research units are crawled from different local academic sources and mapped as far as possible to the shared data model:
source analysis and integration status are detailed in the linked source sheets.

| status      | university                                                   |
| ----------- | ------------------------------------------------------------ |
| ✓           | [Pavia](../../src/main/java/eu/ec2u/data/tasks/courses/CoursesPavia.md) |
| in progress | [Coimbra](../../src/main/java/eu/ec2u/data/tasks/courses/CoursesCoimbra.md) |

# Updating

* Data sources are crawled nightly using custom data integration scripts that extract structured data from dedicated
  APIs, RSS feed, embedded HTML micro-annotations or embedded JSON/LD metadata; custom scraping from HTML content is
  currently not supported in order to improve the overall robustness of the process
