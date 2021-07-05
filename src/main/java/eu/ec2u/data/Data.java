/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data;

import com.metreeca.gcp.GCPServer;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Logger;
import com.metreeca.rest.services.Store;

import eu.ec2u.data.handlers.*;
import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.common.iteration.CloseableIteration;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.http.HTTPRepository;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.SailConnection;
import org.eclipse.rdf4j.sail.SailException;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.io.*;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import static com.metreeca.gcp.GCPServer.production;
import static com.metreeca.json.Values.uuid;
import static com.metreeca.rdf4j.handlers.Graphs.graphs;
import static com.metreeca.rdf4j.handlers.SPARQL.sparql;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Handler.asset;
import static com.metreeca.rest.Handler.route;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.SeeOther;
import static com.metreeca.rest.Toolbox.resource;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.*;
import static com.metreeca.rest.formats.JSONLDFormat.keywords;
import static com.metreeca.rest.handlers.Publisher.publisher;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.services.Cache.cache;
import static com.metreeca.rest.services.Engine.engine;
import static com.metreeca.rest.services.Logger.Level.debug;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;
import static com.metreeca.rest.services.Store.store;
import static com.metreeca.rest.wrappers.Bearer.bearer;
import static com.metreeca.rest.wrappers.CORS.cors;
import static com.metreeca.rest.wrappers.Server.server;

import static java.lang.String.format;
import static java.time.Duration.ofDays;

public final class Data {

	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms#";

	public static final String root="root"; // root role


	static {
		debug.log("com.metreeca");
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static void main(final String... args) {
		new GCPServer().context(Base).delegate(toolbox -> toolbox

				.set(cache(), () -> new FileCache().ttl(ofDays(1)))
				.set(graph(), () -> production() ? memory() : local())

				.set(engine(), GraphEngine::new)

				.set(keywords(), () -> map(
						entry("@id", "id"),
						entry("@type", "type")
				))

				.exec(() -> service(graph()).update(task(connection -> { // !!! remove

					if ( production() ) {
						try {
							connection.clear();
							connection.add(resource(Data.class, ".brf"), EC2U.Base, RDFFormat.BINARY);
						} catch ( final IOException e ) {
							throw new UncheckedIOException(e);
						}
					}

				})))

				.get(() -> server()

						.with(cors())
						.with(bearer(uuid() /* !!! service(vault()).get("eu-ec2u-data").orElse(uuid())*/, root))

						.wrap(router()

								.path("/graphs", graphs().query().update(root))

								.path("/sparql", route(
										status(SeeOther, "https://apps.metreeca.com/self/#endpoint={@}"),
										sparql().query().update(root)
								))

								.path("/_cron/*", new Cron())

								.path("/*", asset(

										publisher(resource(Data.class, "/static"))

												.fallback("/index.html"),

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

	public static Graph local() {
		return new Graph(new HTTPRepository("http://localhost:7200/repositories/ec2u"));
	}

	public static Graph memory() {

		final String blob="graph.brf.gz";
		final String base=EC2U.Base;
		final RDFFormat format=RDFFormat.BINARY;

		final Store store=service(store());
		final Logger logger=service(logger());

		final MemoryStore memory=new MemoryStore();
		final Repository repository=new SailRepository(memory);

		try (
				final RepositoryConnection connection=repository.getConnection();
				final InputStream input=new GZIPInputStream(store.read(blob))
		) {

			time(() -> {

				try {

					connection.add(input, base, format);

				} catch ( final IOException e ) {
					throw new UncheckedIOException(e);
				}

			}).apply(t -> logger.info(Data.class, format(

					"loaded <%,d> statements in <%,d> ms", connection.size(), t

			)));

		} catch ( final IOException e ) {
			throw new UncheckedIOException(e);
		}

		memory.addSailChangedListener(event -> {
			if ( event.statementsAdded() || event.statementsRemoved() ) {

				try (
						final SailConnection connection=event.getSail().getConnection();
						final OutputStream output=new GZIPOutputStream(store.write(blob));
						final CloseableIteration<? extends Statement, SailException> statements=
								connection.getStatements(
										null, null, null, true
								)
				) {

					time(() ->

							Rio.write(() -> statements.stream().map(Statement.class::cast).iterator(), output, format)

					).apply(t -> logger.info(Data.class, format(

							"dumped <%,d> statements in <%,d> ms", connection.size(), t

					)));

				} catch ( final IOException e ) {
					throw new UncheckedIOException(e);
				}

			}
		});

		return new Graph(repository);
	}

}
