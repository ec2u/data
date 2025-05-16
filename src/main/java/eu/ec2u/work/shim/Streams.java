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

package eu.ec2u.work.shim;

import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collector;
import java.util.stream.Stream;

import static java.util.Objects.requireNonNull;
import static java.util.function.UnaryOperator.identity;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toCollection;

public final class Streams {

    //̸// Factories ////////////////////////////////////////////////////////////////////////////////////////////////////

    public static <T> Stream<T> stream() {

        return Stream.empty();
    }

    public static <T> Stream<T> stream(final T value) {

        if ( value == null ) {
            throw new NullPointerException("null value");
        }

        return Stream.of(value);
    }

    @SafeVarargs
    public static <T> Stream<T> stream(final T... values) {

        if ( values == null ) {
            throw new NullPointerException("null values");
        }

        return Stream.of(values)
                .peek(value -> requireNonNull(value, "null values"));
    }


    @SafeVarargs
    public static <T> Stream<T> concat(final Optional<? extends T>... optionals) {

        if ( optionals == null ) {
            throw new NullPointerException("null optionals");
        }

        return Stream.of(optionals)
                .peek(value -> requireNonNull(value, "null optionals"))
                .flatMap(Optional::stream);
    }

    @SafeVarargs
    public static <T> Stream<T> concat(final Stream<? extends T>... streams) {

        if ( streams == null ) {
            throw new NullPointerException("null streams");
        }

        return Stream.of(streams)
                .peek(value -> requireNonNull(value, "null streams"))
                .flatMap(identity());
    }

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
     * @param key a function mapping stream elements to values used for equality comparison; must return non-null
     *            values
     *
     * @return a stateful predicate that returns true only for elements whose key was not seen before, suitable for use
     *         with {@link Stream#filter(Predicate)}
     *
     * @throws NullPointerException if {@code key} is null or returns null values
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

    public static <V, R> Function<V, Stream<R>> nullable(final Function<V, R> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return value -> Optional.ofNullable(value)
                .map(mapper)
                .stream();
    }

    public static <V, R> Function<V, Stream<R>> optional(final Function<V, Optional<R>> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return value -> Optional.ofNullable(value)
                .flatMap(v -> requireNonNull(mapper.apply(v), "null mapper return value"))
                .stream();
    }


    //̸// Collectors ///////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Collects stream elements performing recursive breadth-first traversal.
     *
     * @param mapper a function mapping input elements to streams of elements of the same type
     *
     * @return a collector that collects input elements and recursively applies {@code mapper} to discover and collect
     *         new elements until no new elements are discovered; results are returned as a stream in traversal order
     *         with no duplicates
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public static <V> Collector<V, ?, Stream<V>> traversing(
            final Function<? super V, ? extends Stream<V>> mapper
    ) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return collectingAndThen(toCollection(ArrayDeque::new), pending -> {

            final Collection<V> traversed=new LinkedHashSet<>();

            while ( !pending.isEmpty() ) {

                Stream.of(pending.pop())
                        .filter(traversed::add)
                        .flatMap(mapper)
                        .forEach(pending::add);

            }


            return traversed.stream();

        });
    }

    /**
     * Collects stream elements performing recursive breadth-first traversal while extracting results.
     *
     * @param mapper a function mapping input elements to streams of map entries where:
     *
     *               <ul>
     *                 <li>each entry's key contains a stream of elements of the same type as the input to be
     *                 recursively traversed</li>
     *                 <li>each entry's value contains a stream of result elements to be included in the final
     *                 output stream</li>
     *               </ul>
     *
     * @return a collector that collects input elements, recursively applies {@code mapper} to discover new elements
     *         while accumulating result elements, and returns the accumulated results as a stream with in traversal
     *         order no duplicates
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public static <V, R> Collector<V, ?, Stream<R>> extracting(
            final Function<? super V, Stream<Entry<? extends Stream<V>, ? extends Stream<R>>>> mapper
    ) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return collectingAndThen(toCollection(ArrayDeque::new), pending -> {

            final Collection<V> traversed=new HashSet<>();
            final Collection<R> extracted=new LinkedHashSet<>();

            while ( !pending.isEmpty() ) {

                mapper.apply(pending.pop()).forEach(entry -> {

                    entry.getKey().forEach(element -> {

                        if ( traversed.add(element) ) { pending.add(element); }

                    });

                    entry.getValue().forEach(extracted::add);

                });
            }

            return extracted.stream();

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Streams() { }

}
