prefix wdt: <http://www.wikidata.org/prop/direct/>
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
			(max(?_students) as ?students)
			(sample(?_coordinates) as ?coordinates)

		where {

			values (?id ?university) {
				{universities}
			}

			optional { ?university wdt:P571 ?_inception }
			optional { ?university wdt:P2196 ?_students }
			optional { ?university wdt:P625 ?_coordinates }

		}

		group by ?id ?university

	}

	optional {

		{

			select ?university (min(?_country) as ?country) where {

				values (?id ?university) {
					{universities}
				}

				?university wdt:P17 ?_country

			}

			group by ?university

		}

		optional {
			?country rdfs:label ?_countryName
			filter (lang(?_countryName) = "en")
		}

		optional { ?country wdt:P625 ?_countryCoordinates }

	}

	optional {

		{

			select ?university (min(?_city) as ?city) where {

				values (?id ?university) {
					{universities}
				}

				?university wdt:P131 ?_city

			}

			group by ?university

		}

		optional {
			?city rdfs:label ?_cityName
			filter (lang(?_cityName) = "en")
		}

		optional { ?city wdt:P625 ?_cityCoordinates }

	}

}

group by ?id ?university ?inception ?students ?coordinates ?country ?city
