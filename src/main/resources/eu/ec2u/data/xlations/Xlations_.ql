select distinct (str(?x) as ?text) ?source ?target {

    values ?source { "it"} # {"en" "pt" "ro" "de" "it" "fr" "es" "fi"}
    values ?target { "en"} # {"en" "pt" "ro" "de" "it" "fr" "es" "fi"}

    ?s ?p ?x
    filter (lang(?x) = ?source )

    optional {
        ?s ?p ?y
        filter (lang(?x) = ?target )
    }

    filter (!bound(?y))

}


limit 10