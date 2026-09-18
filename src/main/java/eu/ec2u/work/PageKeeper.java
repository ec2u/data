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
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.actions.Focus;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.pipe.Store;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executor;
import java.util.function.Function;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.uri;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.URIs.uri;
import static com.metreeca.shim.URIs.uuid;

import static java.lang.String.format;
import static java.util.Arrays.asList;
import static java.util.Comparator.comparing;
import static java.util.Map.entry;
import static java.util.Objects.requireNonNull;
import static java.util.function.Predicate.not;

/**
 * Web page fetching and resource extraction orchestrator.
 *
 * <p>Processes incoming sets of target URLs to maintain an up-to-date collection of scraped
 * pages and their extracted semantic resources. For each queued URL:</p>
 *
 * <ul>
 *   <li>fetches the web page content</li>
 *   <li>converts HTML content to markdown format</li>
 *   <li>detects content changes through hashing</li>
 *   <li>applies extraction functions to generate or update structured data resources</li>
 * </ul>
 *
 * <p>Processing is incremental and resumable: stored {@link Page} records act as the work queue
 * and their {@linkplain Page#fetched() fetch timestamps} as the resume cursor. Every run:</p>
 *
 * <ul>
 *   <li>reconciles stored pages against the supplied URLs, retiring pages that are no longer
 *       listed together with the resources they generated</li>
 *   <li>queues pages that were never fetched or whose fetch is older than the configured
 *       {@linkplain #ttl(Duration) time to live}, oldest first, with pages reported as republished by the source
 *       served first</li>
 *   <li>processes the queue in {@linkplain #batch(int) batches}, committing after each one, until
 *       the configured {@linkplain #budget(Duration) time budget} is exhausted</li>
 * </ul>
 *
 * <p>Pages that cannot be fetched are stamped and retried on subsequent runs, then retired
 * after {@linkplain #retries(int) a number of consecutive failures}.</p>
 *
 * @param <T> the type of structured resource extracted from pages
 */
public final class PageKeeper<T extends Valuable> implements Function<Set<URI>, Integer> {

    private static final int BATCH=10;
    private static final int RETRIES=3;


    private final URI pipeline;

    private final boolean incremental;

    private final int batch;
    private final int retries;

    private final Duration ttl;
    private final Duration budget;

    private final Map<URI, Instant> stamps;

    private final Function<Page, Optional<T>> insert;
    private final Function<Page, Optional<T>> remove;

    private final Collection<? extends Valuable> annexes;

    private final Executor executor;


    private final Store store=service(store());
    private final Logger logger=service(logger());


    /**
     * Configures a new page keeper for the specified processing pipeline.
     *
     * <p>Creates a keeper with default (empty) insert and remove functions, no annexes,
     * the default executor, no time to live, no time budget and the default batch size and retry count. Use fluent
     * builder methods to configure extraction behavior.</p>
     *
     * @param pipeline the URI of the processing pipeline that will manage fetched pages
     *
     * @throws NullPointerException if {@code pipeline} is {@code null}
     */
    public PageKeeper(final URI pipeline) {
        this(
                pipeline,
                false,
                BATCH,
                RETRIES,
                Duration.ZERO,
                null,
                map(),
                page -> Optional.empty(),
                page -> Optional.empty(),
                set(),
                Locator.executor()
        );
    }


