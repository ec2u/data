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

package eu.ec2u.work._junk;

import com.metreeca.flow.work.Xtream;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

public final class Frame implements Value {

    public static Function<Value, IRI> asIRI() {
        return null;
    }

    public static Function<Value, Frame> asFrame() {
        return null;
    }

    public static Function<Value, Boolean> asBoolean() {
        return null;
    }

    public static BigDecimal decimal(int i) {
        return null;
    }

    public Optional<IRI> id() {
        return null;
    }

    @Override public String stringValue() {
        return "";
    }

    public static Frame field(IRI iri, Value... values) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public static Frame field(IRI iri, Collection<? extends Value> values) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public static Function<Value, String> asString() {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    @SafeVarargs public static Frame frame(final Frame... entries) {
        return null;
    }

    public static Frame field(IRI iri, Optional<? extends Value> value) {
        return null;
    }

    public static Frame field(IRI iri, Stream<? extends Value> values) {
        return null;
    }

    public <T> Optional<Value> value(IRI iri) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public <T> Optional<T> value(IRI iri, Function<Value, T> converter) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Stream<Statement> stream() {
        return null;
    }

    public <T> Xtream<T> values(IRI location, Function<Value, T> frame) {
        return null;
    }

    public <T> Xtream<Value> values(IRI location) {
        return null;
    }
}
