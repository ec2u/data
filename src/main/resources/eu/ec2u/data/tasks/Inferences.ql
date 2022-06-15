prefix ec2u: <https://data.ec2u.eu/terms/>
prefix void: <http://rdfs.org/ns/void#>


#### Compute Dataset Size ##############################################################################################

delete {

	?dataset void:entities ?_entities

}

insert {

	?dataset void:entities ?entities

}

where {

	?dataset a ec2u:Dataset optional { ?dataset void:entities ?_entities }

	{ select ?dataset (count(distinct ?entity) as ?entities)  {

		?dataset a ec2u:Dataset; void:class [^a ?entity]

	} group by ?dataset }

}



