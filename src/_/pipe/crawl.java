/*
 * Copyright © 2022-2025 Metreeca srl
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

package com.metreeca.shim;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.util.Objects.requireNonNull;
import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;

/**
 * Recursive stream traversal.
 *
 * <p>Provides stateful mapping functions for use with {@link Stream#flatMap(Function)}, expanding each element into
 * the elements reachable from it and visiting every element at most once.</p>
 */
public final class Streams {

    /**
     * Creates a stateful flatMap function that performs recursive traversal.
     *
     * @param <V>       the type of elements to traverse
     * @param traverser a function mapping input elements to streams of elements of the same type
     *
     * @return a function that can be used with flatMap to recursively traverse elements, ensuring no duplicates are
     *         processed
     *
     * @throws NullPointerException if {@code traverser} is {@code null} or returns {@code null}
     */
    public static <V> Function<V, Stream<V>> traverse(
            final Function<? super V, ? extends Stream<V>> traverser
    ) {

        if ( traverser == null ) {
            throw new NullPointerException("null traverser");
        }

        return new Function<>() {

            private final Set<V> visited=ConcurrentHashMap.newKeySet();

            @Override
            public Stream<V> apply(final V value) {
                if ( visited.add(value) ) {

                    return Stream.concat(
                            Stream.of(value),
                            requireNonNull(traverser.apply(value), "null traverser value").flatMap(this)
                    );

                } else {

                    return Stream.empty();

                }
            }
        };
    }

    /**
     * Creates a stateful flatMap function that performs recursive traversal while extracting results.
     *
     * @param <V>       the type of elements to traverse
     * @param <R>       the type of result elements to extract
     * @param traverser a function mapping input elements to streams of elements of the same type for traversal
     * @param extractor a function mapping input elements to streams of result elements to extract
     *
     * @return a function that can be used with flatMap to recursively traverse elements while accumulating result
     *         elements, ensuring no duplicates are processed
     *
     * @throws NullPointerException if either {@code traverser} or {@code extractor} is {@code null} or returns
     *                              {@code null}
     */
    public static <V, R> Function<V, Stream<R>> traverse(
            final Function<? super V, ? extends Stream<V>> traverser,
            final Function<? super V, ? extends Stream<R>> extractor
    ) {

        if ( traverser == null ) {
            throw new NullPointerException("null traverser");
        }

        if ( extractor == null ) {
            throw new NullPointerException("null extractor");
        }

        return new Function<>() {

            private final Set<V> visited=ConcurrentHashMap.newKeySet();

            @Override
            public Stream<R> apply(final V value) {
                if ( visited.add(value) ) {

                    return Stream.concat(
                            requireNonNull(extractor.apply(value), "null extractor value"),
                            requireNonNull(traverser.apply(value), "null traverser value").flatMap(this)
                    );

                } else {

                    return Stream.empty();

                }
            }
        };
    }


    /**
     * Creates a stateful flatMap function that performs recursive traversal with intermediate transformation.
     *
     * <p>This variant supports use cases like web crawling where you need to:
     * <ul>
     *   <li>transform input elements (for instance, URL → document);</li>
     *   <li>extract traversal targets from the transformed elements (for instance, pagination links);</li>
     *   <li>extract results from the transformed elements (for instance, item URLs).</li>
     * </ul>
     *
     * @param <V>         the type of elements to traverse (for instance, URL)
     * @param <T>         the type of intermediate transformed elements (for instance, Document)
     * @param <R>         the type of result elements to extract (for instance, item URLs)
     * @param transformer a function that transforms input elements to intermediate elements
     * @param traverser   a function that extracts traversal targets from transformed elements
     * @param extractor   a function that extracts results from transformed elements
     *
     * @return a function that can be used with flatMap to recursively traverse elements while accumulating result
     *         elements, ensuring no duplicates are processed
     *
     * @throws NullPointerException if any parameter is {@code null} or returns {@code null}
     */
    public static <V, T, R> Function<V, Stream<R>> traverse(
            final Function<? super V, Stream<? extends T>> transformer,
            final Function<? super T, Stream<? extends V>> traverser,
            final Function<? super T, Stream<? extends R>> extractor
    ) {

        if ( transformer == null ) {
            throw new NullPointerException("null transformer");
        }

        if ( traverser == null ) {
            throw new NullPointerException("null traverser");
        }

        if ( extractor == null ) {
            throw new NullPointerException("null extractor");
        }

        return new Function<>() {

            private final Set<V> visited=ConcurrentHashMap.newKeySet();

            @Override
            public Stream<R> apply(final V value) {
                if ( visited.add(value) ) {

                    return requireNonNull(transformer.apply(value), "null transformer value")
                            .flatMap(t -> Stream.concat(
                                    requireNonNull(extractor.apply(t), "null extractor value"),
                                    requireNonNull(traverser.apply(t), "null traverser value").flatMap(this)
                            ));

                } else {

                    return Stream.empty();

                }
            }
        };
    }

}
