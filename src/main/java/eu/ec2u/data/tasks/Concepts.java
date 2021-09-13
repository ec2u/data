/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.Data;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;

import static eu.ec2u.data.tasks.Loaders.exec;


final class Concepts {

	public static void main(final String... args) {
		exec(() -> service(graph()).update(task(connection -> {

			Xtream

					.of("https://op.europa.eu/o/opportal-service/euvoc-download-handler?cellarURI=http%3A%2F"
							+"%2Fpublications.europa.eu%2Fresource%2Fcellar%2F2d457b09-b648-11ea-bb7a-01aa75ed71a1"
							+".0001.01%2FDOC_1&fileName=international-education-classification-skos-ap-eu.rdf")

					.bagMap(new Retrieve())

					.batch(100*1000)

					.forEach(new Upload()
							.clear(true)
							.contexts(Data.taxonomies)
					);

			Xtream

					.of("prefix ec2u: <terms#>\n"
							+"prefix owl: <http://www.w3.org/2002/07/owl#>\n"
							+"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
							+"\n"
							+"insert { ?alias a ec2u:Theme; owl:sameAs ?resource } where {\n"
							+"\n"
							+"\tvalues (?prefix ?type) {\n"
							+"\t\t(<taxonomies/> skos:ConceptScheme)\n"
							+"\t\t(<concepts/> skos:Concept)\n"
							+"\t}\n"
							+"\n"
							+"\t?resource a ?type\n"
							+"\n"
							+"\tbind(iri(concat(str(?prefix), str(?resource))) as ?alias)\n"
							+"\n"
							+"}"
					)

					.forEach(new Update()
							.base(Data.Base)
							.insert(Data.taxonomies)
					);

		})));
	}

}
