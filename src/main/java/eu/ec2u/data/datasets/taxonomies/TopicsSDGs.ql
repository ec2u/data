PREFIX schema: <https://schema.org/>


delete {

    ?s schema:about ?o

} insert {

      ?s schema:about ?_o

  } where {

    ?s schema:about ?o

    filter (contains(str(?o), '/sdgs//'))

    bind (iri(REPLACE(str(?o), '/sdgs//', '/sdgs/')) as ?_o)

}