/*
 * Copyright © 2021-2022 EC2U Consortium
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.data;

import com.metreeca.gcp.GCPServer;
import com.metreeca.gcp.services.*;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Fetcher.CacheFetcher;
import com.metreeca.rest.services.Fetcher.URLFetcher;

import eu.ec2u.data.ports.Concepts;
import eu.ec2u.data.ports.*;
import eu.ec2u.data.tasks.*;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.work.Fallback;
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

public final class Data implements Runnable {

    private static final boolean Production=GCPServer.production();


    private static final String RootRole="root";
    private static final String RootKey="root-key";


    static {
        debug.log("com.metreeca");
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Toolbox toolbox(final Toolbox toolbox) {
        return toolbox

                .set(vault(), GCPVault::new)
                .set(store(), GCPStore::new)

                .set(storage(), () -> Paths.get(Production ? "/tmp" : "data"))
                .set(fetcher(), () -> Production ? new URLFetcher() : new CacheFetcher())
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))

                .set(graph(), () -> new Graph(repository()))
                .set(engine(), GraphEngine::new)

                .set(keywords(), () -> EC2U.Keywords);
    }


    private static String token() {
        return service(vault()).get(RootKey).orElseThrow(() ->
                new IllegalStateException(format("undefined secret <%s>", RootKey))
        );
    }

    private static Repository repository() {
        if ( Production ) {

            return new GCPRepository("graph");

        } else {

            final SPARQLRepository repository=new SPARQLRepository(EC2U.item("/sparql").stringValue());

            repository.setAdditionalHttpHeaders(Map.of("Authorization", format("Bearer %s", token())));

            return repository;

        }
    }


    public static void main(final String... args) {
        new Data().run();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        new GCPServer().delegate(toolbox -> toolbox(toolbox)

                .exec(new Namespaces())
                .exec(new Ontologies())
                .exec(new Inferences())

                .get(() -> server()

                        .with(cors())
                        .with(bearer(token(), RootRole))

                        .with(preprocessor(request -> // disable language negotiation
                                request.header("Accept-Language", "")
                        ))

                        .wrap(router()

                                .path("/graphs", graphs().query().update(RootRole))

                                .path("/sparql", route(
                                        status(SeeOther, "https://apps.metreeca.com/self/#endpoint={@}"),
                                        sparql().query().update(RootRole)
                                ))

                                .path("/cron/*", new Cron())

                                .path("/*", asset(new Fallback("/index.html"),

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

}
