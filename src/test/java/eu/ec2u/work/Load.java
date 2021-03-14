/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.json.Frame;
import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.Data;
import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
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
import static com.metreeca.rdf4j.assets.Graph.txn;
import static com.metreeca.rest.Context.asset;
import static com.metreeca.rest.Context.resource;
import static com.metreeca.rest.assets.Logger.logger;

import static eu.ec2u.work.Work.exec;


final class Load {

	@Test void namespaces() {
		exec(new Runnable() {

			@Override public void run() {
				asset(graph()).exec(connection -> {
					try {

						connection.clearNamespaces();

						connection.setNamespace("skos", SKOS.NAMESPACE);

						Files.walk(Paths.get(resource(Data.class, "schemas").toURI()))
								.filter(path -> path.toString().endsWith(".ttl"))
								.forEach(path -> {
									try {

										Rio.createParser(RDFFormat.TURTLE).setRDFHandler(new AbstractRDFHandler() {

											@Override public void handleNamespace(final String prefix,
													final String uri) {

												asset(logger()).info(this, String.format("@prefix %s: <%s>", prefix,
														uri));
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

				.from(

						Xtream.of(".ttl", "EWP.ttl").map(path -> resource(EC2U.class, path).toString()),
						Xtream.of(SKOS.NAMESPACE)

				)

				.bagMap(new Retrieve())

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.ontologies)
				)
		);
	}

	@Test void taxonomies() {
		exec(() -> asset(graph()).exec(txn(connection -> {

			Xtream

					.of("https://op.europa.eu/o/opportal-service/euvoc-download-handler?cellarURI=http%3A%2F"
							+"%2Fpublications.europa.eu%2Fresource%2Fcellar%2F2d457b09-b648-11ea-bb7a-01aa75ed71a1"
							+".0001.01%2FDOC_1&fileName=international-education-classification-skos-ap-eu.rdf")

					.bagMap(new Retrieve())

					.batch(100*1000)

					.forEach(new Upload()
							.clear(true)
							.contexts(EC2U.taxonomies)
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
							.base(EC2U.Base)
							.insert(EC2U.taxonomies)
					);

		})));
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
