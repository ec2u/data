/*
 * Copyright © 2020-2025 EC2U Alliance
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

import com.metreeca.flow.Locator;
import com.metreeca.flow.Request;
import com.metreeca.flow.gcp.GCPServer;
import com.metreeca.flow.gcp.services.GCPTranslator;
import com.metreeca.flow.gcp.services.GCPVault;
import com.metreeca.flow.handlers.*;
import com.metreeca.flow.rdf4j.handlers.Graphs;
import com.metreeca.flow.rdf4j.handlers.SPARQL;
import com.metreeca.flow.rdf4j.services.Graph;
import com.metreeca.flow.services.Cache.FileCache;
import com.metreeca.flow.services.Fetcher.CacheFetcher;
import com.metreeca.flow.services.Fetcher.URLFetcher;
import com.metreeca.flow.services.Translator.CacheTranslator;
import com.metreeca.flow.services.Translator.ComboTranslator;

import eu.ec2u.work.ai.OpenAnalyzer;
import eu.ec2u.work.ai.OpenEmbedder;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.net.URI;
import java.nio.file.Paths;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.flow.Locator.path;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.Response.SeeOther;
import static com.metreeca.flow.json.formats.JSON.codec;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf4j.services.Graph.graph;
import static com.metreeca.flow.services.Cache.cache;
import static com.metreeca.flow.services.Fetcher.fetcher;
import static com.metreeca.flow.services.Translator.translator;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.json.JSONCodec.json;
import static com.metreeca.mesh.rdf4j.RDF4J.rdf4j;
import static com.metreeca.mesh.util.Loggers.logging;

import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static eu.ec2u.work.ai.Embedder.embedder;
import static eu.ec2u.work.ai.OpenAI.openai;
import static java.lang.String.format;
import static java.time.Duration.ofDays;
import static java.util.logging.Level.FINE;
import static java.util.logging.Level.INFO;

public final class Data extends Delegator {

    private static final boolean Production=GCPServer.production();

    private static final String GraphDBServer="http://base.ec2u.net"; // !!! https
    private static final String GraphDBRepository="data-work";
    private static final String GraphDBUsr="server";
    private static final String GraphDBPwd="graphdb-server-pwd";


    static {
        logging(INFO, "com.metreeca");
        logging(FINE, "com.metreeca.mesh.rdf4j.SPARQLSelector");
    }

    static {
        System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); // ;( retrieve missing certificates
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Locator services(final Locator locator) {
        return locator

                .set(vault(), GCPVault::new)

                .set(path(), () -> Paths.get(Production ? "/tmp" : "data"))
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))
                .set(fetcher(), () -> Production ? new URLFetcher() : new CacheFetcher())

                .set(graph(), () -> new Graph(service(Data::repository)))
                .set(store(), () -> rdf4j(service(Data::repository)))
                .set(codec(), () -> json()
                        .prune(true)
                        .indent(true)
                        .base(DATA)
                )

                .set(openai(), () -> openai(service(vault()).get("openai-key")))
                .set(analyzer(), () -> new OpenAnalyzer("gpt-4o-mini"))
                .set(embedder(), () -> new OpenEmbedder("text-embedding-3-small"))

                .set(translator(), () -> new CacheTranslator(new ComboTranslator(
                        // !!! new StoreTranslator(),
                        new GCPTranslator()
                )));

    }


    private static Repository repository() {
        return repository(GraphDBRepository);
    }

    public static Repository repository(final String name) {

        final HTTPRepository repository=new HTTPRepository(format("%s/repositories/%s", GraphDBServer, name));

        repository.setUsernameAndPassword(GraphDBUsr, service(vault()).get(GraphDBPwd));

        return repository;
    }


    public static void main(final String... args) {
        new GCPServer().delegate(locator -> services(locator).get(Data::new)).start();
    }

    public static void exec(final Runnable... tasks) {
        services(new Locator()).exec(tasks).clear();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Data() {
        delegate(handler(

                new CORS(),

                new Router()

                        .path("/graphs", new Graphs().query())

                        .path("/sparql", handler(Request::route,

                                (request, forward) -> request.reply(SeeOther, URI.create(format(
                                        "https://apps.metreeca.com/self/#endpoint=%s", request.item()
                                ))),

                                new SPARQL().query()

                        )),

                new Publisher() // static collections published by GAE

                        .fallback("/index.html"),

                new Wrapper() // after publisher

                        .before(request -> request.base(BASE)), // define canonical base

                new Router()
                        .path("/cron/*", new Cron())
                        .path("/*", new EC2U())

        ));
    }

}
