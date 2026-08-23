/*
 * Copyright © 2013-2025 Metreeca srl
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

package com.metreeca.flow.rdf;

import com.metreeca.shim.URIs;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.net.URI;
import java.time.*;
import java.time.temporal.TemporalAccessor;
import java.time.temporal.TemporalAmount;
import java.util.*;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import static com.metreeca.shim.Collections.entry;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Locales.locale;
import static com.metreeca.shim.Streams.nullable;
import static com.metreeca.shim.Streams.optional;

import static java.util.Objects.requireNonNull;
import static java.util.function.UnaryOperator.identity;
import static org.eclipse.rdf4j.model.util.Values.iri;

/**
 * RDF graph navigator and value extractor.
 * <p>
 * Provides fluent APIs for navigating RDF graphs and extracting typed values from RDF literals. Supports path-based
 * navigation with forward/reverse traversals, transitive closures, and sequence compositions. Offers comprehensive
 * value extraction for primitives, temporal types, URIs, and localized text.
 */
public final class Rover {

    private static final String BYTE="http://www.w3.org/2001/XMLSchema#byte";
    private static final String SHORT="http://www.w3.org/2001/XMLSchema#short";
    private static final String INT="http://www.w3.org/2001/XMLSchema#int";
    private static final String LONG="http://www.w3.org/2001/XMLSchema#long";
    private static final String FLOAT="http://www.w3.org/2001/XMLSchema#float";
    private static final String DOUBLE="http://www.w3.org/2001/XMLSchema#double";
    private static final String INTEGER="http://www.w3.org/2001/XMLSchema#integer";
    private static final String DECIMAL="http://www.w3.org/2001/XMLSchema#decimal";


    private static final Set<IRI> TEMPORAL_ACCESSORS=set(
            XSD.DATE,
            XSD.DATETIME,
            XSD.DATETIMESTAMP,
            XSD.GDAY,
            XSD.GMONTH,
            XSD.GMONTHDAY,
            XSD.GYEAR,
            XSD.GYEARMONTH,
            XSD.TIME
    );

    private static final Set<IRI> TEMPORAL_AMOUNTS=set(
            XSD.DURATION,
            XSD.DAYTIMEDURATION,
            XSD.YEARMONTHDURATION
    );


    /**
     * Creates a new rover instance for navigating the given RDF model.
     *
     * @param model the RDF statements to navigate
     *
     * @return a new rover instance with empty focus set
     *
     * @throws NullPointerException if {@code model} is {@code null} or contains {@code null} statements
     */
    public static Rover rover(final Collection<Statement> model) {

        if ( model == null || model.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null model");
        }

        return new Rover(set(), set(model));
    }


    /**
     * Creates a forward path traversal operator for the given predicate.
     *
     * @param predicate the predicate to traverse forward
     *
     * @return a path operator that follows the predicate from subjects to objects
     *
     * @throws NullPointerException if {@code predicate} is {@code null}
     */
    public static UnaryOperator<Rover> forward(final URI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return forward(iri(predicate.toString()));

    }

    /**
     * Creates a forward path traversal operator for the given predicate.
     *
     * @param predicate the predicate to traverse forward
     *
     * @return a path operator that follows the predicate from subjects to objects
     *
     * @throws NullPointerException if {@code predicate} is {@code null}
     */
    public static UnaryOperator<Rover> forward(final IRI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return rover -> new Rover(set(rover.model.stream()
                .filter(s -> s.getPredicate().equals(predicate))
                .filter(s -> rover.focus.contains(s.getSubject()))
                .map(Statement::getObject)
        ), rover.model);
    }


    /**
     * Creates a reverse path traversal operator for the given predicate.
     *
     * @param predicate the predicate to traverse in reverse
     *
     * @return a path operator that follows the predicate from objects to subjects
     *
     * @throws NullPointerException if {@code predicate} is {@code null}
     */
    public static UnaryOperator<Rover> reverse(final URI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return reverse(iri(predicate.toString()));

    }

    /**
     * Creates a reverse path traversal operator for the given predicate.
     *
     * @param predicate the predicate to traverse in reverse
     *
     * @return a path operator that follows the predicate from objects to subjects
     *
     * @throws NullPointerException if {@code predicate} is {@code null}
     */
    public static UnaryOperator<Rover> reverse(final IRI predicate) {

        if ( predicate == null ) {
            throw new NullPointerException("null predicate");
        }

        return rover -> new Rover(set(rover.model.stream()
                .filter(s -> s.getPredicate().equals(predicate))
                .filter(s -> rover.focus.contains(s.getObject()))
                .map(Statement::getSubject)
        ), rover.model);
    }


