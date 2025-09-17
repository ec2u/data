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

package eu.ec2u.work;

import com.metreeca.flow.Locator;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.xml.actions.Focus;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.pipe.Store;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executor;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.uri;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.URIs.uri;
import static com.metreeca.shim.URIs.uuid;

import static java.util.Arrays.asList;
import static java.util.Map.entry;
import static java.util.Objects.requireNonNull;
import static java.util.function.Predicate.not;

/**
 * Web page fetching and resource extraction orchestrator.
 *
 * <p>Processes incoming sets of target URLs to maintain an up-to-date collection of scraped
 * pages and their extracted semantic resources. For each URL in the set:</p>
 *
 * <ul>
 *   <li>fetches the web page content</li>
 *   <li>converts HTML content to markdown format</li>
 *   <li>detects content changes through hashing</li>
 *   <li>applies extraction functions to generate or update structured data resources</li>
 * </ul>
 *
 * <p>The processing effects include:</p>
 *
 * <ul>
 *   <li>creating or updating {@link Page} metadata records with timestamps and cache information</li>
 *   <li>storing extracted markdown content for AI analysis and data extraction</li>
 *   <li>generating semantic resources through configured insert functions</li>
 *   <li>removing obsolete resources when pages become unavailable</li>
 *   <li>optimizing performance by skipping unchanged content based on hash comparison</li>
 * </ul>
 *
 * @param <T> the type of structured resource extracted from pages
 */
public final class PageKeeper<T extends Valuable> implements Function<Set<URI>, Integer> {

    private final URI pipeline;

    private final boolean incremental;

    private final Function<Page, Optional<T>> insert;
    private final Function<Page, Optional<T>> remove;

    private final Collection<? extends Valuable> annexes;

    private final Executor executor;


    private final Store store=service(store());


    /**
     * Configures a new page keeper for the specified processing pipeline.
     *
     * <p>Creates a keeper with default (empty) insert and remove functions, no annexes,
     * and the default executor. Use fluent builder methods to configure extraction behavior.</p>
     *
     * @param pipeline the URI of the processing pipeline that will manage fetched pages
     *
     * @throws NullPointerException if {@code pipeline} is {@code null}
     */
    public PageKeeper(final URI pipeline) {
        this(
                pipeline,
                false,
                page -> Optional.empty(),
                page -> Optional.empty(),
                set(),
                Locator.executor()
        );
    }


    private PageKeeper(
            final URI pipeline,
            final boolean incremental,
            final Function<Page, Optional<T>> insert,
            final Function<Page, Optional<T>> remove,
            final Collection<? extends Valuable> annexes,
            final Executor executor
    ) {

        if ( pipeline == null ) {
            throw new NullPointerException("null pipeline");
        }

        if ( insert == null ) {
            throw new NullPointerException("null insert factory");
        }

        if ( remove == null ) {
            throw new NullPointerException("null remove factory");
        }

        if ( annexes == null || annexes.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null annexes");
        }

        if ( executor == null ) {
            throw new NullPointerException("null executor");
        }

        this.pipeline=pipeline;
        this.incremental=incremental;
        this.insert=insert;
        this.remove=remove;
        this.annexes=annexes;
        this.executor=executor;
    }


