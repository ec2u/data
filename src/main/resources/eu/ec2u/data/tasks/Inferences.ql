prefix ec2u: <https://data.ec2u.eu/terms/>
prefix void: <http://rdfs.org/ns/void#>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>


#### Compute Dataset Size ##############################################################################################

delete {

	?dataset void:entities ?entities_

}

insert {

	?dataset void:entities ?entities

}

where {

	?dataset a ec2u:Dataset
		optional { ?dataset void:entities ?entities_ }

	{ select ?dataset (count(distinct ?entity) as ?entities) {

		?dataset a ec2u:Dataset
			optional { ?dataset void:uriSpace ?space }

		bind (coalesce(?space, str(?dataset)) as ?prefix)

		?class rdfs:subClassOf ec2u:Resource;
			void:uriSpace ?prefix;
			^a ?entity

    } group by ?dataset }

}
