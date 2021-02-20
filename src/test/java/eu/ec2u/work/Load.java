/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.schemas.EC2U;
import eu.ec2u.data.schemas.EWP;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.rio.*;
import org.junit.jupiter.api.Test;

import java.io.*;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.literal;
import static com.metreeca.rdf4j.assets.Graph.graph;
import static com.metreeca.rest.Context.asset;
import static com.metreeca.rest.Context.input;
import static eu.ec2u.data.schemas.EC2U.university;
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

	@Test void ontologies() {
		exec(() -> Xtream

				.of(".ttl", "EWP.ttl")

				.bagMap(path -> {
					try ( final InputStream input=input(EC2U.class, path) ) {

						return Rio.parse(input, EC2U.Base, RDFParserRegistry
								.getInstance()
								.getFileFormatForFileName(path)
								.orElse(RDFFormat.TURTLE)
						);

					} catch ( final IOException e ) {
						throw new UncheckedIOException(e);
					}
				})

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.ontologies)
				)
		);
	}

	@Test void universities() {
		exec(() -> Xtream

				.from(EC2U.Universities.entrySet())

				.bagMap(university -> frame(university(university.getKey()))

						.set(RDF.TYPE).value(EC2U.University)
						.set(RDFS.LABEL).value(literal(university.getValue()))

						.set(EC2U.shac).value(literal(university.getKey()))

						.model()
				)

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.universities)
				)

		);
	}

}