    /**
     * Creates a transitive closure operator (zero or more steps).
     * <p>
     * Computes the reflexive-transitive closure of the given path, including the original focus and all values
     * reachable by zero or more applications of the path.
     *
     * @param path the path to apply transitively
     *
     * @return a path operator that computes the transitive closure
     *
     * @throws NullPointerException if {@code path} is {@code null}
     */
    public static UnaryOperator<Rover> star(final UnaryOperator<Rover> path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return rover -> {

            Rover star;
            Rover next=rover;

            do {

                star=next;
                next=new Rover(set(Stream.concat(star.focus.stream(), next.traverse(path).focus.stream())), rover.model);

            } while ( !next.focus.equals(star.focus) );

            return star;

        };
    }

    /**
     * Creates a transitive closure operator (one or more steps).
     * <p>
     * Computes the transitive closure of the given path, including all values reachable by one or more applications of
     * the path.
     *
     * @param path the path to apply transitively
     *
     * @return a path operator that computes the transitive closure
     *
     * @throws NullPointerException if {@code path} is {@code null}
     */
    public static UnaryOperator<Rover> plus(final UnaryOperator<Rover> path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return rover -> {

            Rover plus;
            Rover next=rover.traverse(path);

            do {

                plus=next;
                next=new Rover(set(Stream.concat(plus.focus.stream(), next.traverse(path).focus.stream())), rover.model);

            } while ( !next.focus.equals(plus.focus) );

            return plus;

        };
    }


    /**
     * Creates a sequence path operator that applies paths in order.
     *
     * @param paths the paths to apply in sequence
     *
     * @return a path operator that applies the given paths sequentially
     *
     * @throws NullPointerException if {@code paths} is {@code null} or contains {@code null} elements
     */
    @SafeVarargs
    public static UnaryOperator<Rover> sequence(final UnaryOperator<Rover>... paths) {

        if ( paths == null || Arrays.stream(paths).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null paths");
        }

        return sequence(Arrays.stream(paths));
    }

    /**
     * Creates a sequence path operator that applies paths in order.
     *
     * @param paths the paths to apply in sequence
     *
     * @return a path operator that applies the given paths sequentially
     *
     * @throws NullPointerException if {@code paths} is {@code null} or contains {@code null} elements
     */
    public static UnaryOperator<Rover> sequence(final List<UnaryOperator<Rover>> paths) {

        if ( paths == null || paths.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null paths");
        }

        return sequence(paths.stream());
    }

