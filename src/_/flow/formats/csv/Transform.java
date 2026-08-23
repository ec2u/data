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

package com.metreeca.flow.csv.actions;


import com.metreeca.flow.csv.formats.CSV;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.services.Logger;
import com.metreeca.shim.Strings;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.Strings.split;

import static java.lang.String.format;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;

/**
 * CSV data transformation action.
 *
 * <p>Abstract action for processing CSV data from URLs and transforming records into target objects.</p>
 *
 * @param <V> the type of values produced by the transformation
 */
public abstract class Transform<V> implements Function<String, Stream<V>> {

    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setNullString("")
            .build();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override
    public Stream<V> apply(final String url) {

        final Collection<CSVRecord> records=Stream.of(url)
                .flatMap(optional(new GET<>(new CSV(Format))))
                .flatMap(Collection::stream)
                .toList();

        return records.stream()
                .map(record -> async(() -> process(record, records)))
                .collect(joining())
                .flatMap(identity());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Processes a single CSV record into target values.
     *
     * @param record  the current CSV record to process
     * @param records the complete collection of CSV records for context
     *
     * @return a stream of target values produced from the record
     */
    protected abstract Stream<V> process(final CSVRecord record, final Collection<CSVRecord> records);


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves a normalized string value from a CSV record column.
     *
     * @param record the CSV record
     * @param label the column header label
     * @return the normalized value if present and non-empty
     * @throws NullPointerException if either record or label is {@code null}
     */
    protected Optional<String> value(final CSVRecord record, final String label) {
        return record.getParser().getHeaderNames().contains(label)
                ? Optional.ofNullable(record.get(label)).map(Strings::normalize).filter(not(String::isEmpty))
                : Optional.empty();
    }

    /**
     * Retrieves multiple normalized string values from a semicolon-separated CSV column.
     *
     * @param record the CSV record
     * @param label the column header label
     * @return a stream of normalized values split by semicolon
     * @throws NullPointerException if either record or label is {@code null}
     */
    protected Stream<String> values(final CSVRecord record, final String label) {
        return value(record, label).stream()
                .flatMap(v -> split(v, ";"))
                .map(Strings::normalize);
    }

    /**
     * Retrieves a parsed value from a CSV record column.
     *
     * @param <R> the target type
     * @param record the CSV record
     * @param label the column header label
     * @param parser the parsing function
     * @return the parsed value if present and valid
     * @throws NullPointerException if any of record, label, or parser is {@code null}
     */
    protected <R> Optional<R> value(final CSVRecord record, final String label,
            final Function<String, Optional<R>> parser
    ) {

        final Optional<String> string=value(record, label);
        final Optional<R> value=string.flatMap(parser);

        if ( string.isPresent() && value.isEmpty() ) {
            warning(record, format("malformed <%s> value <%s>", label, string.get()));
        }

        return value;
    }

    /**
     * Retrieves multiple parsed values from a semicolon-separated CSV column.
     *
     * @param <R> the target type
     * @param record the CSV record
     * @param label the column header label
     * @param parser the parsing function
     * @return a stream of parsed values
     * @throws NullPointerException if any of record, label, or parser is {@code null}
     */
    protected <R> Stream<R> values(final CSVRecord record, final String label,
            final Function<String, Optional<R>> parser
    ) {

        final Collection<String> strings=values(record, label)
                .toList();

        final Collection<R> values=strings.stream()
                .map(parser)
                .flatMap(Optional::stream)
                .toList();

        if ( strings.size() != values.size() ) {
            warning(record, format("malformed %s value", label));
        }

        return values.stream();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Logs a warning message for a specific CSV record.
     *
     * @param record the CSV record
     * @param message the warning message
     * @throws NullPointerException if either record or message is {@code null}
     */
    protected void warning(final CSVRecord record, final String message) {
        warning(format("line <%d> - %s", record.getRecordNumber()+1, message));
    }

    /**
     * Logs a warning message.
     *
     * @param message the warning message
     * @throws NullPointerException if message is {@code null}
     */
    protected void warning(final String message) {
        logger.warning(getClass(), message);
    }

}
