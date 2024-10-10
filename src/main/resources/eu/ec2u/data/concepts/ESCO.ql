prefix esco: <http://data.europa.eu/esco/model#>
prefix dct: <http://purl.org/dc/terms/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

construct {

    ?scheme a skos:ConceptScheme ;
        skos:hasTopConcept ?topConcept .

    ?topConcept a skos:Concept ;
        skos:topConceptOf ?scheme ;
        skos:inScheme ?scheme .

    ?concept a skos:Concept ;
        skos:inScheme ?scheme ;
        skos:notation ?notation ;
        skos:prefLabel ?prefLabel ;
        skos:altLabel ?altLabel ;
        skos:definition ?definition ;
        skos:broader ?broader .

    ?broader a skos:Concept ;
        skos:inScheme ?scheme ;
        skos:narrower ?concept .

} where {

    values ?scheme {
        <http://data.europa.eu/esco/concept-scheme/skills>
        <http://data.europa.eu/esco/concept-scheme/occupations>
    }

    ?concept a skos:Concept ;
        skos:broader?/skos:broader?/skos:broader?/skos:topConceptOf ?scheme . # depth-limited

    optional {

        ?scheme skos:hasTopConcept ?concept .

        bind (?concept as ?topConcept)

    }

    optional {
        ?concept skos:notation ?notation
        filter (datatype(?notation) = xsd:string)
    }

    optional { ?concept skos:prefLabel ?prefLabel }
    optional { ?concept skos:altLabel ?altLabel }

    optional {

        ?concept skos:definition
                [
                    esco:language ?l ;
                    esco:nodeLiteral ?t
                ]

        bind (strlang(?t, str(?l)) as ?skos)

    }

    optional {

        ?concept dct:description
                [
                    esco:language ?l ;
                    esco:nodeLiteral ?t
                ]

        bind (strlang(?t, str(?l)) as ?dct)

    }

    bind (coalesce(?skos, ?dct) as ?definition)

    optional { ?concept skos:broader ?broader } # link upwards to avoid referencing lower excluded nodes

}