    /**
     * Creates a sequence path operator that applies paths in order.
     *
     * @param paths the paths to apply in sequence
     *
     * @return a path operator that applies the given paths sequentially
     *
     * @throws NullPointerException if {@code paths} is {@code null}
     */
    public static UnaryOperator<Rover> sequence(final Stream<UnaryOperator<Rover>> paths) {

        if ( paths == null ) {
            throw new NullPointerException("null paths");
        }

        return rover -> rover.traverse(paths.reduce(identity(), (x, y) -> r ->
                r.traverse(x).traverse(y)
        ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Set<Value> focus;
    private final Set<Statement> model;


    private Rover(final Set<Value> focus, final Set<Statement> model) {
        this.focus=focus;
        this.model=model;
    }


    /**
     * Splits this rover into individual Rovers for each focused value.
     *
     * @return a stream of Rovers, each focused on a single value
     */
    public Stream<Rover> split() {
        return focus.stream().map(value -> new Rover(set(value), model));
    }


    /**
     * Configures this rover to focus on the specified URI values.
     *
     * @param values the URI values to focus on
     *
     * @return a new rover focused on the given values
     *
     * @throws NullPointerException if {@code values} is {@code null} or contains {@code null} elements
     */
    public Rover focus(final URI... values) {

        if ( values == null || Arrays.stream(values).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null values");
        }

        return new Rover(set(Arrays.stream(values).map(uri -> iri(uri.toString()))), model);
    }

    /**
     * Configures this rover to focus on the specified RDF values.
     *
     * @param values the RDF values to focus on
     *
     * @return a new rover focused on the given values
     *
     * @throws NullPointerException if {@code values} is {@code null} or contains {@code null} elements
     */
    public Rover focus(final Value... values) {

        if ( values == null || Arrays.stream(values).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null values");
        }

        return new Rover(set(values), model);
    }


    /**
     * Traverses the RDF graph using the specified predicates in sequence.
     *
     * @param predicates the predicates to traverse in forward direction
     *
     * @return a new rover with values reached by following the predicates
     *
     * @throws NullPointerException if {@code predicates} is {@code null}
     */
    public Rover traverse(final URI... predicates) {

        if ( predicates == null ) {
            throw new NullPointerException("null predicates");
        }

        return traverse(sequence(Arrays.stream(predicates).map(Rover::forward)));
    }

    /**
     * Traverses the RDF graph using the specified predicates in sequence.
     *
     * @param predicates the predicates to traverse in forward direction
     *
     * @return a new rover with values reached by following the predicates
     *
     * @throws NullPointerException if {@code predicates} is {@code null}
     */
    public Rover traverse(final IRI... predicates) {

        if ( predicates == null ) {
            throw new NullPointerException("null predicates");
        }

        return traverse(sequence(Arrays.stream(predicates).map(Rover::forward)));
    }

    /**
     * Traverses the RDF graph using the specified path operator.
     *
     * @param path the path operator to apply
     *
     * @return a new rover with values reached by applying the path
     *
     * @throws NullPointerException if {@code path} is {@code null} or returns {@code null}
     */
    public Rover traverse(final UnaryOperator<Rover> path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return requireNonNull(path.apply(this), "null path result");
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves the first boolean value from the focus set.
     *
     * @return an {@code Optional} containing the first boolean value, or empty if none found
     */
    public Optional<Boolean> bool() {
        return bools().findFirst();
    }

    /**
     * Retrieves the first numeric value from the focus set.
     *
     * @return an {@code Optional} containing the first numeric value, or empty if none found
     */
    public Optional<Number> number() {
        return numbers().findFirst();
    }

    /**
     * Retrieves the first numeric value from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform numeric values
     * @param <T>    the type of the transformed value
     *
     * @return an {@code Optional} containing the first transformed numeric value, or empty if none found
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Optional<T> number(final Function<Number, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return numbers(mapper).findFirst();
    }

    /**
     * Retrieves the first string value from the focus set.
     *
     * @return an {@code Optional} containing the first string value, or empty if none found
     */
    public Optional<String> string() {
        return strings().findFirst();
    }

    /**
     * Retrieves the first string value from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform string values
     * @param <T>    the type of the transformed value
     *
     * @return an {@code Optional} containing the first transformed string value, or empty if none found
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Optional<T> string(final Function<String, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return strings(mapper).findFirst();
    }

    /**
     * Retrieves the first URI value from the focus set.
     *
     * @return an {@code Optional} containing the first URI value, or empty if none found
     */
    public Optional<URI> uri() {
        return uris().findFirst();
    }

    /**
     * Retrieves the first temporal accessor value from the focus set.
     *
     * @return an {@code Optional} containing the first temporal accessor value, or empty if none found
     */
    public Optional<TemporalAccessor> temporalAccessor() {
        return temporalAccessors().findFirst();
    }

    /**
     * Retrieves the first year value from the focus set.
     *
     * @return an {@code Optional} containing the first year value, or empty if none found
     */
    public Optional<Year> year() {
        return years().findFirst();
    }

    /**
     * Retrieves the first year-month value from the focus set.
     *
     * @return an {@code Optional} containing the first year-month value, or empty if none found
     */
    public Optional<YearMonth> yearMonth() {
        return yearMonths().findFirst();
    }

    /**
     * Retrieves the first local date value from the focus set.
     *
     * @return an {@code Optional} containing the first local date value, or empty if none found
     */
    public Optional<LocalDate> localDate() {
        return localDates().findFirst();
    }

    /**
     * Retrieves the first local time value from the focus set.
     *
     * @return an {@code Optional} containing the first local time value, or empty if none found
     */
    public Optional<LocalTime> localTime() {
        return localTimes().findFirst();
    }

    /**
     * Retrieves the first offset time value from the focus set.
     *
     * @return an {@code Optional} containing the first offset time value, or empty if none found
     */
    public Optional<OffsetTime> offsetTime() {
        return offsetTimes().findFirst();
    }

    /**
     * Retrieves the first local date-time value from the focus set.
     *
     * @return an {@code Optional} containing the first local date-time value, or empty if none found
     */
    public Optional<LocalDateTime> localDateTime() {
        return localDateTimes().findFirst();
    }

    /**
     * Retrieves the first offset date-time value from the focus set.
     *
     * @return an {@code Optional} containing the first offset date-time value, or empty if none found
     */
    public Optional<OffsetDateTime> offsetDateTime() {
        return offsetDateTimes().findFirst();
    }

    /**
     * Retrieves the first zoned date-time value from the focus set.
     *
     * @return an {@code Optional} containing the first zoned date-time value, or empty if none found
     */
    public Optional<ZonedDateTime> zonedDateTime() {
        return zonedDateTimes().findFirst();
    }

    /**
     * Retrieves the first instant value from the focus set.
     *
     * @return an {@code Optional} containing the first instant value, or empty if none found
     */
    public Optional<Instant> instant() {
        return instants().findFirst();
    }


    /**
     * Retrieves the first temporal amount value from the focus set.
     *
     * @return an {@code Optional} containing the first temporal amount value, or empty if none found
     */
    public Optional<TemporalAmount> temporalAmount() {
        return temporalAmounts().findFirst();
    }

    /**
     * Retrieves the first period value from the focus set.
     *
     * @return an {@code Optional} containing the first period value, or empty if none found
     */
    public Optional<Period> period() {
        return periods().findFirst();
    }

    /**
     * Retrieves the first duration value from the focus set.
     *
     * @return an {@code Optional} containing the first duration value, or empty if none found
     */
    public Optional<Duration> duration() {
        return durations().findFirst();
    }


    /**
     * Retrieves the first localized text value from the focus set.
     *
     * @return an {@code Optional} containing the first localized text entry, or empty if none found
     */
    public Optional<Entry<Locale, String>> text() {
        return texts().findFirst();
    }

    /**
     * Retrieves the first typed data value from the focus set.
     *
     * @return an {@code Optional} containing the first typed data entry, or empty if none found
     */
    public Optional<Entry<URI, String>> data() {
        return datas().findFirst();
    }

    /**
     * Retrieves the first RDF value from the focus set.
     *
     * @return an {@code Optional} containing the first RDF value, or empty if none found
     */
    public Optional<Value> value() {
        return values().findFirst();
    }

    /**
     * Retrieves the first RDF value from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform RDF values
     * @param <T>    the type of the transformed value
     *
     * @return an {@code Optional} containing the first transformed RDF value, or empty if none found
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Optional<T> value(final Function<Value, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return values(mapper).findFirst();
    }


    /**
     * Retrieves all boolean values from the focus set.
     *
     * @return a stream of boolean values extracted from boolean literals
     */
    public Stream<Boolean> bools() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.BOOLEAN))
                .map(Literal::booleanValue);
    }

    /**
     * Retrieves all numeric values from the focus set.
     *
     * @return a stream of numeric values extracted from numeric literals
     */
    public Stream<Number> numbers() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .flatMap(nullable(literal -> switch ( literal.getDatatype().toString() ) {

                    case BYTE -> literal.byteValue();
                    case SHORT -> literal.shortValue();
                    case INT -> literal.intValue();
                    case LONG -> literal.longValue();
                    case FLOAT -> literal.floatValue();
                    case DOUBLE -> literal.doubleValue();
                    case INTEGER -> literal.integerValue();
                    case DECIMAL -> literal.decimalValue();

                    default -> null;

                }));
    }

