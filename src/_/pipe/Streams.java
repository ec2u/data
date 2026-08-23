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
 * Stream utilities and specialized collectors.
 *
 * <p>Provides factory methods for creating streams, filter predicates for stream operations,
 * mapping functions for handling nullable values, and collectors for traversal operations.</p>
 */
public final class Streams {

    //̸// Factories ////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves an empty stream.
     *
     * @param <T> the type of elements in the stream
     *
     * @return an empty stream
     */
    public static <T> Stream<T> stream() {

        return Stream.empty();
    }

    /**
     * Creates a stream containing a single value.
     *
     * @param <T>   the type of the value
     * @param value the value to include in the stream
     *
     * @return a stream containing the specified value
     *
     * @throws NullPointerException if {@code value} is {@code null}
     */
    public static <T> Stream<T> stream(final T value) {

        if ( value == null ) {
            throw new NullPointerException("null value");
        }

        return Stream.of(value);
    }

    /**
     * Creates a stream containing the specified values.
     *
     * @param <T>    the type of the values
     * @param values the values to include in the stream
     *
     * @return a stream containing the specified values
     *
     * @throws NullPointerException if {@code values} is {@code null} or contains {@code null} elements
     */
    @SafeVarargs
    public static <T> Stream<T> stream(final T... values) {

        if ( values == null ) {
            throw new NullPointerException("null values");
        }

        return Stream.of(values)
                .peek(value -> requireNonNull(value, "null values"));
    }


    /**
     * Concatenates the present values from multiple optionals into a stream.
     *
     * @param <T>       the type of the optional values
     * @param optionals the optionals whose present values to concatenate
     *
     * @return a stream containing all present values from the optionals
     *
     * @throws NullPointerException if {@code optionals} is {@code null} or contains {@code null} elements
     */
    @SafeVarargs
    public static <T> Stream<T> concat(final Optional<? extends T>... optionals) {

        if ( optionals == null ) {
            throw new NullPointerException("null optionals");
        }

        return Stream.of(optionals)
                .peek(value -> requireNonNull(value, "null optionals"))
                .flatMap(Optional::stream);
    }

    /**
     * Concatenates multiple streams into a single stream.
     *
     * @param <T>     the type of the stream elements
     * @param streams the streams to concatenate
     *
     * @return a stream containing all elements from the input streams
     *
     * @throws NullPointerException if {@code streams} is {@code null} or contains {@code null} elements
     */
    @SafeVarargs
    public static <T> Stream<T> concat(final Stream<? extends T>... streams) {

        if ( streams == null ) {
            throw new NullPointerException("null streams");
        }

        return Stream.of(streams)
                .peek(value -> requireNonNull(value, "null streams"))
                .flatMap(identity());
    }

    /**
     * Concatenates elements from multiple collections into a single stream.
     *
     * @param <T>         the type of the collection elements
     * @param collections the collections whose elements to concatenate
     *
     * @return a stream containing all elements from the collections
     *
     * @throws NullPointerException if {@code collections} is {@code null} or contains {@code null} collections or
     *                              {@code null} elements
     */
    @SafeVarargs
    public static <T> Stream<T> concat(final Collection<? extends T>... collections) {

        if ( collections == null ) {
            throw new NullPointerException("null collections");
        }

        return Stream.of(collections)
                .peek(value -> requireNonNull(value, "null collections"))
                .flatMap(c -> c.stream()
                        .peek(value -> requireNonNull(value, "null collection values"))
                );
    }


