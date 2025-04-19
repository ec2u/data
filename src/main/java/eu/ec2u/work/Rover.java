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

import com.metreeca.mesh.util.Locales;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.net.URI;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.*;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.set;

import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.*;
import static org.eclipse.rdf4j.model.util.Values.iri;

public final class Rover {

    private static final String BYTE="http://www.w3.org/2001/XMLSchema#byte";
    private static final String SHORT="http://www.w3.org/2001/XMLSchema#short";
    private static final String INT="http://www.w3.org/2001/XMLSchema#int";
    private static final String LONG="http://www.w3.org/2001/XMLSchema#long";
    private static final String FLOAT="http://www.w3.org/2001/XMLSchema#float";
    private static final String DOUBLE="http://www.w3.org/2001/XMLSchema#double";
    private static final String INTEGER="http://www.w3.org/2001/XMLSchema#integer";
    private static final String DECIMAL="http://www.w3.org/2001/XMLSchema#decimal";


    public static Rover rover(final Collection<Statement> statements) {

        if ( statements == null || statements.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null statements");
        }

        return new Rover(set(), set(statements));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Set<Value> focus;
    private final Set<Statement> source;


    private Rover(final Set<Value> focus, final Set<Statement> source) {
        this.focus=focus;
        this.source=source;
    }


    public Rover focus(final URI... values) {

        if ( values == null || Arrays.stream(values).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null values");
        }

        return new Rover(set(Arrays.stream(values).map(uri -> iri(uri.toString()))), source);
    }

    public Rover focus(final Value... values) {
        throw new UnsupportedOperationException(";( TBI"); // !!!
    }


    public Rover get(final URI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return get(iri(predicate.toString()));
    }

    public Rover get(final IRI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return new Rover(set(source.stream()
                .filter(s -> s.getPredicate().equals(predicate))
                .filter(s -> focus.contains(s.getSubject()))
                .map(Statement::getObject)
        ), source);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Optional<String> lexical() {
        return lexicals().findFirst();
    }

    public Optional<URI> uri() {
        return uris().findFirst();
    }

    public Optional<Long> integral() {
        return integrals().findFirst();
    }

    public Optional<Year> year() {
        return years().findFirst();
    }

    public Optional<OffsetDateTime> offsetDateTime() {
        return offsetDateTimes().findFirst();
    }


    public Stream<String> lexicals() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .map(guard(Value::stringValue));
    }

    public Stream<URI> uris() {
        return Stream.

                concat(

                        focus.stream()
                                .filter(IRI.class::isInstance)
                                .map(IRI.class::cast),

                        focus.stream()
                                .filter(Literal.class::isInstance)
                                .map(Literal.class::cast)
                                .filter(v -> v.getDatatype().equals(XSD.ANYURI))

                )

                .map(Value::stringValue)
                .map(guard(URI::create));
    }

    public Stream<Long> integrals() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .map(this::number)
                .filter(Objects::nonNull)
                .map(Number::longValue);
    }

    public Stream<Year> years() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.GYEAR) || v.getDatatype().equals(XSD.DATETIME)) // !!! complete
                .map(guard(v -> Year.from(v.temporalAccessorValue())));
    }

    public Stream<OffsetDateTime> offsetDateTimes() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.DATETIME))
                .map(guard(v -> OffsetDateTime.from(v.temporalAccessorValue())));
    }


    public Optional<Entry<Locale, String>> text() {
        return textual()
                .findFirst()
                .map(v -> entry(locale(v), v.stringValue()));
    }

    public Optional<Map<Locale, String>> texts() {
        return Optional
                .of(textual().collect(toMap(this::locale, Value::stringValue, (x, y) -> x)))
                .filter(not(Map::isEmpty));
    }

    public Optional<Map<Locale, Set<String>>> textsets() {
        return Optional
                .of(textual().collect(groupingBy(this::locale, mapping(Value::stringValue, toSet()))))
                .filter(not(Map::isEmpty));
    }


    private Stream<Literal> textual() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.STRING) || v.getLanguage().isPresent());
    }

    private Locale locale(final Literal literal) {
        return Locales.locale(literal.getLanguage().orElse(""));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static <V, R> Function<V, R> guard(final Function<V, R> converter) {
        return value -> {

            try {

                return converter.apply(value);

            } catch ( final RuntimeException ignored ) {

                return null;

            }

        };
    }


    private Number number(final Literal literal) {
        return switch ( literal.getDatatype().toString() ) {

            case BYTE -> literal.byteValue();
            case SHORT -> literal.shortValue();
            case INT -> literal.intValue();
            case LONG -> literal.longValue();
            case FLOAT -> literal.floatValue();
            case DOUBLE -> literal.doubleValue();
            case INTEGER -> literal.integerValue();
            case DECIMAL -> literal.decimalValue();

            default -> null;

        };
    }

}
