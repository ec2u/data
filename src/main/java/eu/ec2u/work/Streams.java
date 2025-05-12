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

import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Stream;

import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toList;

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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Streams() { }

}
