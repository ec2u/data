/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data;

import com.metreeca.gcp.assets.GCPStore;
import com.metreeca.gcp.assets.GCPVault;
import com.metreeca.jee.Server;
import com.metreeca.rdf4j.assets.Graph;
import com.metreeca.rdf4j.assets.GraphEngine;
import com.metreeca.rest.Request;
import com.metreeca.rest.assets.Logger;
import com.metreeca.rest.assets.Store;

import eu.ec2u.data.handlers.Resources;
import eu.ec2u.data.handlers.Universities;
import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.common.iteration.CloseableIteration;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.http.HTTPRepository;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;
import org.eclipse.rdf4j.sail.SailConnection;
import org.eclipse.rdf4j.sail.SailException;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import javax.servlet.annotation.WebFilter;
import java.io.*;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import static com.metreeca.json.Values.uuid;
import static com.metreeca.rdf4j.assets.Graph.graph;
import static com.metreeca.rdf4j.handlers.SPARQL.sparql;
import static com.metreeca.rest.Context.asset;
import static com.metreeca.rest.Context.resource;
import static com.metreeca.rest.Handler.fallback;
import static com.metreeca.rest.Handler.handler;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.SeeOther;
import static com.metreeca.rest.Wrapper.preprocessor;
import static com.metreeca.rest.Xtream.entry;
import static com.metreeca.rest.Xtream.map;
import static com.metreeca.rest.assets.Engine.engine;
import static com.metreeca.rest.assets.Logger.logger;
import static com.metreeca.rest.assets.Logger.time;
import static com.metreeca.rest.assets.Store.store;
import static com.metreeca.rest.assets.Vault.vault;
import static com.metreeca.rest.formats.JSONLDFormat.keywords;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.wrappers.Bearer.bearer;
import static com.metreeca.rest.wrappers.CORS.cors;
import static com.metreeca.rest.wrappers.Gateway.gateway;
import static java.lang.String.format;
import static org.eclipse.rdf4j.rio.helpers.BasicParserSettings.VERIFY_URI_SYNTAX;

@WebFilter(urlPatterns="/*") public final class Data extends Server {

	private static final boolean Production="Production".equals(System.getProperty(
			"com.google.appengine.runtime.environment", ""
	));


	public static final String Root="root"; // root role


	public static Graph local() {
		return new Graph(new HTTPRepository("http://localhost:7200/repositories/ec2u"));
	}

	public static Graph remote() {
		return new Graph(new SPARQLRepository("https://data.ec2u.eu/sparql"));
	}

	public static Graph memory() {

		final String blob="graph.brf.gz";
		final RDFFormat format=RDFFormat.BINARY;

		final Store store=asset(store());
		final Logger logger=asset(logger());

		final MemoryStore memory=new MemoryStore();
		final Repository repository=new SailRepository(memory);

		try (
				final RepositoryConnection connection=repository.getConnection();
				final InputStream input=new GZIPInputStream(store.read(blob))
		) {

			time(() -> {

				try {

					Rio.createParser(format)
							.set(VERIFY_URI_SYNTAX, false) // ;(dbpedia) ignore malformed resource ids
							.setRDFHandler(new AbstractRDFHandler() {
								@Override public void handleStatement(final Statement statement) {
									connection.add(statement);
								}
							})
							.parse(input, EC2U.Base);

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


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	public Data() {
		delegate(context -> context

				.set(vault(), GCPVault::new)
				.set(store(), GCPStore::new)

				.set(graph(), () -> Production ? memory() : local())

				.set(engine(), GraphEngine::new)

				.set(keywords(), () -> map(
						entry("@id", "id"),
						entry("@type", "type")
				))

				.exec(() -> asset(graph()).exec(connection -> {

					try {
						connection.add(resource(getClass(), ".brf"), EC2U.Base, RDFFormat.BINARY);
					} catch ( final IOException e ) {
						throw new UncheckedIOException(e);
					}

				}))

				.get(() -> gateway()

						.with(cors())
						.with(bearer(uuid() /* !!! asset(vault()).get("eu-ec2u-data").orElse(uuid())*/, Root))

						.with(preprocessor(request -> request.base(EC2U.Base)))

						.wrap(handler(Request::interactive,

								router()

										.path("/sparql", status(SeeOther, "/self/#endpoint=/sparql"))
										.path("/*", fallback("/static/index.html")),

								router()

										.path("/resources/*", new Resources())
										.path("/universities/*", new Universities())

										.path("/sparql", sparql()
												.query()
												.update(Root)
										)

								//.path("/_cron/*", new Cron())

						))
				)
		);
	}

}
