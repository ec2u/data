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

import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Stream;

import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.*;

public final class Streams {

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


    public static <V> Collector<CompletableFuture<V>, ?, Stream<V>> joining() {
        return collectingAndThen(toList(), futures ->
                futures.stream().map(CompletableFuture::join)
        );
    }


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
