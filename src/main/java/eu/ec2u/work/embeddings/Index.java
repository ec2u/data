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

package eu.ec2u.work.embeddings;

import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;

import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;

import static java.lang.String.format;

public final class Index<V> {

    private final Map<V, Embedding> entries;


    public Index(final Map<V, Embedding> entries) {

        if ( entries == null ) {
            throw new NullPointerException("null entries");
        }

        this.entries=map(entries);
    }


    public Stream<V> match(final Embedding query) {

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        return match(query, 0);
    }

    public Stream<V> match(final Embedding query, final double threshold) {

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        if ( threshold < 0 ) {
            throw new IllegalArgumentException(format("negative threshold <%.3f>", threshold));
        }

        return entries.entrySet().stream()
                .map(entry -> entry(entry.getKey(), Embedding.cosine(query, entry.getValue())))
                .sorted(Entry.<V, Double>comparingByValue().reversed())
                .filter(e -> e.getValue() >= threshold)
                .map(Entry::getKey);
    }

}