    private PageKeeper(
            final URI pipeline,
            final boolean incremental,
            final int batch,
            final int retries,
            final Duration ttl,
            final Duration budget,
            final Map<URI, Instant> stamps,
            final Function<Page, Optional<T>> insert,
            final Function<Page, Optional<T>> remove,
            final Collection<? extends Valuable> annexes,
            final Executor executor
    ) {

        if ( pipeline == null ) {
            throw new NullPointerException("null pipeline");
        }

        if ( batch <= 0 ) {
            throw new IllegalArgumentException(format("non-positive batch size <%d>", batch));
        }

        if ( retries <= 0 ) {
            throw new IllegalArgumentException(format("non-positive retry count <%d>", retries));
        }

        if ( ttl == null ) {
            throw new NullPointerException("null ttl");
        }

        if ( ttl.isNegative() ) {
            throw new IllegalArgumentException(format("negative ttl <%s>", ttl));
        }

        if ( stamps == null
                || stamps.keySet().stream().anyMatch(Objects::isNull)
                || stamps.values().stream().anyMatch(Objects::isNull)
        ) {
            throw new NullPointerException("null stamps");
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
        this.batch=batch;
        this.retries=retries;
        this.ttl=ttl;
        this.budget=budget;
        this.stamps=stamps;
        this.insert=insert;
        this.remove=remove;
        this.annexes=annexes;
        this.executor=executor;
    }


    /**
     * Configures the incremental processing mode.
     *
     * <p>Incremental mode disables retirement of stale resources: only new or expired pages from the
     * {@linkplain  #apply(Set) supplied URLs}  are processed; other existing pages are retained without updates.</p>
     *
     * @param incremental {@code true} to enable incremental processing, {@code false} otherwise
     *
     * @return a new PageKeeper instance with the specified incremental mode
     */
    public PageKeeper<T> incremental(final boolean incremental) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the batch size.
     *
     * <p>Pages in a batch are fetched and processed concurrently on the configured
     * {@linkplain #executor(Executor) executor} and committed to the store as a single checkpoint: the batch size
     * governs both processing concurrency and checkpoint granularity.</p>
     *
     * @param batch the number of pages processed and committed together
     *
     * @return a new PageKeeper instance with the specified batch size
     *
     * @throws IllegalArgumentException if {@code batch} is not positive
     */
    public PageKeeper<T> batch(final int batch) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the retry count.
     *
     * <p>Pages are retired after the specified number of consecutive failed fetch attempts,
     * rather than being retried on every run.</p>
     *
     * @param retries the number of consecutive failed fetch attempts tolerated before retiring a page
     *
     * @return a new PageKeeper instance with the specified retry count
     *
     * @throws IllegalArgumentException if {@code retries} is not positive
     */
    public PageKeeper<T> retries(final int retries) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the page time to live.
     *
     * <p>Pages fetched less than the specified duration ago are not queued for processing,
     * unless the source reports them as republished. A {@linkplain Duration#ZERO zero} time to live queues every
     * supplied URL on every run.</p>
     *
     * @param ttl the minimum interval between two fetches of the same page
     *
     * @return a new PageKeeper instance with the specified time to live
     *
     * @throws NullPointerException     if {@code ttl} is {@code null}
     * @throws IllegalArgumentException if {@code ttl} is negative
     */
    public PageKeeper<T> ttl(final Duration ttl) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the processing time budget.
     *
     * <p>No new batch is started after the specified duration has elapsed; queued pages left
     * unprocessed are picked up by the next run, oldest first. Processing is unbounded unless a budget is
     * configured.</p>
     *
     * @param budget the wall-clock time budget for processing queued pages
     *
     * @return a new PageKeeper instance with the specified time budget
     *
     * @throws NullPointerException     if {@code budget} is {@code null}
     * @throws IllegalArgumentException if {@code budget} is not positive
     */
    public PageKeeper<T> budget(final Duration budget) {

        if ( budget == null ) {
            throw new NullPointerException("null budget");
        }

        if ( budget.isNegative() || budget.isZero() ) {
            throw new IllegalArgumentException(format("non-positive budget <%s>", budget));
        }

        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
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
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the function for removing resources when pages are retired.
     *
     * <p>The remove function is applied when a page is no longer listed by the source or is
     * retired after repeated fetch failures. If the function returns a non-empty Optional, the identified resource is
     * removed from storage alongside the page record.</p>
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
                batch,
                retries,
                ttl,
                budget,
                stamps,
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
                batch,
                retries,
                ttl,
                budget,
                stamps,
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
                batch,
                retries,
                ttl,
                budget,
                stamps,
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
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }

    /**
     * Configures the publication stamps advertised by the source listing.
     *
     * <p>Pages whose stamp is newer than the one recorded by the previous run are queued
     * ahead of pages queued on account of their age; stamps for URLs that are not {@linkplain #apply(Set) supplied}
     * are ignored. Stamps never prevent a page from being fetched, as sources are not required to advertise every
     * editorial change.</p>
     *
     * @param stamps the publication timestamps of the pages listed by the source, keyed by URL
     *
     * @return a new PageKeeper instance with the specified stamps
     *
     * @throws NullPointerException if {@code stamps} is {@code null} or contains null keys or values
     */
    public PageKeeper<T> stamps(final Map<URI, Instant> stamps) {
        return new PageKeeper<>(
                pipeline,
                incremental,
                batch,
                retries,
                ttl,
                budget,
                stamps,
                insert,
                remove,
                annexes,
                executor
        );
    }


    /**
     * Processes a set of URLs by fetching, caching and extracting structured data.
     *
     * @param urls the set of URLs currently listed by the source
     *
     * @return the number of stored and removed values
     *
     * @throws NullPointerException if {@code urls} is {@code null} or contains null values
     */
    @Override
    public Integer apply(final Set<URI> urls) {

        if ( urls == null || urls.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null urls");
        }

        return sync(urls);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private int sync(final Set<URI> urls) {

        final Instant now=Instant.now();
        final Instant deadline=budget == null ? null : now.plus(budget);

        final Map<URI, PageFrame> pages=pages();

        final List<PageFrame> retired=incremental ? list() : list(pages.values().stream()
                .filter(not(page -> urls.contains(page.id())))
        );

        final List<URI> queue=list(urls.stream()
                .filter(url -> expired(pages.get(url), stamps.get(url), now))
                .sorted(comparing(url -> priority(pages.get(url), stamps.get(url))))
        );

        logger.info(this, format(
                "%s > listed <%,d> pages / queued <%,d> / current <%,d> / retiring <%,d>",
                label(), urls.size(), queue.size(), urls.size()-queue.size(), retired.size()
        ));

        final List<Value> removals=list(retired.stream().flatMap(this::retire));

        final int reconciled=store.modify(
                array(list(annexes.stream().map(Valuable::toValue))),
                array(removals)
        );

        final List<Outcome> outcomes=list(batches(queue).stream()
                .takeWhile(batch -> pending(deadline))
                .flatMap(batch -> process(batch, pages, now).stream())
        );

        final int processed=outcomes.size();

        final int stored=outcomes.stream().mapToInt(outcome -> outcome.values().size()).sum();
        final int dropped=outcomes.stream().mapToInt(outcome -> outcome.removals().size()).sum();

        logger.info(this, format(
                "%s > processed <%,d> pages / stored <%,d> values / dropped <%,d> values"
                        +" / reconciled <%,d> resources / pending <%,d> pages",
                label(), processed, stored, dropped, reconciled, queue.size()-processed
        ));

        return stored+dropped+removals.size();
    }


    private Map<URI, PageFrame> pages() {
        return map(store

                .retrieve(value(query()
                        .model(new PageFrame(true)
                                .id(uri())
                                .created(Instant.EPOCH)
                                .updated(Instant.EPOCH)
                                .fetched(Instant.EPOCH)
                                .etag("")
                                .hash("")
                                .attempts(0)
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
    }

    private List<List<URI>> batches(final List<URI> queue) {
        return IntStream.range(0, Math.ceilDiv(queue.size(), batch))
                .mapToObj(n -> queue.subList(n*batch, Math.min((n+1)*batch, queue.size())))
                .toList();
    }

    private boolean pending(final Instant deadline) {
        return deadline == null || Instant.now().isBefore(deadline);
    }

    private boolean expired(final PageFrame page, final Instant stamp, final Instant now) {
        if ( page == null || page.fetched() == null ) {

            return true; // never fetched

        } else if ( republished(page, stamp) ) {

            return true; // reported as republished by the source

        } else {

            return page.fetched().isBefore(now.minus(ttl));

        }
    }

    private Instant priority(final PageFrame page, final Instant stamp) {
        if ( page == null || page.fetched() == null || republished(page, stamp) ) {

            return Instant.MIN; // new or republished pages are served first

        } else {

            return page.fetched(); // then aged pages, oldest first

        }
    }

    private boolean republished(final PageFrame page, final Instant stamp) {
        return stamp != null && (page.updated() == null || stamp.isAfter(page.updated()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private List<Outcome> process(
            final List<URI> batch,
            final Map<URI, PageFrame> pages,
            final Instant now
    ) {
        return time(() -> {

            final List<Outcome> outcomes=list(batch.stream()

                    .map(url -> async(executor, () ->
                            outcome(url, pages.get(url), stamps.get(url), now)
                    ))

                    .collect(joining())
            );

            store.modify(
                    array(list(outcomes.stream().flatMap(outcome -> outcome.values().stream()))),
                    array(list(outcomes.stream().flatMap(outcome -> outcome.removals().stream())))
            );

            return outcomes;

        }).apply((elapsed, outcomes) -> logger.info(this, format(

                "%s > batch of <%,d> pages in <%,d> ms / %s",
                label(), outcomes.size(), elapsed, census(outcomes)

        )));
    }

    private Outcome outcome(final URI url, final PageFrame page, final Instant stamp, final Instant now) {
        return Optional.of(url.toString())

                .flatMap(new GET<>(new HTML()))
                .flatMap(new Focus())
                .map(new Untag())

                .map(body -> scan(url, page, stamp, now, body))
                .orElseGet(() -> fail(url, page, stamp, now));
    }

    private Outcome scan(
            final URI url,
            final PageFrame page,
            final Instant stamp,
            final Instant now,
            final String body
    ) {

        final String hash=uuid(body);

        if ( page != null && hash.equals(page.hash()) ) { // unchanged content: advance the cursor only

            return new Outcome(Status.unchanged, list(Stream.of(
                    stamp(url, page, stamp, now, page.hash(), page.resource(), 0).toValue()
            )), list());

        } else {

            final PageFrame scanned=stamp(url, page, stamp, now, hash, null, 0);

            return requireNonNull(insert.apply(scanned.body(body)), "null insert factory value")

                    .map(Valuable::toValue)

                    .flatMap(resource -> resource.id().map(id -> new Outcome(

                            page == null ? Status.created : Status.updated,

                            list(Stream.of(resource, scanned.resource(id).toValue())),
                            list()

                    )))

                    .orElseGet(() -> new Outcome( // nothing to extract: stamp the page to avoid immediate retries
                            Status.barren,
                            list(Stream.of(scanned.toValue())),
                            list()
                    ));

        }
    }

    private Outcome fail(final URI url, final PageFrame page, final Instant stamp, final Instant now) {

        final int attempts=(page == null ? 0 : page.attempts())+1;

        if ( page != null && attempts >= retries ) {

            logger.warning(this, format("%s > retiring unavailable page <%s>", label(), url));

            return new Outcome(Status.retired, list(), list(retire(page)));

        } else {

            logger.warning(this, format("%s > failed fetch <%d/%d> of page <%s>", label(), attempts, retries, url));

            return new Outcome(Status.failed, list(Stream.of(
                    stamp(url, page, stamp, now, page == null ? null : page.hash(),
                            page == null ? null : page.resource(), attempts
                    ).toValue()
            )), list());

        }
    }

    private Stream<Value> retire(final PageFrame page) {
        return Stream.concat(
                requireNonNull(remove.apply(page), "null remove factory value").map(Valuable::toValue).stream(),
                Stream.of(page.toValue())
        );
    }

    private PageFrame stamp(
            final URI url,
            final PageFrame page,
            final Instant stamp,
            final Instant now,
            final String hash,
            final URI resource,
            final int attempts
    ) {
        return new PageFrame()
                .id(url)
                .created(page == null ? null : page.created())
                .updated(updated(page, stamp))
                .fetched(now)
                .etag(page == null ? null : page.etag())
                .hash(hash)
                .attempts(attempts)
                .pipeline(pipeline)
                .resource(resource);
    }

    private Instant updated(final PageFrame page, final Instant stamp) {
        if ( stamp != null ) {

            return stamp;

        } else if ( page != null ) {

            return page.updated();

        } else {

            return null;

        }
    }


    private String label() {
        return pipeline.toString().replaceAll("^.*[.:/]", "");
    }

    private String census(final Collection<Outcome> outcomes) {
        return String.join(", ", list(Arrays.stream(Status.values())

                .map(status -> entry(status, outcomes.stream()
                        .filter(outcome -> outcome.status() == status)
                        .count()
                ))

                .filter(entry -> entry.getValue() > 0)
                .map(entry -> format("%,d %s", entry.getValue(), entry.getKey()))

        ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private enum Status {

        created,
        updated,
        unchanged,
        barren,
        failed,
        retired

    }

    private record Outcome(Status status, List<Value> values, List<Value> removals) { }

}
