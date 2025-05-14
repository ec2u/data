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

package eu.ec2u.work.ai;

import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;

import static com.metreeca.shim.Collections.entry;
import static com.metreeca.shim.Collections.map;

import static java.util.Map.Entry.comparingByValue;

public final class VectorIndex<V> {

    private final Map<V, Vector> entries;


    public VectorIndex(final Map<V, Vector> entries) {

        if ( entries == null ) {
            throw new NullPointerException("null entries");
        }

        this.entries=map(entries);
    }


    public Stream<Entry<V, Double>> lookup(final Vector query) {

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        return entries.entrySet().stream()
                .map(entry -> entry(entry.getKey(), Vector.cosine(query, entry.getValue())))
                .sorted(comparingByValue());
    }

}
