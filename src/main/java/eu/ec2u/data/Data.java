/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data;

import com.metreeca.gcp.GCPServer;
import com.metreeca.gcp.services.*;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Fetcher.CacheFetcher;

import eu.ec2u.data.ports.*;
import eu.ec2u.data.tasks.Namespaces;
import eu.ec2u.data.tasks.Ontologies;
import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;

import java.nio.file.Paths;
import java.util.Map;

import static com.metreeca.rdf4j.handlers.Graphs.graphs;
import static com.metreeca.rdf4j.handlers.SPARQL.sparql;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Handler.asset;
import static com.metreeca.rest.Handler.route;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.SeeOther;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Toolbox.storage;
import static com.metreeca.rest.Wrapper.preprocessor;
import static com.metreeca.rest.formats.JSONLDFormat.keywords;
import static com.metreeca.rest.handlers.Publisher.publisher;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.services.Cache.cache;
import static com.metreeca.rest.services.Engine.engine;
import static com.metreeca.rest.services.Fetcher.fetcher;
import static com.metreeca.rest.services.Logger.Level.debug;
import static com.metreeca.rest.services.Store.store;
import static com.metreeca.rest.services.Vault.vault;
import static com.metreeca.rest.wrappers.Bearer.bearer;
import static com.metreeca.rest.wrappers.CORS.cors;
import static com.metreeca.rest.wrappers.Server.server;

import static java.lang.String.format;
import static java.time.Duration.ofDays;
import static java.util.Map.entry;

public final class Data {

    private static final boolean production=true; // !!!  =GCPServer.production();


    private static final String root="root"; // root role


    static {
        debug.log("com.metreeca");
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Toolbox toolbox(final Toolbox toolbox) {
        return toolbox

                .set(vault(), GCPVault::new)
                .set(store(), GCPStore::new)

                .set(storage(), () -> Paths.get("data"))
                .set(fetcher(), CacheFetcher::new)
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))

                .set(graph(), () -> new Graph(repository()))
                .set(engine(), GraphEngine::new)

                .set(keywords(), () -> Map.ofEntries(
                        entry("@id", "id"),
                        entry("@type", "type")
                ));
    }


    private static String token() {
        return service(vault()).get("root-key").orElse("");
    }

    private static Repository repository() {
        if ( production ) {

            return new GCPRepository("graph");

        } else {

            final SPARQLRepository repository=new SPARQLRepository("https://data.ec2u.cc/sparql"); // !!! EC2U.Base

            repository.setAdditionalHttpHeaders(Map.of("Authorization", format("Bearer %s", token())));

            return repository;

        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        new GCPServer().delegate(toolbox -> toolbox(toolbox)

                .exec(new Namespaces())
                .exec(new Ontologies())

                .get(() -> server()

                        .with(cors())
                        .with(bearer(token(), root))

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

                                        publisher("/static")

                                                .fallback("/index.html"),

                                        preprocessor(request -> request.base(EC2U.Base)).wrap(router()

                                                .path("/", new Resources())
                                                .path("/concepts/*", new Concepts())
                                                .path("/universities/*", new Universities())
                                                .path("/events/*", new Events())

                                        )

                                ))

                        )
                )

        ).start();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Data() { }

}
