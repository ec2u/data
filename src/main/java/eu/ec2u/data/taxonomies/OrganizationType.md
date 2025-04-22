- OrganizationType.ttl contains a SKOS taxonomy in Turtle format
    - convert all concepts to Java constants according to the following patterns
        - top-level concepts
            ```java
            SKOSConcept UNIVERSITY=new SKOSConceptFrame()
                .id(ORGANIZATIONS.resolve("/university"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame()) // !!! implied by topConceptOf
                .prefLabel(map(entry(EN, "University")));
            ```
        - child concepts
            ```java
            SKOSConcept AREA=new SKOSConceptFrame()
                .id(uri(UNIVERSITY.id()+"/area"))
                .inScheme(new OrganizationTypeFrame()) // !!! implied by broader
                .prefLabel(map(entry(EN, "Research Area")))
                .definition(map(entry(EN, """
                        Thematic collaboration area gathering researchers from different disciplines to advance \
                        multidisciplinary research and education across faculty boundaries, create platforms for \
                        networks, business collaboration, innovations and strategic partnerships; part of the formal \
                        organization of the University with an appointed head/board."""
                )));
            ```
- take into account that concepts may be nested at multipl levels: build hierarchical ids accordingly
- reflow descriptions removing newlines making absolutely sure line width doesn't exceed 100 chars