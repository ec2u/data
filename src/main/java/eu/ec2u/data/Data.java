/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data;

import com.metreeca.gcp.GCPServer;
import com.metreeca.gcp.services.GCPRepository;
import com.metreeca.json.Shape;
import com.metreeca.json.Values;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Fetcher.CacheFetcher;

import eu.ec2u.data.ports.*;
import eu.ec2u.data.tasks.Namespaces;
import eu.ec2u.data.tasks.Ontologies;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.util.Map;
import java.util.Set;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.uuid;
import static com.metreeca.json.shapes.And.and;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rdf4j.handlers.Graphs.graphs;
import static com.metreeca.rdf4j.handlers.SPARQL.sparql;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Handler.asset;
import static com.metreeca.rest.Handler.route;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.SeeOther;
import static com.metreeca.rest.Wrapper.preprocessor;
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
import static java.util.Map.entry;

public final class Data {

	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms/";


	public static final String root="root"; // root role


	public static final Set<String> langs=Set.of(
			"en", "pt", "ro", "de", "it", "fr", "es", "fi"
	);


	public static Shape multilingual() {
		return localized(langs);
	}


	public static Repository development() {
		return new HTTPRepository("http://localhost:7200/repositories/ec2u");
	}

	public static Repository production() {
		return new GCPRepository("graph");
	}


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI concepts=iri(Base, "/concepts/");
	public static final IRI wikidata=iri(Base, "/wikidata");
	public static final IRI inferences=iri(Base, "/inferences");

	public static final IRI events=iri(Base, "/events/");
	public static final IRI locations=iri(Base, "/locations/");


	//// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=iri(Name, "Resource");

	public static final IRI university=iri(Name, "university");
	public static final IRI retrieved=iri(Name, "retrieved");

	public static Shape Meta() {
		return and(

				field(DCTERMS.PUBLISHER, optional(),
						field(RDFS.LABEL, localized(langs))
				),

				field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),
				field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME))

		);
	}

	public static Shape Resource() {
		return and(

				field(RDFS.LABEL, localized(langs)),
				field(RDFS.COMMENT, localized(langs)),

				field(university, required(),
						field(RDFS.LABEL, localized(langs))
				)

		);
	}


	//// Universities //////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI University=iri(Name, "University");

	public static final IRI schac=iri(Name, "schac");
	public static final IRI country=iri(Name, "country");
	public static final IRI location=iri(Name, "location");
	public static final IRI image=iri(Name, "image");
	public static final IRI inception=iri(Name, "inception");
	public static final IRI students=iri(Name, "students");


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
				.set(graph(), () -> new Graph(GCPServer.production() ? production() : development()))

				.set(fetcher(), CacheFetcher::new)
				.set(engine(), GraphEngine::new)

				.set(keywords(), () -> Map.ofEntries(
						entry("@id", "id"),
						entry("@type", "type")
				))

				.exec(new Namespaces())
				.exec(new Ontologies())

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

										GCPServer.production()

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

	private Data() { }

}
