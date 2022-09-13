---
title: Persons
---

![persons data model](docs/datasets/index/persons.svg)

# Vocabularies

EC2U personnel and students are described using a controlled subset of the [FOAF](http://xmlns.com/foaf/spec/) data
model, extended with:

* the following [VIVO](https://wiki.lyrasis.org/display/VIVODOC113x/Ontology+Reference) `foaf:Person`
  subclasses for classification purposes:
  * `vivo:EmeritusFaculty`
    * `vivo:EmeritusProfessor`
  * `vivo:EmeritusLibrarian`
  * `vivo:EmeritusProfessor`
  * `vivo:FacultyMember`
  * `vivo:Librarian`
  * `vivo:NonAcademic`
  * `vivo:NonFacultyAcademic`
    * `vivo:Postdoc`
  * `vivo:Student`
    * `vivo:GraduateStudent`
    * `vivo:UndergraduateStudent`