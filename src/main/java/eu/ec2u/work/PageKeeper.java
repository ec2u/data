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

public final class PageKeeper<T extends Valuable> implements Function<Set<URI>, Integer> {

    private final URI pipeline;

    private final Function<Page, Optional<T>> insert;
    private final Function<Page, Optional<T>> remove;

    private final Collection<? extends Valuable> annexes;

    private final Executor executor;


    private final Store store=service(store());


    public PageKeeper(final URI pipeline) {
        this(
                pipeline,
                page -> Optional.empty(),
                page -> Optional.empty(),
                set(),
                Locator.executor()
        );
    }


    private PageKeeper(
            final URI pipeline,
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
        this.insert=insert;
        this.remove=remove;
        this.annexes=annexes;
        this.executor=executor;
    }


    public PageKeeper<T> insert(final Function<Page, Optional<T>> insert) {
        return new PageKeeper<>(
                pipeline,
                insert,
                remove,
                annexes,
                executor
        );
    }

    public PageKeeper<T> remove(final Function<Page, Optional<T>> remove) {
        return new PageKeeper<>(
                pipeline,
                insert,
                remove,
                annexes,
                executor
        );
    }

    public PageKeeper<T> annexes(final Valuable... annexes) {

        if ( annexes == null ) {
            throw new NullPointerException("null annexes");
        }

        return new PageKeeper<>(
                pipeline,
                insert,
                remove,
                asList(annexes),
                executor
        );
    }

    public PageKeeper<T> annexes(final Collection<? extends Valuable> annexes) {
        return new PageKeeper<>(
                pipeline,
                insert,
                remove,
                annexes,
                executor
        );
    }

    public PageKeeper<T> executor(final Executor executor) {
        return new PageKeeper<>(
                pipeline,
                insert,
                remove,
                annexes,
                executor
        );
    }


    @Override
    public Integer apply(final Set<URI> urls) {

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


        final List<Value> removals=list(pages.values().stream()

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
