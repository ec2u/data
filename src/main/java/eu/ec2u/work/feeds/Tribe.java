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

package eu.ec2u.work.feeds;

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.link.Frame;

import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.http.toolkits.Formats.SQL_TIMESTAMP;
import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.http.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.things.Schema.location;
import static java.time.ZoneOffset.UTC;
import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;


public final class Tribe implements Function<Instant, Xtream<Frame>> {

    private static final Period Delta=Period.ofDays(90);


    private static Literal instant(final String timestamp) {
        return literal(LocalDateTime.parse(timestamp, SQL_TIMESTAMP).toInstant(UTC));
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

    private final Instant now=Instant.now();


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

    private Xtream<JSONPath> crawl(final Instant updated) {
        return Xtream.of(updated)

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

        return event.string("url").map(id -> frame(

                field(ID, iri(Context, md5(id))),

                field(RDF.TYPE, Event),

                field(Schema.about, event.paths("categories.*").optMap(this::category)),

                field(Schema.url, event.string("url").flatMap(Parsers::url).map(Frame::iri)),
                field(Schema.name, title),
                field(Schema.image, event.string("image.url").flatMap(Parsers::url).map(Frame::iri)),
                field(Schema.description, description),
                field(Schema.disambiguatingDescription, excerpt),

                field(startDate, event.string("start_date").map(timestamp -> datetime(timestamp, zone, now))),
                field(endDate, event.string("end_date").map(timestamp -> datetime(timestamp, zone, now))),

                field(Schema.isAccessibleForFree, literal(event
                        .string("cost").filter(v -> v.equalsIgnoreCase("livre")) // !!! localize
                        .isPresent()
                )),

                field(location, event.path("venue").flatMap(this::location)),
                field(organizer, event.paths("organizer.*").optMap(this::organizer))

        ));

    }

    private Optional<Frame> category(final JSONPath category) {
        return category.string("urls.self").map(self -> {

            final Optional<Literal> name=category.string("name").map(text -> literal(text, language));

            return frame(

                    field(ID, item(Topics, self)),

                    field(RDF.TYPE, SKOS.CONCEPT),
                    field(SKOS.TOP_CONCEPT_OF, Topics),
                    field(SKOS.PREF_LABEL, name)

            );

        });
    }

    private Optional<Frame> organizer(final JSONPath organizer) {
        return organizer.string("url").map(id -> frame(

                field(ID, item(Organizations.Context, id)),

                field(RDF.TYPE, Schema.Organization),

                field(Schema.url, organizer.string("website").flatMap(Parsers::url).map(Frame::iri)),
                field(Schema.name, organizer.string("organizer").map(XPath::decode).map(text -> literal(text, language))),
                field(Schema.email, organizer.string("email").map(Frame::literal)),
                field(Schema.telephone, organizer.string("phone").map(Frame::literal))

        ));
    }

    private Optional<Frame> location(final JSONPath location) {
        return location.string("url").map(id -> {

            // !!! lookup by name

            final Optional<Value> addressCountry=Optional.ofNullable(country);
            final Optional<Value> addressLocality=Optional.ofNullable(locality);
            final Optional<Value> streetAddress=location.string("address").map(Frame::literal);

            return frame(

                    field(ID, item(Locations.Context, id)),

                    field(RDF.TYPE, Schema.Place),

                    field(Schema.url, location.string("url").map(Frame::iri)),
                    field(Schema.name, (location.string("venue")).map(text -> literal(text, language))),

                    field(Schema.latitude, location.decimal("geo_lat").map(Frame::literal)),
                    field(Schema.longitude, location.decimal("geo_lng").map(Frame::literal)),

                    field(Schema.address, frame(

                            field(ID, item(Locations.Context, Xtream
                                    .of(addressCountry, addressLocality, streetAddress)
                                    .optMap(identity())
                                    .map(Value::stringValue)
                                    .collect(joining("\n")))
                            ),

                            field(RDF.TYPE, Schema.PostalAddress),

                            field(Schema.addressCountry, addressCountry),
                            field(Schema.addressLocality, addressLocality),
                            field(Schema.streetAddress, streetAddress),

                            field(Schema.url, location.string("website").flatMap(Parsers::url).map(Frame::iri)),
                            field(Schema.email, location.string("email").map(Frame::literal)),
                            field(Schema.telephone, location.string("phone").map(Frame::literal))

                    ))

            );

        });

    }

}
