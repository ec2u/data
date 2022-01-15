prefix owl: <http://www.w3.org/2002/07/owl#>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

insert {  ?i a ?c } where {

    ?i a/rdfs:subClassOf+ ?c.

};

insert {  ?s ?q ?o } where {

    ?p rdfs:subPropertyOf+ ?q filter (!strstarts(str(?q), str(owl:)))
    ?s ?p ?o.

};

insert { ?o ?p ?s } where {

	?p rdfs:subPropertyOf*/a owl:SymmetricProperty.
	?s ?p ?o.

};