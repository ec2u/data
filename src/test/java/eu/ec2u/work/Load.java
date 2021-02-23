/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.json.Frame;
import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.schemas.EC2U;
import eu.ec2u.data.schemas.EWP;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.junit.jupiter.api.Test;

import static com.metreeca.json.Values.iri;
import static com.metreeca.rdf4j.assets.Graph.graph;
import static com.metreeca.rest.Context.asset;
import static com.metreeca.rest.Context.resource;

import static eu.ec2u.work.Work.exec;


final class Load {

	@Test void namespaces() {
		exec(() -> asset(graph()).exec(connection -> {

			connection.setNamespace("ec2u", EC2U.Name);
			connection.setNamespace("ewp", EWP.Name);

			connection.setNamespace("rdf", RDF.NAMESPACE);
			connection.setNamespace("rdfs", RDFS.NAMESPACE);
			connection.setNamespace("xsd", XSD.NAMESPACE);
			connection.setNamespace("owl", OWL.NAMESPACE);
			connection.setNamespace("skos", SKOS.NAMESPACE);
			connection.setNamespace("void", VOID.NAMESPACE);

		}));
	}

	@Test void universities() {
		exec(() -> Xtream

				.from(EC2U.Universities.values())

				.bagMap(Frame::model)

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.universities)
				)

		);
	}

	@Test void ontologies() {
		exec(() -> Xtream

				.of(".ttl", "EWP.ttl")

				.map(path -> resource(EC2U.class, path).toString())

				.bagMap(new Retrieve())

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.ontologies)
				)
		);
	}

	@Test void wikidata() {
		exec(() -> Xtream

				.of("?item wdt:P463 wd:Q105627243") // <member of> <EC2U>

				.sink(new WikidataMirror()
						.contexts(iri(EC2U.Name, "wikidata"))
				)
		);
	}

}