    /**
     * Retrieves all numeric values from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform numeric values
     * @param <T>    the type of the transformed value
     *
     * @return a stream of transformed numeric values
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Stream<T> numbers(final Function<Number, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return numbers().flatMap(optional(lenient(mapper)));
    }

    /**
     * Retrieves all string values from the focus set.
     *
     * @return a stream of string values extracted from string literals
     */
    public Stream<String> strings() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.STRING))
                .map(Value::stringValue);
    }

    /**
     * Retrieves all string values from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform string values
     * @param <T>    the type of the transformed value
     *
     * @return a stream of transformed string values
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Stream<T> strings(final Function<String, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return strings().flatMap(optional(lenient(mapper)));
    }

    /**
     * Retrieves all URI values from the focus set.
     *
     * @return a stream of URI values extracted from IRI nodes and anyURI literals
     */
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
                .flatMap(optional(lenient(URI::create)));
    }

    /**
     * Retrieves all temporal accessor values from the focus set.
     *
     * @return a stream of temporal accessor values extracted from temporal literals
     */
    public Stream<TemporalAccessor> temporalAccessors() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> TEMPORAL_ACCESSORS.contains(v.getDatatype()))
                .flatMap(optional(lenient(Literal::temporalAccessorValue)));
    }

    /**
     * Retrieves all temporal accessor values from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform temporal accessor values
     * @param <T>    the type of the transformed value
     *
     * @return a stream of transformed temporal accessor values
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Stream<T> temporalAccessors(final Function<TemporalAccessor, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return temporalAccessors().flatMap(optional(lenient(mapper)));
    }

    /**
     * Retrieves all year values from the focus set.
     *
     * @return a stream of year values extracted from temporal literals
     */
    public Stream<Year> years() {
        return temporalAccessors(Year::from);
    }

    /**
     * Retrieves all year-month values from the focus set.
     *
     * @return a stream of year-month values extracted from temporal literals
     */
    public Stream<YearMonth> yearMonths() {
        return temporalAccessors(YearMonth::from);
    }

    /**
     * Retrieves all local date values from the focus set.
     *
     * @return a stream of local date values extracted from temporal literals
     */
    public Stream<LocalDate> localDates() {
        return temporalAccessors(LocalDate::from);
    }

    /**
     * Retrieves all local time values from the focus set.
     *
     * @return a stream of local time values extracted from temporal literals
     */
    public Stream<LocalTime> localTimes() {
        return temporalAccessors(LocalTime::from);
    }

    /**
     * Retrieves all offset time values from the focus set.
     *
     * @return a stream of offset time values extracted from temporal literals
     */
    public Stream<OffsetTime> offsetTimes() {
        return temporalAccessors(OffsetTime::from);
    }

    /**
     * Retrieves all local date-time values from the focus set.
     *
     * @return a stream of local date-time values extracted from temporal literals
     */
    public Stream<LocalDateTime> localDateTimes() {
        return temporalAccessors(LocalDateTime::from);
    }

    /**
     * Retrieves all offset date-time values from the focus set.
     *
     * @return a stream of offset date-time values extracted from temporal literals
     */
    public Stream<OffsetDateTime> offsetDateTimes() {
        return temporalAccessors(OffsetDateTime::from);
    }

    /**
     * Retrieves all zoned date-time values from the focus set.
     *
     * @return a stream of zoned date-time values extracted from temporal literals
     */
    public Stream<ZonedDateTime> zonedDateTimes() {
        return temporalAccessors(ZonedDateTime::from);
    }

    /**
     * Retrieves all instant values from the focus set.
     *
     * @return a stream of instant values extracted from temporal literals
     */
    public Stream<Instant> instants() {
        return temporalAccessors(Instant::from);
    }

    /**
     * Retrieves all temporal amount values from the focus set.
     *
     * @return a stream of temporal amount values extracted from duration literals
     */
    public Stream<TemporalAmount> temporalAmounts() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> TEMPORAL_AMOUNTS.contains(v.getDatatype()))
                .flatMap(optional(lenient(Literal::temporalAmountValue)));
    }

    /**
     * Retrieves all temporal amount values from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform temporal amount values
     * @param <T>    the type of the transformed value
     *
     * @return a stream of transformed temporal amount values
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Stream<T> temporalAmounts(final Function<TemporalAmount, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return temporalAmounts().flatMap(optional(lenient(mapper)));
    }

    /**
     * Retrieves all period values from the focus set.
     *
     * @return a stream of period values extracted from duration literals
     */
    public Stream<Period> periods() {
        return temporalAmounts(Period::from);
    }

    /**
     * Retrieves all duration values from the focus set.
     *
     * @return a stream of duration values extracted from duration literals
     */
    public Stream<Duration> durations() {
        return temporalAmounts(Duration::from);
    }

    /**
     * Retrieves all localized text values from the focus set.
     *
     * @return a stream of locale-string entries extracted from text literals
     */
    public Stream<Entry<Locale, String>> texts() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .filter(v -> v.getDatatype().equals(XSD.STRING) || v.getLanguage().isPresent())
                .map(v -> entry(locale(v.getLanguage().orElse("")), v.stringValue()));
    }

    /**
     * Retrieves all typed data values from the focus set.
     *
     * @return a stream of datatype-string entries extracted from all literals
     */
    public Stream<Entry<URI, String>> datas() {
        return focus.stream()
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .map(v -> entry(URIs.uri(v.getDatatype().stringValue()), v.stringValue()));
    }

    /**
     * Retrieves all RDF values from the focus set.
     *
     * @return a stream of all RDF values in the focus set
     */
    public Stream<Value> values() {
        return focus.stream();
    }

    /**
     * Retrieves all RDF values from the focus set, transformed by the given mapper.
     *
     * @param mapper the function to transform RDF values
     * @param <T>    the type of the transformed value
     *
     * @return a stream of transformed RDF values
     *
     * @throws NullPointerException if {@code mapper} is {@code null}
     */
    public <T> Stream<T> values(final Function<Value, T> mapper) {

        if ( mapper == null ) {
            throw new NullPointerException("null mapper");
        }

        return values().flatMap(optional(lenient(mapper)));
    }

}
