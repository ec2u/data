prefix schema: <https://schema.org/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>

select ?resource ?property ?text {

    values ?type {
        skos:Concept
        schema:Event
    }

    ?resource a ?type ; ?property ?text .

    filter langmatches(lang(?text), $source)

    filter not exists {

        ?resource ?property ?translation

        filter langmatches(lang(?translation), $target)

    }

}