/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.json.Frame;
import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.assets.Graph;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.assets.Logger;

import eu.ec2u.data.Data;
import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;

import static com.metreeca.json.Values.iri;
import static com.metreeca.rdf4j.assets.Graph.graph;
import static com.metreeca.rest.Context.asset;
import static com.metreeca.rest.Context.resource;
import static com.metreeca.rest.assets.Logger.logger;

import static eu.ec2u.work.Work.exec;


final class Load {

	@Test void namespaces() {
		exec(new Runnable() {

			private final Graph graph=asset(graph());
			private final Logger logger=asset(logger());

			@Override public void run() {
				graph.exec(connection -> {
					try {

						connection.clearNamespaces();

						Files.walk(Paths.get(resource(Data.class, "schemas").toURI()))
								.filter(path -> path.toString().endsWith(".ttl"))
								.forEach(path -> {
									try {

										Rio.createParser(RDFFormat.TURTLE).setRDFHandler(new AbstractRDFHandler() {

											@Override public void handleNamespace(final String prefix,
													final String uri) {

												logger.info(this, String.format("@prefix %s: <%s>", prefix, uri));
												connection.setNamespace(prefix, uri);
											}

										}).parse(Files.newInputStream(path));

									} catch ( final IOException e ) {

										throw new UncheckedIOException(e);

									}
								});

					} catch ( final URISyntaxException ignored ) {


					} catch ( final IOException e ) {

						throw new UncheckedIOException(e);

					}

				});
			}
		});
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
