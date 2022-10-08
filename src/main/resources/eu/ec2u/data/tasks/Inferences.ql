prefix ec2u: <https://data.ec2u.eu/terms/>
prefix skos:	<http://www.w3.org/2004/02/skos/core#>
prefix void: <http://rdfs.org/ns/void#>
prefix org:	<http://www.w3.org/ns/org#>
prefix schema:	<https://schema.org/>
prefix dct:	<http://purl.org/dc/terms/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>


#### Compute Datasets Size #############################################################################################

delete where {

	?dataset a ec2u:Dataset;
		void:entities ?entities

};

insert {

	?dataset void:entities ?entities

} where {

	{ select ?dataset (count(distinct ?entity) as ?entities) {

		?dataset a ec2u:Dataset

		optional { ?dataset void:uriSpace ?space }

		bind (coalesce(?space, str(?dataset)) as ?prefix)

		?class rdfs:subClassOf ec2u:Resource;
			void:uriSpace ?prefix;
			^a ?entity

    } group by ?dataset }

};


#### Compute Dataset Subject Partitions Size ###########################################################################

delete where  {

    ?dataset void:subset ?subset .
    ?subset dct:subject ?concept; void:property ?property; void:entities ?entities .
    ?concept dct:extent ?subset .

};

insert {

	?dataset void:subset ?subset .
	?concept dct:extent ?subset .

	?subset
		dct:subject ?concept ;
		void:property ?property ;
		void:entities ?entities .

} where {

    bind (bnode() as ?subset)

	{ select ?dataset ?property ?concept (count(distinct ?entity) as ?entities) {

		values ?property {
			dct:subject
			org:classification
			schema:educationalLevel
		}

		?dataset a ec2u:Dataset

		optional { ?dataset void:uriSpace ?space }

		bind (coalesce(?space, str(?dataset)) as ?prefix)

		?class rdfs:subClassOf ec2u:Resource;
			void:uriSpace ?prefix;
			^a ?entity .

		?entity ?property ?concept .

    } group by ?dataset ?property ?concept }

};


#### Compute Dataset University Partitions Size ########################################################################

delete where  {

    ?dataset void:subset ?subset .
    ?subset ec2u:university ?university; void:entities ?entities .
    ?university dct:extent ?subset .

};

insert {

	?dataset void:subset ?subset .
	?university dct:extent ?subset .

	?subset
		ec2u:university ?university ;
		void:entities ?entities .

} where {

    bind (bnode() as ?subset)

	{ select ?dataset ?university (count(distinct ?entity) as ?entities) {

		?dataset a ec2u:Dataset

		optional { ?dataset void:uriSpace ?space }

		bind (coalesce(?space, str(?dataset)) as ?prefix)

		?class rdfs:subClassOf ec2u:Resource;
			void:uriSpace ?prefix;
			^a ?entity .

		?entity ec2u:university ?university .

    } group by ?dataset ?university }

};


#### Compute Concept Schemes Size #####################################################################################

delete  {

	?scheme dct:extent ?concepts_ .

}

insert {

	?scheme dct:extent ?concepts .

}

where {

	{ select ?scheme (count(distinct ?concept) as ?concepts) {

		?scheme a skos:ConceptScheme .
		?concept skos:inScheme ?scheme .

    } group by ?scheme }

	optional { ?scheme dct:extent ?concepts_ }

};
