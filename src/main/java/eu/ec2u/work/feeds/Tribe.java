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

package eu.ec2u.work.feeds;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.Work;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.core.toolkits.Formats.SQL_TIMESTAMP;
import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.core.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.EC2U.item;

import static java.time.ZoneOffset.UTC;
import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;


public final class Tribe implements Function<Instant, Xtream<Frame>> {

    private static final Period Delta=Period.ofDays(90);


    private static Literal instant(final String timestamp) {
        return literal(ZonedDateTime
                .of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), UTC)
                .truncatedTo(ChronoUnit.SECONDS)
        );
    }

    private static Literal datetime(final String timestamp, final ZoneId zone, final Instant instant) {
        return literal(OffsetDateTime
                .of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), zone.getRules().getOffset(instant))
                .truncatedTo(ChronoUnit.SECONDS)
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final String base;

    private IRI country;
    private IRI locality;
    private String language;
    private ZoneId zone=ZoneId.of("UTC");


    public Tribe(final String base) {

        if ( base == null ) {
            throw new NullPointerException("null base");
        }

        this.base=base.endsWith("/") ? base.substring(0, base.length()-1) : base;
    }


    public Tribe country(final IRI country) {

        if ( country == null ) {
            throw new NullPointerException("null country");
        }

        this.country=country;

        return this;
    }

    public Tribe locality(final IRI locality) {

        if ( locality == null ) {
            throw new NullPointerException("null locality");
        }

        this.locality=locality;

        return this;
    }

    public Tribe language(final String language) {

        if ( language == null ) {
            throw new NullPointerException("null language"); // !!! well-formedness
        }

        this.language=language;

        return this;
    }

    public Tribe zone(final ZoneId zone) {

        if ( zone == null ) {
            throw new NullPointerException("null zone");
        }

        this.zone=zone;

        return this;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public Xtream<Frame> apply(final Instant instant) {

        if ( instant == null ) {
            throw new NullPointerException("null instant");
        }

        return crawl(instant).optMap(this::event);

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()

                        .model(base+"/wp-json/tribe/events/v1/events/"
                                +"?per_page=100"
                                +"&start_date={start}"
                                +"&page={page}"
                        )

                        .value("start", LocalDate.now().minus(Delta))
                        .value("page", 1)

                )

                .scan(page -> Xtream.of(page)

                        .optMap(new GET<>(new JSON()))
                        .map(JSONPath::new)

                        .map(path -> entry(
                                path.strings("next_rest_url"),
                                path.paths("events.*")
                        ))

                );
    }

    private Optional<Frame> event(final JSONPath event) {

        final Instant now=Instant.now();

        final Optional<Literal> title=event.string("title")
                .map(XPath::decode)
                .map(text -> literal(text, language));

        final Optional<Literal> excerpt=event.string("excerpt")
                .or(() -> event.string("description"))
                .map(Untag::untag)
                .filter(not(String::isEmpty)) // eg single image link
                .map(v -> Strings.clip(v, TextLength))
                .map(text -> literal(text, language));

        final Optional<Literal> description=event.string("description")
                .map(Untag::untag)
                .filter(not(String::isEmpty)) // eg single image link
                .map(text -> literal(text, language));

        return event.string("url").map(id -> frame(iri(Events.Context, md5(id)))

                .value(RDF.TYPE, Events.Event)

                .value(DCTERMS.SOURCE, event.string("url").flatMap(Work::url).map(Values::iri))
                .value(DCTERMS.CREATED, event.string("date_utc").map(Tribe::instant))
                .value(DCTERMS.MODIFIED, event.string("modified_utc").map(Tribe::instant))
                .frames(DCTERMS.SUBJECT, event.paths("categories.*").optMap(this::category))

                .value(Schema.url, event.string("url").flatMap(Work::url).map(Values::iri))
                .value(Schema.name, title)
                .value(Schema.image, event.string("image.url").flatMap(Work::url).map(Values::iri))
                .value(Schema.description, description)
                .value(Schema.disambiguatingDescription, excerpt)

                .value(Schema.startDate, event.string("start_date").map(timestamp -> datetime(timestamp, zone, now)))
                .value(Schema.endDate, event.string("end_date").map(timestamp -> datetime(timestamp, zone, now)))

                .bool(Schema.isAccessibleForFree, event
                        .string("cost").filter(v -> v.equalsIgnoreCase("livre")) // !!! localize
                        .isPresent()
                )

                .frame(Schema.location, event.path("venue").flatMap(this::location))
                .frames(Schema.organizer, event.paths("organizer.*").optMap(this::organizer))

        );

    }

    private Optional<Frame> category(final JSONPath category) {
        return category.string("urls.self").map(self -> {

            final Optional<Literal> name=category.string("name").map(text -> literal(text, language));

            return frame(EC2U.item(Events.Scheme, self))
                    .value(RDF.TYPE, SKOS.CONCEPT)
                    .value(RDFS.LABEL, name)
                    .value(SKOS.PREF_LABEL, name);

        });
    }

    private Optional<Frame> organizer(final JSONPath organizer) {
        return organizer.string("url").map(id -> frame(item(Organizations.Context, id))

                .value(RDF.TYPE, Schema.Organization)

                .value(Schema.url, organizer.string("website").flatMap(Work::url).map(Values::iri))
                .value(Schema.name, organizer.string("organizer").map(XPath::decode).map(text -> literal(text,
                        language)))
                .value(Schema.email, organizer.string("email").map(Values::literal))
                .value(Schema.telephone, organizer.string("phone").map(Values::literal))

        );
    }

    private Optional<Frame> location(final JSONPath location) {
        return location.string("url").map(id -> {

            // !!! lookup by name

            final Optional<Value> addressCountry=Optional.ofNullable(country);
            final Optional<Value> addressLocality=Optional.ofNullable(locality);
            final Optional<Value> streetAddress=location.string("address").map(Values::literal);

            return frame(item(Locations.Context, id))

                    .value(RDF.TYPE, Schema.Place)

                    .value(Schema.url, location.string("url").map(Values::iri))
                    .value(Schema.name, location.string("venue").map(text -> literal(text, language)))

                    .value(Schema.latitude, location.decimal("geo_lat").map(Values::literal))
                    .value(Schema.longitude, location.decimal("geo_lng").map(Values::literal))

                    .frame(Schema.address, frame(item(Locations.Context, Xtream

                            .of(addressCountry, addressLocality, streetAddress)

                            .optMap(identity())
                            .map(Value::stringValue)
                            .collect(joining("\n"))))

                            .value(RDF.TYPE, Schema.PostalAddress)

                            .value(Schema.addressCountry, addressCountry)
                                    .value(Schema.addressLocality, addressLocality)
                                    .value(Schema.streetAddress, streetAddress)

                                    .value(Schema.url, location.string("website").flatMap(Work::url).map(Values::iri))
                                    .value(Schema.email, location.string("email").map(Values::literal))
                                    .value(Schema.telephone, location.string("phone").map(Values::literal))
                    );

        });

    }

}
