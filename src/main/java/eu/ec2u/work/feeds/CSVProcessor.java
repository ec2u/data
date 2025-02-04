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

package eu.ec2u.work.feeds;


import com.metreeca.http.actions.GET;
import com.metreeca.http.csv.formats.CSV;
import com.metreeca.http.services.Logger;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public abstract class CSVProcessor<V> implements Function<String, Xtream<V>> {

    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setNullString("")
            .build();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override public Xtream<V> apply(final String url) {

        final Collection<CSVRecord> records=Xtream.of(url)
                .optMap(new GET<>(new CSV(Format)))
                .flatMap(Collection::stream)
                .collect(toList());

        return Xtream.from(records)
                .optMap(record -> process(record, records));

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////

    protected abstract Optional<V> process(final CSVRecord record, final Collection<CSVRecord> records);


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    protected Optional<String> value(final CSVRecord record, final String label) {
        return record.getParser().getHeaderNames().contains(label)
                ? Optional.ofNullable(record.get(label)).map(Strings::normalize).filter(not(String::isEmpty))
                : Optional.empty();
    }

    protected Stream<String> values(final CSVRecord record, final String label) {
        return value(record, label).stream()
                .flatMap(Strings::split)
                .map(Strings::normalize);
    }

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

    protected void warning(final CSVRecord record, final String message) {
        warning(format("line <%d> - %s", record.getRecordNumber()+1, message));
    }

    protected void warning(final String message) {
        logger.warning(getClass(), message);
    }

}
