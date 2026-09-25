prefix wikibase: <http://wikiba.se/ontology#>
prefix wdt: <http://www.wikidata.org/prop/direct/>
prefix p: <http://www.wikidata.org/prop/>
prefix ps: <http://www.wikidata.org/prop/statement/>
prefix pq: <http://www.wikidata.org/prop/qualifier/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

select

	?id ?university ?inception ?students ?coordinates

	?country
	(sample(?_countryName) as ?countryName)
	(sample(?_countryCoordinates) as ?countryCoordinates)

	?city
	(sample(?_cityName) as ?cityName)
	(sample(?_cityCoordinates) as ?cityCoordinates)

where {

	{

		select

			?id ?university
			(min(?_inception) as ?inception)
			(strafter(max(concat(coalesce(str(?_date), ""), "|", str(?_students))), "|") as ?students)
			(sample(?_coordinates) as ?coordinates)
			(min(?_country) as ?country)
			(min(coalesce(?_headquarters, ?_territory)) as ?city)

		where {

			values (?id ?university) {
				{universities}
			}

			?university wdt:P17 ?_country; wdt:P131 ?_territory

			optional { ?university wdt:P159 ?_headquarters }
			optional { ?university wdt:P571 ?_inception }
			optional { ?university wdt:P625 ?_coordinates }

			optional {
				?university p:P2196 ?_count. ?_count a wikibase:BestRank; ps:P2196 ?_students
				optional { ?_count pq:P585 ?_date }
			}

		}

		group by ?id ?university

	}

	optional { ?country rdfs:label ?_countryName filter (lang(?_countryName) = "en") }
	optional { ?country wdt:P625 ?_countryCoordinates }

	optional { ?city rdfs:label ?_cityName filter (lang(?_cityName) = "en") }
	optional { ?city wdt:P625 ?_cityCoordinates }

}

group by ?id ?university ?inception ?students ?coordinates ?country ?city
