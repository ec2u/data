/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data;

import com.metreeca.gcp.GCPServer;
import com.metreeca.json.Shape;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Fetcher.CacheFetcher;

import eu.ec2u.data.ports.*;
import eu.ec2u.work.GCPRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.*;

import static com.metreeca.gcp.GCPServer.production;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.uuid;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rdf4j.handlers.Graphs.graphs;
import static com.metreeca.rdf4j.handlers.SPARQL.sparql;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Handler.asset;
import static com.metreeca.rest.Handler.route;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.SeeOther;
import static com.metreeca.rest.Toolbox.resource;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Wrapper.preprocessor;
import static com.metreeca.rest.Xtream.task;
import static com.metreeca.rest.formats.JSONLDFormat.keywords;
import static com.metreeca.rest.handlers.Packer.packer;
import static com.metreeca.rest.handlers.Publisher.publisher;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.services.Cache.cache;
import static com.metreeca.rest.services.Engine.engine;
import static com.metreeca.rest.services.Fetcher.fetcher;
import static com.metreeca.rest.services.Logger.Level.debug;
import static com.metreeca.rest.wrappers.Bearer.bearer;
import static com.metreeca.rest.wrappers.CORS.cors;
import static com.metreeca.rest.wrappers.Server.server;

import static java.time.Duration.ofDays;
import static java.util.Arrays.asList;
import static java.util.Collections.unmodifiableSet;
import static java.util.Map.entry;

public final class Data {

	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms#";


	public static final String root="root"; // root role


	public static final Set<String> langs=unmodifiableSet(new LinkedHashSet<>(asList(
			"en", "pt", "ro", "de", "it", "fr", "es", "fi"
	)));


	public static Shape multilingual() {
		return localized(langs);
	}


	public static Repository local() {
		return new HTTPRepository("http://localhost:7200/repositories/ec2u");
	}

	public static Repository memory() {
		return new GCPRepository();
	}


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI taxonomies=iri(Base, "/taxonomies/");
	public static final IRI wikidata=iri(Base, "/wikidata");

	public static final IRI universities=iri(Base, "/universities/");
	public static final IRI events=iri(Base, "/events/");


	//// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=iri(Name, "Resource");

	public static final IRI university=iri(Name, "university");
	public static final IRI retrieved=iri(Name, "retrieved");


	//// Universities //////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI University=iri(Name, "University");

	public static final IRI schac=iri(Name, "schac");
	public static final IRI country=iri(Name, "country");
	public static final IRI location=iri(Name, "location");
	public static final IRI image=iri(Name, "image");
	public static final IRI inception=iri(Name, "inception");
	public static final IRI students=iri(Name, "students");

	public static final IRI Coimbra=iri(Base, "/universities/1");
	public static final IRI Iasi=iri(Base, "/universities/2");
	public static final IRI Jena=iri(Base, "/universities/3");
	public static final IRI Pavia=iri(Base, "/universities/4");
	public static final IRI Poitiers=iri(Base, "/universities/5");
	public static final IRI Salamanca=iri(Base, "/universities/6");
	public static final IRI Turku=iri(Base, "/universities/7");


	//// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=iri(Name, "Event");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Theme=iri(Name, "Theme");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	static {
		debug.log("com.metreeca");
	}

	public static void main(final String... args) {
		new GCPServer().context(Base).delegate(toolbox -> toolbox

				.set(cache(), () -> new FileCache().ttl(ofDays(1)))
				.set(graph(), () -> new Graph(production() ? memory() : local()))

				.set(fetcher(), CacheFetcher::new)
				.set(engine(), GraphEngine::new)

				.set(keywords(), () -> Map.ofEntries(
						entry("@id", "id"),
						entry("@type", "type")
				))

				.exec(Data::namespaces)
				.exec(Data::ontologies)

				.get(() -> server()

						.with(cors())
						.with(bearer(uuid() /* !!! service(vault()).get("eu-ec2u-data").orElse(uuid())*/, root))

						.with(preprocessor(request -> // disable language negotiation
								request.header("Accept-Language", "")
						))

						.wrap(router()

								.path("/graphs", graphs().query().update(root))

								.path("/sparql", route(
										status(SeeOther, "https://apps.metreeca.com/self/#endpoint={@}"),
										sparql().query().update(root)
								))

								.path("/cron/*", new Cron())

								.path("/*", asset(

										production()

												? publisher("/static").fallback("/index.html")
												: packer(),

										router()

												.path("/", new Resources())
												.path("/concepts/*", new Concepts())
												.path("/universities/*", new Universities())
												.path("/events/*", new Events())

								))

						)
				)

		).start();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private static void namespaces() {
		service(graph()).update(task(connection -> {

			connection.clearNamespaces();

			Xtream.of(resource(Data.class, ".ttl")).forEach(path -> {
				try {

					Rio.createParser(RDFFormat.TURTLE).setRDFHandler(new AbstractRDFHandler() {

						@Override public void handleNamespace(final String prefix, final String uri) {

							connection.setNamespace(prefix, uri);

						}

					}).parse(path.openStream());

				} catch ( final IOException e ) {

					throw new UncheckedIOException(e);

				}

			});

		}));
	}

	private static void ontologies() {
		Xtream

				.of(

						RDF.NAMESPACE,
						RDFS.NAMESPACE,
						OWL.NAMESPACE,
						SKOS.NAMESPACE,

						resource(Data.class, ".ttl").toExternalForm()

				)

				.bagMap(new Retrieve())

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(ontologies)
				);
	}

}
