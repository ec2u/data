prefix ec2u: <https://data.ec2u.eu/terms/>
prefix dct: <http://purl.org/dc/terms/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>

select (?l as ?label) (count(*) as ?count) (group_concat(distinct ?u; separator=", ") as ?usage){

    ?d a ec2u:Document;
       ec2u:university ?o;
       dct:subject [skos:prefLabel ?l].

    bind (strafter(str(?o), "https://data.ec2u.eu/universities/") as ?u)

}

group by ?l
order by desc(?count)