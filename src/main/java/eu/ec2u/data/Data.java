/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.core.Locator;
import com.metreeca.core.services.Cache.FileCache;
import com.metreeca.gcp.GCPServer;
import com.metreeca.gcp.services.GCPVault;
import com.metreeca.http.Request;
import com.metreeca.http.handlers.*;
import com.metreeca.http.services.Fetcher.CacheFetcher;
import com.metreeca.http.services.Fetcher.URLFetcher;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.rdf4j.handlers.Graphs;
import com.metreeca.rdf4j.handlers.SPARQL;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.offers.Offers;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.net.URI;
import java.nio.file.Paths;
import java.util.Map;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.Locator.storage;
import static com.metreeca.core.services.Cache.cache;
import static com.metreeca.core.services.Logger.Level.debug;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.Response.SeeOther;
import static com.metreeca.http.services.Fetcher.fetcher;
import static com.metreeca.jsonld.codecs.JSONLD.keywords;
import static com.metreeca.jsonld.services.Engine.engine;
import static com.metreeca.link.shapes.Link.link;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.datasets.Datasets.Dataset;

import static java.lang.String.format;
import static java.time.Duration.ofDays;
import static java.util.Map.entry;

public final class Data implements Runnable {

    private static final boolean Production=GCPServer.production();

    private static final String GraphDBServer="http://base.ec2u.net"; // !!! "https://base.ec2u.eu";
    private static final String GraphDBRepository="data-work";
    private static final String GraphDBUsr="server";
    private static final String GraphDBPwd="graphdb-server-pwd";


    static {
        debug.log("com.metreeca");
    }

    static {
        System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); // ;( retrieve missing certificates
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Locator services(final Locator locator) {
        return locator

                .set(vault(), GCPVault::new)

                .set(storage(), () -> Paths.get(Production ? "/tmp" : "data"))
                .set(fetcher(), () -> Production ? new URLFetcher() : new CacheFetcher())
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))

                .set(graph(), () -> new Graph(repository(GraphDBRepository)))
                .set(engine(), GraphEngine::new)

                .set(keywords(), () -> Map.ofEntries(
                        entry("@id", "id")
                ));
    }

    public static Repository repository(final String name) {

        final HTTPRepository repository=new HTTPRepository(format("%s/repositories/%s", GraphDBServer, name));

        repository.setUsernameAndPassword(GraphDBUsr, service(vault()).get(GraphDBPwd).orElseThrow(() ->
                new IllegalStateException(format("undefined <%s> secret", GraphDBPwd))
        ));

        return repository;
    }


    public static void exec(final Runnable... tasks) {
        services(new Locator()).exec(tasks).clear();
    }

    public static void main(final String... args) {
        new Data().run();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        new GCPServer().delegate(locator -> services(locator)

                .get(() -> handler(

                        new CORS(),

                        new Publisher() // static assets published by GAE

                                .fallback("/index.html"),

                        new Wrapper()

                                .before(request -> request.base(EC2U.Base)), // define canonical base

                        new Router()

                                .path("/graphs", new Graphs().query())

                                .path("/sparql", handler(Request::route,

                                        (request, forward) -> request.reply(SeeOther, URI.create(format(
                                                "https://apps.metreeca.com/self/#endpoint=%s", request.item()
                                        ))),

                                        new SPARQL().query()

                                ))

                                .path("/cron/*", new Cron())
                                .path("/resources/", new Resources())

                                .path("/*", new Router()

                                        .path("/", new Datasets())

                                        // !!! to be removed after metreeca/java supports resource access to collections

                                        .path("/datasets", handler(
                                                new Driver(link(OWL.SAMEAS, Dataset())),
                                                new Router().get(new Relator())
                                        ))

                                        .path("/datasets/{id}", handler(
                                                new Driver(link(OWL.SAMEAS, Dataset())),
                                                new Router().get(new Relator())
                                        ))

                                        .path("/universities/*", new Universities())
                                        .path("/units/*", new Units())
                                        .path("/offers/*", new Offers())
                                        .path("/programs/*", new Offers.Programs())
                                        .path("/courses/*", new Offers.Courses())
                                        .path("/persons/*", new Persons())
                                        .path("/events/*", new Events())
                                        .path("/concepts/*", new Concepts())

                                )

                ))

        ).start();
    }

}
