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
import com.metreeca.flow.gcp.GCPServer;
import com.metreeca.flow.gcp.services.GCPVault;
import com.metreeca.flow.http.Request;
import com.metreeca.flow.http.handlers.*;
import com.metreeca.flow.http.services.Fetcher.CacheFetcher;
import com.metreeca.flow.http.services.Fetcher.URLFetcher;
import com.metreeca.flow.rdf4j.handlers.Graphs;
import com.metreeca.flow.rdf4j.handlers.SPARQL;
import com.metreeca.flow.services.Cache.FileCache;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.text.services.Translator.CacheTranslator;

import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.embeddings.EmbeddingCreateParams;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.courses.Courses;
import eu.ec2u.data.datasets.documents.Documents;
import eu.ec2u.data.datasets.events.Events;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.persons.Persons;
import eu.ec2u.data.datasets.programs.Programs;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.units.Units;
import eu.ec2u.data.datasets.universities.Universities;
import eu.ec2u.data.services.Pipelines;
import eu.ec2u.data.services.Resources;
import eu.ec2u.work.ai.Embedder.CacheEmbedder;
import eu.ec2u.work.ai.open.OpenAI;
import eu.ec2u.work.ai.open.OpenAnalyzer;
import eu.ec2u.work.ai.open.OpenEmbedder;
import eu.ec2u.work.ai.open.OpenTranslator;
import eu.ec2u.work.ai.store.StoreTranslator;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.http.HTTPRepository;

import java.net.URI;
import java.nio.file.Paths;
import java.time.Duration;

import static com.metreeca.flow.Locator.path;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Handler.handler;
import static com.metreeca.flow.http.Response.SEE_OTHER;
import static com.metreeca.flow.http.services.Fetcher.fetcher;
import static com.metreeca.flow.json.formats.JSON.codec;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf4j.RDF4J.repository;
import static com.metreeca.flow.services.Cache.cache;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.mesh.json.JSONCodec.json;
import static com.metreeca.mesh.rdf4j.RDF4JStore.rdf4j;
import static com.metreeca.shim.Loggers.logging;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.work.ai.Analyzer.analyzer;
import static eu.ec2u.work.ai.Embedder.embedder;
import static eu.ec2u.work.ai.open.OpenAI.openai;
import static java.lang.String.format;
import static java.time.Duration.ofDays;
import static java.util.logging.Level.INFO;

@SuppressWarnings("OverlyCoupledClass")
public final class Data extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";

    public static final URI DATA=uri(BASE);


    private static final boolean PRODUCTION=GCPServer.production();

    private static final String GDB_SERVER="https://graphdb.ec2u.net";
    private static final String GDB_REPOSITORY="data-next";
    private static final String GDB_USR="gdb-server-usr";
    private static final String GDB_PWD="gdb-server-pwd";


    static {
        logging(INFO);
    }

    static {
        System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); // ;( retrieve missing certificates
    }


    private static Repository gdb() {

        final Vault vault=service(vault());

        final HTTPRepository repository=new HTTPRepository(format("%s/repositories/%s", GDB_SERVER, GDB_REPOSITORY));

        repository.setUsernameAndPassword(vault.get(GDB_USR), vault.get(GDB_PWD));

        return repository;
    }

    private static void chat(final ChatCompletionCreateParams.Builder builder) {
        builder
                .model("gpt-4o-mini")
                .seed(0)
                .temperature(0)
                .maxCompletionTokens(4096);
    }

    private static void embedding(final EmbeddingCreateParams.Builder builder) {
        builder.model("text-embedding-3-small");
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Locator services(final Locator locator) {
        return locator

                .set(vault(), GCPVault::new)

                .set(path(), () -> Paths.get(PRODUCTION ? "/tmp" : "data"))
                .set(cache(), () -> new FileCache().ttl(ofDays(1)))
                .set(fetcher(), () -> PRODUCTION ? new URLFetcher() : new CacheFetcher().ignore(
                        "http://localhost:2025/", // local ai crawler microservice
                        "https://docs.google.com/spreadsheets/"
                ))

                .set(repository(), Data::gdb)

                .set(store(), () -> rdf4j(service(repository())))
                .set(codec(), () -> json()
                        .prune(true)
                        .indent(true)
                        .base(DATA)
                )

                .set(openai(), () -> new OpenAI(service(vault()).get("openai-key"), builder -> builder
                        .timeout(Duration.ofSeconds(60))
                ))

                .set(translator(), () -> new CacheTranslator(new StoreTranslator(new OpenTranslator(Data::chat))))
                .set(analyzer(), () -> new OpenAnalyzer(Data::chat))
                .set(embedder(), () -> new CacheEmbedder(new OpenEmbedder(Data::embedding)));

    }


    public static void main(final String... args) {
        new GCPServer().delegate(locator -> services(locator).get(Data::new)).start();
    }

    public static void exec(final Runnable task) {
        try ( final Locator locator=services(new Locator()) ) { locator.exec(task); }
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Data() {
        delegate(handler(

                new CORS(),

                new Router()

                        .path("/graphs", new Graphs().query())

                        .path("/sparql", handler(Request::route,

                                (request, forward) -> request.reply(SEE_OTHER, URI.create(format(
                                        "https://apps.metreeca.com/self/#endpoint=%s", request.item()
                                ))),

                                new SPARQL().query()

                        )),

                new Publisher() // static assets published by GAE

                        .fallback("/index.html"),

                new Wrapper() // after publisher

                        .before(request -> request.base(BASE)), // define canonical base

                new Router()

                        .path("/", new Datasets.Handler())
                        .path("/taxonomies/*", new Taxonomies.Handler())
                        .path("/organizations/*", new Organizations.Handler())
                        .path("/universities/*", new Universities.Handler())
                        .path("/units/*", new Units.Handler())
                        .path("/persons/*", new Persons.Handler())
                        .path("/programs/*", new Programs.Handler())
                        .path("/courses/*", new Courses.Handler())
                        .path("/documents/*", new Documents.Handler())
                        .path("/events/*", new Events.Handler())

                        .path("/resources/*", new Resources.Handler())
                        .path("/pipelines/*", new Pipelines.Handler())

        ));
    }

}
