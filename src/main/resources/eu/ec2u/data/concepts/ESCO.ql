prefix esco: <http://data.europa.eu/esco/model#>
prefix dct: <http://purl.org/dc/terms/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>

construct {

    ?scheme skos:hasTopConcept ?topConcept .
    ?topConcept skos:topConceptOf ?scheme .

    ?concept a skos:Concept ;
        skos:inScheme ?scheme ;
        skos:prefLabel ?prefLabel ;
        skos:altLabel ?altLabel ;
        skos:definition ?definition ;
        skos:broader ?broader .

    ?broader skos:narrower ?concept .

} where {

    values ?scheme {
        <http://data.europa.eu/esco/concept-scheme/skills>
        <http://data.europa.eu/esco/concept-scheme/occupations>
    }

    ?concept a skos:Concept ;
        skos:broader?/skos:broader?/skos:broader?/skos:topConceptOf ?scheme ; # depth-limited
        skos:prefLabel ?prefLabel ;

    optional {

        ?scheme skos:hasTopConcept ?concept .

        bind (?concept as ?topConcept)

    }

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

        ?concept dct:dct
                [
                    esco:language ?l ;
                    esco:nodeLiteral ?t
                ]

        bind (strlang(?t, str(?l)) as ?dct)

    }

    bind (coalesce(?skos, ?dct) as ?definition)

    optional { ?concept skos:broader ?broader } # link upwards to avoid referencing lower excluded nodes

}