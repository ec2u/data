/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.events;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.toolkits.Identifiers;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.codecs.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.work.feeds.RSS;
import eu.ec2u.work.validation.Validators;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.core.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.EC2U.University.Poitiers;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events._Events.synced;
import static eu.ec2u.data.events._Uploads.upload;

import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoField.*;
import static java.util.function.Predicate.not;

public final class EventsPoitiersUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.univ-poitiers.fr/c/actualites/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
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
        Data.exec(() -> new EventsPoitiersUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .sink(events -> upload(Events.Context,
                        Validators._validate(Event(), Set.of(Events.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.univ-poitiers.fr/feed/ec2u")
                )

                .optMap(new GET<>(new XML()))

                .map(XPath::new).flatMap(xpath -> xpath.paths("/rss/channel/item"));
    }

    private Frame event(final XPath item) {

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

        return frame(iri(Events.Context,
                link.map(Value::stringValue).map(Identifiers::md5).orElseGet(Identifiers::md5)
        ))

                .values(RDF.TYPE, Events.Event)

                .value(Resources.university, Poitiers.Id)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.SOURCE, link)

                .value(DCTERMS.CREATED, pubDate)
                .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now)))

                .frames(DCTERMS.SUBJECT, item.strings("category")
                        .map(c -> frame(iri(Concepts.Id, md5(c)))
                                .value(RDF.TYPE, SKOS.CONCEPT)
                                .value(RDFS.LABEL, literal(c, Poitiers.Language))
                                .value(SKOS.PREF_LABEL, literal(c, Poitiers.Language))
                        )
                )

                .value(Schema.url, link)
                .value(Schema.name, label)
                    .value(Schema.image, item.link("image").map(Values::iri))
                .value(Schema.disambiguatingDescription, brief)
                .value(Schema.description, description.map(value -> literal(value, Poitiers.Language)))

                .value(Schema.startDate, startDate(item))
                .value(Schema.endDate, endDate(item))

                .frame(Schema.location, location(item));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> startDate(final XPath item) {

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
                .map(dateTime -> dateTime.atZone(Poitiers.TimeZone))
                .map(Values::literal);
    }

    private Optional<Literal> endDate(final XPath item) {

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
                .map(dateTime -> dateTime.atZone(Poitiers.TimeZone))
                .map(Values::literal);
    }

    private Optional<Frame> location(final XPath item) {

        return item.string("place/place_name").filter(not(String::isEmpty))

                .map(name -> frame(iri(Locations.Context, md5(name)))

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
