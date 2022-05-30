/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.tasks.events;

import com.metreeca.core.Identifiers;
import com.metreeca.core.Strings;
import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.cities.Poitiers;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.RSS;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.TextLength;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.xml.formats.XMLFormat.xml;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoField.*;
import static java.util.function.Predicate.not;

public final class EventsPoitiersUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.univ-poitiers.fr/c/actualites/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("University of Poitiers / News and Events", "en"),
                    literal("Université de Poitiers / Actualités et événements", Poitiers.Language)
            );


    private static final DateTimeFormatter EU_DATE=new DateTimeFormatterBuilder()

            .parseStrict()

            .appendValue(DAY_OF_MONTH, 2)
            .appendLiteral("/")
            .appendValue(MONTH_OF_YEAR, 2)
            .appendLiteral("/")
            .appendValue(YEAR, 4)

            .toFormatter(Locale.ROOT);

    private static final DateTimeFormatter EU_TIME=new DateTimeFormatterBuilder()

            .parseStrict()

            .appendValue(HOUR_OF_DAY, 2)
            .appendLiteral(":")
            .appendValue(MINUTE_OF_HOUR, 2)

            .optionalStart()
            .appendLiteral(":")
            .appendValue(SECOND_OF_MINUTE, 2)
            .optionalEnd()

            .toFormatter(Locale.ROOT);


    public static void main(final String... args) {
        exec(() -> new EventsPoitiersUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Element> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.univ-poitiers.fr/feed/ec2u")
                )

                .optMap(new GET<>(xml()))

                .flatMap(new XPath<>(xpath -> xpath.elements("/rss/channel/item")));
    }

    private Frame event(final Node node) {

        return new XPath<>(item -> {

            final Optional<IRI> link=item.link("link")
                    .map(Values::iri);

            final Optional<Literal> pubDate=RSS.pubDate(item).map(Values::literal);

            final Optional<Value> label=item.string("title")
                    .map(text -> Strings.clip(text, TextLength))
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<String> description=item.string("content:encoded")
                    .map(Untag::untag)
                    .or(() -> item.string("description"));

            final Optional<Value> brief=description
                    .map(text -> Strings.clip(text, TextLength))
                    .map(text -> literal(text, Poitiers.Language));

            return frame(iri(EC2U.events,
                    link.map(Value::stringValue).map(Identifiers::md5).orElseGet(Identifiers::md5)
            ))

                    .values(RDF.TYPE, EC2U.Event, Schema.Event)
                    .value(RDFS.LABEL, label)
                    .value(RDFS.COMMENT, brief)

                    .value(EC2U.university, Poitiers.University)

                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.SOURCE, link)

                    .value(DCTERMS.ISSUED, pubDate)
                    .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now)))

                    .frames(DCTERMS.SUBJECT, item.strings("category")
                            .map(c -> frame(iri(EC2U.concepts, md5(c)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(RDFS.LABEL, literal(c, Poitiers.Language))
                                    .value(SKOS.PREF_LABEL, literal(c, Poitiers.Language))
                            )
                    )

                    .value(Schema.url, link)
                    .value(Schema.name, label)
                    .value(Schema.disambiguatingDescription, brief)
                    .value(Schema.description, description.map(value -> literal(value, Poitiers.Language)))

                    .value(Schema.startDate, startDate(item))
                    .value(Schema.endDate, endDate(item))

                    .frame(Schema.location, location(item));

        }).apply(node);

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> startDate(final XPath.Processor item) {

        final Optional<LocalDate> dateFrom=item.string("date_from")
                .map(EU_DATE::parse)
                .map(LocalDate::from);

        final LocalTime hourFrom=item.string("hour_from")
                .map(EU_TIME::parse)
                .map(LocalTime::from)
                .map(time -> time.truncatedTo(ChronoUnit.SECONDS))
                .orElseGet(() -> LocalTime.of(0, 0, 0));


        return dateFrom
                .map(date -> date.atTime(hourFrom))
                .map(dateTime -> dateTime.atOffset(Poitiers.TimeOffset))
                .map(Values::literal);
    }

    private Optional<Literal> endDate(final XPath.Processor item) {

        final Optional<LocalDate> dateTo=item.string("date_to")
                .map(EU_DATE::parse)
                .map(LocalDate::from);

        final LocalTime hourTo=item.string("hour_to")
                .map(EU_TIME::parse)
                .map(LocalTime::from)
                .map(time -> time.truncatedTo(ChronoUnit.SECONDS))
                .orElseGet(() -> LocalTime.of(0, 0, 0));

        return dateTo
                .map(date -> date.atTime(hourTo))
                .map(dateTime -> dateTime.atOffset(Poitiers.TimeOffset))
                .map(Values::literal);
    }

    private Optional<Frame> location(final XPath.Processor item) {

        return item.string("place/place_name").filter(not(String::isEmpty))

                .map(name -> frame(iri(EC2U.locations, md5(name)))

                        .value(RDF.TYPE, Schema.Place)

                        .value(Schema.name, literal(name, Poitiers.Language))

                        .value(Schema.description, item.string("place/place_address")
                                .filter(not(String::isEmpty))
                                .map(Untag::untag)
                                .map(value -> literal(value, Poitiers.Language))
                        )
                );
    }

}
