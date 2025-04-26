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

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

import static com.metreeca.mesh.util.Collections.list;

import static java.lang.Double.isFinite;
import static java.lang.Math.sqrt;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;

public final class Embedding {

    public static String embeddable(final Collection<String> strings) {

        if ( strings == null || strings.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null strings");
        }

        return strings.stream()
                .distinct()
                .filter(not(String::isBlank))
                .map("- %s\n"::formatted)
                .collect(joining());
    }


    public static String encode(final Embedding embedding) {

        if ( embedding == null ) {
            throw new NullPointerException("null embedding or embedding values");
        }

        return Arrays.stream(embedding.values)
                .mapToObj(Double::toString)
                .collect(joining(","));
    }

    public static Embedding decode(final String embedding) {

        if ( embedding == null ) {
            throw new NullPointerException("null embedding");
        }

        return new Embedding(list(Arrays.stream(embedding.split(",")).map(v -> {

            try {
                return Float.parseFloat(v);
            } catch ( final NumberFormatException e ) {
                throw new IllegalArgumentException(format("malformed embedding value <%s>", v), e);
            }

        })));
    }


    public static double cosine(final Embedding x, final Embedding y) {

        if ( x == null ) {
            throw new NullPointerException("null x embedding");
        }

        if ( y == null ) {
            throw new NullPointerException("null y embedding");
        }

        if ( x.values.length != y.values.length ) {
            throw new IllegalArgumentException(format(
                    "mismatched embedding lengths <%d>/<%d>", x.values.length, y.values.length
            ));
        }

        double dot=0.0, xnorm=0.0, ynorm=0.0;

        for (int i=0, n=x.values.length; i < n; ++i) {

            final double xi=x.values[i];
            final double yi=y.values[i];

            dot+=xi*yi;
            xnorm+=xi*xi;
            ynorm+=yi*yi;
        }

        return dot/(sqrt(xnorm)*sqrt(ynorm));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final double[] values;


    public Embedding(final double[] values) {

        if ( values == null ) {
            throw new NullPointerException("null embedding values");
        }

        if ( values.length == 0 ) {
            throw new IllegalArgumentException("empty embedding values");
        }

        if ( Arrays.stream(values).anyMatch(v -> !isFinite(v)) ) {
            throw new IllegalArgumentException("non-finite embedding values");
        }

        this.values=values.clone();
    }

    public Embedding(final List<? extends Number> values) {

        if ( values == null || values.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null embedding values");
        }

        if ( values.isEmpty() ) {
            throw new IllegalArgumentException("empty embedding values");
        }

        if ( values.stream().anyMatch(v -> !isFinite(v.doubleValue())) ) {
            throw new IllegalArgumentException("non-finite embedding values");
        }

        this.values=values.stream().mapToDouble(Number::doubleValue).toArray();
    }

}
