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
import com.metreeca.gcp.services.GCPVault;
import com.metreeca.http.Locator;
import com.metreeca.http.Request;
import com.metreeca.http.handlers.*;
import com.metreeca.http.services.Cache.FileCache;
import com.metreeca.http.services.Fetcher.CacheFetcher;
import com.metreeca.http.services.Fetcher.URLFetcher;
import com.metreeca.rdf4j.handlers.Graphs;
import com.metreeca.rdf4j.handlers.SPARQL;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;

import eu.ec2u.data.ports.*;
import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.net.URI;
import java.nio.file.Paths;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Locator.storage;
import static com.metreeca.http.Response.SeeOther;
import static com.metreeca.http.services.Cache.cache;
import static com.metreeca.http.services.Fetcher.fetcher;
import static com.metreeca.http.services.Logger.Level.debug;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.jsonld.codecs.JSONLD.keywords;
import static com.metreeca.jsonld.services.Engine.engine;
import static com.metreeca.rdf4j.services.Graph.graph;

import static java.lang.String.format;
import static java.time.Duration.ofDays;

public final class Data implements Runnable {

    private static final boolean Production=GCPServer.production();

    private static final String GraphDBRepository="http://34.79.93.233/repositories/data-work";
    private static final String GraphDBUsr="server";
    private static final String GraphDBPwd="graphdb-server-pwd";


    static {
        debug.log("com.metreeca");
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Locator services(final Locator locator) {
        return locator

                .set(vault(), GCPVault::new)

                .set(storage(), () -> Paths.get(Production ? "/tmp" : "data"))
                .set(fetcher(), () -> Production ? new URLFetcher() : new CacheFetcher())
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))

                .set(graph(), () -> new Graph(repository()))
                .set(engine(), GraphEngine::new)

                .set(keywords(), () -> EC2U.Keywords);
    }


    private static Repository repository() {

        final HTTPRepository repository=new HTTPRepository(GraphDBRepository);

        repository.setUsernameAndPassword(GraphDBUsr, service(vault()).get(GraphDBPwd).orElseThrow(() ->
                new IllegalStateException(format("undefined <%s> secret", GraphDBPwd))
        ));

        return repository;
    }


    public static void main(final String... args) {
        new Data().run();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        new GCPServer().delegate(locator -> services(locator)

                .get(() -> handler(

                        new CORS(),

                        new Wrapper()

                                .before(request -> request
                                        .base(EC2U.Base) // define canonical base
                                        .header("Accept-Language", "") // disable language negotiation
                                ),

                        new Router()

                                .path("/graphs", new Graphs().query())

                                .path("/sparql", handler(Request::route,

                                        (request, forward) -> request.reply(SeeOther, URI.create(format(
                                                "https://apps.metreeca.com/self/#endpoint=%s", request.item()
                                        ))),

                                        new SPARQL().query()

                                ))

                                .path("/cron/*", new Cron())

                                .path("/*", new Router()

                                        .path("/", new Resources())
                                        .path("/concepts/*", new Concepts())
                                        .path("/universities/*", new Universities())
                                        .path("/events/*", new Events())

                                )

                ))

        ).start();
    }

}
