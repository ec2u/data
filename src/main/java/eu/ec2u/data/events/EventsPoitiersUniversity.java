/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.toolkits.Identifiers;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.XML;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;

import static com.metreeca.http.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.synced;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.things.Schema.location;
import static eu.ec2u.data.universities._Universities.Poitiers;
import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoField.*;
import static java.util.function.Predicate.not;

public final class EventsPoitiersUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/poitiers/university");

    private static final com.metreeca.link.Frame Publisher=com.metreeca.link.Frame.frame(

            field(ID, iri("https://www.univ-poitiers.fr/c/actualites/")),
            field(TYPE, Organization),

            field(owner, Poitiers.Id),

            field(Schema.name,

                    literal("University of Poitiers / News and Events", "en"),
                    literal("Université de Poitiers / Actualités et événements", Poitiers.Language)
            ),

            field(Schema.about, OrganizationTypes.University)

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
        update(connection -> Xtream.of(synced(Context, Publisher.id().orElseThrow()))

                .flatMap(this::crawl)
                .map(this::event)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))
        );
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
                .map(Frame::iri);

        final Optional<Literal> pubDate=RSS.pubDate(item).map(Frame::literal);

        final Optional<Value> label=item.string("title")
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, Poitiers.Language));

        final Optional<String> description=item.string("content:encoded")
                .map(Untag::untag)
                .or(() -> item.string("description"));

        final Optional<Value> brief=description
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, Poitiers.Language));

        return frame(

                field(ID, iri(Events.Context,
                        link.map(Value::stringValue).map(Identifiers::md5).orElseGet(Identifiers::md5)
                )),

                field(RDF.TYPE, Events.Event),


                field(Schema.url, link),
                field(Schema.name, label),
                field(Schema.image, item.link("image").map(Frame::iri)),
                field(Schema.disambiguatingDescription, brief),
                field(Schema.description, description.map(value -> literal(value, Poitiers.Language))),

                field(startDate, startDate(item)),
                field(endDate, endDate(item)),

                // field(DCTERMS.CREATED, pubDate),
                // field(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now))),

                field(Schema.about, item.strings("category").map(category -> frame(
                        field(ID, item(Topics, category)),
                        field(RDF.TYPE, SKOS.CONCEPT),
                        field(SKOS.TOP_CONCEPT_OF, Topics),
                        field(SKOS.PREF_LABEL, literal(category, Poitiers.Language))
                ))),

                field(owner, Poitiers.Id),
                field(publisher, Publisher),
                field(location, location(item))

        );
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
                .map(Frame::literal);
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
                .map(Frame::literal);
    }

    private Optional<Frame> location(final XPath item) {

        return item.string("place/place_name").filter(not(String::isEmpty))

                .map(name -> frame(

                        field(ID, item(Locations.Context, name)),

                        field(RDF.TYPE, Schema.Place),

                        field(Schema.name, literal(name, Poitiers.Language)),

                        field(Schema.description, item.string("place/place_address")
                                .filter(not(String::isEmpty))
                                .map(Untag::untag)
                                .map(value -> literal(value, Poitiers.Language))
                        )
                ));
    }

}