    //̸// Filters //////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates a filter predicate that removes duplicate elements based on a key.
     *
     * @param <T> the type of elements to filter
     * @param key a function mapping stream elements to values used for equality comparison; must return non-null
     *            values
     *
     * @return a stateful predicate that returns true only for elements whose key was not seen before, suitable for use
     *         with {@link Stream#filter(Predicate)}
     *
     * @throws NullPointerException if {@code key} is {@code null} or returns {@code null} values
     * @see Stream#filter(Predicate)
     */
    public static <T> Predicate<T> distinct(final Function<? super T, Object> key) {

        if ( key == null ) {
            throw new NullPointerException("null key extractor");
        }

        return new Predicate<>() {

            private final Set<Object> processed=ConcurrentHashMap.newKeySet();

            @Override
            public boolean test(final T value) {
                return processed.add(requireNonNull(key.apply(value), "null key"));
            }

        };
    }


    //̸// Mappers //////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates a null-safe map function that converts values to streams.
     *
     * <p>Wraps the provided mapper to handle null input values gracefully. If the input value is null,
     * returns an empty stream. Otherwise, applies the mapper and wraps the result in a stream.</p>
     *
     * @param <V>    the type of input values
     * @param <R>    the type of mapped results
     * @param mapper the function to apply to non-null input values
     *
     * @return a function that maps values to streams, handling null inputs safely
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public static <V, R> Function<V, Stream<R>> nullable(final Function<V, R> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return value -> Optional.ofNullable(value)
                .map(mapper)
                .stream();
    }

    /**
     * Creates a null-safe map function for optional-returning mappers.
     *
     * <p>Wraps the provided mapper to handle null input values gracefully. If the input value is null,
     * returns an empty stream. Otherwise, applies the mapper and converts the optional result to a stream.</p>
     *
     * @param <V>    the type of input values
     * @param <R>    the type of mapped results
     * @param mapper the function that maps values to optionals
     *
     * @return a function that maps values to streams, handling null inputs safely
     *
     * @throws NullPointerException if {@code mapper} is {@code null} or returns {@code null}
     */
    public static <V, R> Function<V, Stream<R>> optional(final Function<V, Optional<R>> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return value -> Optional.ofNullable(value)
                .flatMap(v -> requireNonNull(mapper.apply(v), "null mapper return value"))
                .stream();
    }


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


    //̸// Collectors ///////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates a collector for batching stream elements into collections.
     *
     * <p>Accumulates elements incrementally into batches of the specified size.
     * When the batch size is reached, the batch is emitted and accumulation continues. The final partial batch is
     * emitted at the end.</p>
     *
     * <p><strong>Warning</strong> / This operation is not eager. All batches are accumulated before being emitted.</p>
     *
     * @param <T>  the type of stream elements
     * @param size the batch size
     *
     * @return a collector producing a stream of batched collections
     *
     * @throws IllegalArgumentException if {@code size} is not positive
     */
    public static <T> Collector<T, ?, Stream<Collection<T>>> batch(final int size) {

        if ( size <= 0 ) {
            throw new IllegalArgumentException("non-positive batch size");
        }

        return Collector.of(
                () -> new ArrayList<ArrayList<T>>(),
                (batches, value) -> {

                    if ( batches.isEmpty() || batches.getLast().size() >= size ) {
                        batches.add(new ArrayList<>());
                    }

                    batches.getLast().add(value);

                },
                (left, right) -> {

                    left.addAll(right);

                    return left;

                },
                batches -> batches.stream()
                        .filter(not(ArrayList::isEmpty))
                        .map(batch -> batch)
        );
    }

    /**
     * Creates a collector for producing single-element streams from collected results.
     *
     * <p>Wraps the provided collector to produce a stream containing a single element obtained
     * by collecting the stream elements using {@code collector}.</p>
     *
     * @param <T>       the type of stream elements
     * @param <C>       the type of the collected result
     * @param collector the collector to apply to stream elements
     *
     * @return a collector producing a stream containing a single element from the collected result
     *
     * @throws NullPointerException if {@code collector} is {@code null}
     */
    public static <T, C> Collector<T, ?, Stream<C>> batch(final Collector<T, ?, C> collector) {

        if ( collector == null ) {
            throw new NullPointerException("null collector");
        }

        return Collectors.collectingAndThen(collector, Stream::of);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Streams() { }

}
