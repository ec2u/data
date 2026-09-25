prefix wdt: <http://www.wikidata.org/prop/direct/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

select

	?university ?inception ?students ?coordinates
	?country ?countryName ?countryCoordinates
	?city ?cityName ?cityCoordinates

where {

	values ?university {
		{universities}
	}

	optional { ?university wdt:P571 ?inception }
	optional { ?university wdt:P2196 ?students }

	optional { ?university wdt:P625 ?coordinates }

	optional {

		?university wdt:P17 ?country .

		optional {
			?country rdfs:label ?countryName
			filter (lang(?countryName) = "en")
		}

		optional { ?country wdt:P625 ?countryCoordinates }

	}

	optional {

		?university wdt:P131 ?city .

		optional {
			?city rdfs:label ?cityName
			filter (lang(?cityName) = "en")
		}

		optional { ?city wdt:P625 ?cityCoordinates }

	}

}