    /**
     * Configures the incremental processing mode.
     *
     * <p>Incremental mode disables removal of stale resources: only new or modified pages from the
     * {@linkplain  #apply(Set) supplied URLs}  are processed; other existing pages are retained without updates./p>
     *
     * @param incremental {@code true} to enable incremental processing, {@code false} otherwise
     *
     * @return a new PageKeeper instance with the specified incremental mode
     */
    public PageKeeper<T> incremental(final boolean incremental) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                annexes,
                executor
        );
    }


    /**
     * Configures the function for extracting resources from fetched pages.
     *
     * <p>The insert function is applied to each successfully fetched page to extract
     * structured data. If the function returns a non-empty Optional, the extracted resource is stored and linked to the
     * page.</p>
     *
     * @param insert the function to extract resources from pages
     *
     * @return a new PageKeeper instance with the specified insert function
     *
     * @throws NullPointerException if {@code insert} is {@code null}
     */
    public PageKeeper<T> insert(final Function<Page, Optional<T>> insert) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the function for removing resources when pages are no longer available.
     *
     * <p>The remove function is applied when a page becomes inaccessible or is excluded
     * from processing. If the function returns a non-empty Optional, the identified resource is removed from
     * storage.</p>
     *
     * @param remove the function to identify resources for removal
     *
     * @return a new PageKeeper instance with the specified remove function
     *
     * @throws NullPointerException if {@code remove} is {@code null}
     */
    public PageKeeper<T> remove(final Function<Page, Optional<T>> remove) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                annexes,
                executor
        );
    }


    /**
     * Configures additional resources to be stored alongside extracted data.
     *
     * <p>Annexes are supplementary resources that are persistently stored during
     * each processing operation, typically containing metadata or configuration data relevant to the extraction
     * pipeline.</p>
     *
     * @param annexes the additional resources to store with each operation
     *
     * @return a new PageKeeper instance with the specified annexes
     *
     * @throws NullPointerException if {@code annexes} is {@code null}
     */
    public PageKeeper<T> annexes(final Valuable... annexes) {

        if ( annexes == null ) {
            throw new NullPointerException("null annexes");
        }

        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                asList(annexes),
                executor
        );
    }

    /**
     * Configures additional resources to be stored alongside extracted data.
     *
     * <p>Annexes are supplementary resources that are persistently stored during
     * each processing operation, typically containing metadata or configuration data relevant to the extraction
     * pipeline.</p>
     *
     * @param annexes the collection of additional resources to store with each operation
     *
     * @return a new PageKeeper instance with the specified annexes
     *
     * @throws NullPointerException if {@code annexes} is {@code null}
     */
    public PageKeeper<T> annexes(final Collection<? extends Valuable> annexes) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                annexes,
                executor
        );
    }


    /**
     * Configures the executor for concurrent page fetching operations.
     *
     * <p>The executor controls the parallelism and threading behavior for HTTP requests
     * and content processing. Using a custom executor allows fine-tuning of resource usage and request throttling.</p>
     *
     * @param executor the executor to use for concurrent operations
     *
     * @return a new PageKeeper instance with the specified executor
     *
     * @throws NullPointerException if {@code executor} is {@code null}
     */
    public PageKeeper<T> executor(final Executor executor) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                insert,
                remove,
                annexes,
                executor
        );
    }


    /**
     * Processes a set of URLs by fetching, caching, and extracting structured data.
     *
     * <p>For each URL, this method:</p>
     * <ul>
     *   <li>Fetches the web page content using HTTP GET requests</li>
     *   <li>Converts HTML content to markdown format</li>
     *   <li>Performs change detection using content hashing</li>
     *   <li>Applies insert/remove functions to extract or clean up resources</li>
     *   <li>Updates page metadata including timestamps and cache headers</li>
     *   <li>Stores both page metadata and extracted resources</li>
     * </ul>
     *
     * <p>Processing is performed concurrently using the configured executor.
     * Only pages with changed content are reprocessed, based on content hash comparison.</p>
     *
     * @param urls the set of URLs to process
     *
     * @return the number of resources successfully processed and stored
     *
     * @throws NullPointerException if {@code urls} is {@code null} or contains null value
     */
    @Override
    public Integer apply(final Set<URI> urls) {

        if ( urls == null || urls.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null urls");
        }

        final Map<URI, PageFrame> pages=map(store

                .retrieve(value(query()
                        .model(new PageFrame(true)
                                .id(uri())
                                .hash("")
                                .resource(uri())
                        )
                        .where("pipeline",
                                criterion().any(uri(pipeline))
                        )
                ))

                .values()
                .map(PageFrame::new)
                .map(page -> entry(page.id(), page))
        );


        final List<Value> insertions=list(Stream.concat(

                urls.stream()

                        .map(url -> async(executor, () -> Optional.of(url)

                                .map(URI::toString) // !!!
                                .flatMap(new GET<>(new HTML()))
                                .flatMap(new Focus())
                                .map(new Untag())
                                .stream()

                                .flatMap(body -> {

                                    final Instant now=Instant.now();
                                    final String hash=uuid(body);

                                    final boolean clean=Optional.ofNullable(pages.get(url))
                                            .map(page -> page.hash().equals(hash))
                                            .orElse(false);

                                    if ( clean ) { return Stream.empty(); } else {

                                        final PageFrame page=new PageFrame()
                                                .id(url)
                                                .fetched(now)
                                                // !!! created
                                                // !!! updated
                                                // !!! etag
                                                .hash(hash)
                                                .pipeline(pipeline);

                                        return requireNonNull(insert.apply(page.body(body)), "null insert factory value")

                                                .map(Valuable::toValue)
                                                .stream()

                                                .flatMap(value -> value.id().stream().flatMap(id -> Stream.of(
                                                        value,
                                                        page.resource(id).toValue()
                                                )));

                                    }

                                })

                                .toList()

                        ))

                        .collect(joining())
                        .flatMap(Collection::stream),

                annexes.stream()
                        .map(Valuable::toValue)

        ));


        final List<Value> removals=incremental ? list() : list(pages.values().stream()

                .filter(not(page -> urls.contains(page.id())))

                .flatMap(page -> requireNonNull(remove.apply(page), "null remove factory value").stream()
                        .flatMap(t -> Stream.of(t, page))
                )

                .map(Valuable::toValue)

        );

        store.modify(
                array(insertions),
                array(removals)
        );

        return insertions.size()+removals.size();
    }

}
