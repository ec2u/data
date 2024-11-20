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

import com.metreeca.http.FormatException;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.jsonld.formats.JSONLD;
import com.metreeca.http.services.Logger;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.focus.Focus;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.StringReader;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf.schemas.Schema.normalize;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.xml.XPath.decode;
import static com.metreeca.http.xml.formats.HTML.html;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.*;
import static eu.ec2u.data.universities.University.Jena;
import static eu.ec2u.data.universities.University.Linz;
import static eu.ec2u.work.focus.Focus.focus;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.joining;

public final class EventsLinzCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/linz/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.linztourismus.at/en/leisure/discover-linz/events/event-calendar/")),
            field(TYPE, Organization),

            field(university, Linz.id),

            field(name,
                    literal("Linz Tourism Information", "en"),
                    literal("Tourist Information Linz", Jena.language)
            ),

            field(about, OrganizationTypes.City)

    );


    private static final String Root="https://www.linztourismus.at";

    private static final DateTimeFormatter DateTimeFormat=DateTimeFormatter.ofPattern(Stream

            .of(
                    "yyyy-MM-dd'T'HH:mmXXX",
                    "yyyy-MM-dd"
            )

            .map(pattern -> format("[%s]", pattern))
            .collect(joining())

    );


    public static void main(final String... args) {
        exec(() -> new EventsLinzCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();

    private final Logger logger=service(logger());


    @Override public void run() {
        update(connection -> Xtream.of(now)

                .flatMap(this::crawl)
                .flatMap(this::fetch)
                .map(this::convert)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<String> crawl(final Instant updated) {
        return Xtream.of(updated)

                .map(instant -> instant.atZone(Linz.zone).toLocalDate())

                .flatMap(new Fill<LocalDate>()

                        .model(Root
                                +"/en/leisure/discover-linz/events/event-calendar/load"
                                +"?Category2[HN]=HN" // only "highlight" events
                                +"&FromDate={lower}"
                                +"&ToDate={upper}"
                        )

                        .value("lower", date -> date)
                        .value("upper", date -> date.plusMonths(3))

                )

                .crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new JSON()))

                        .map(JSONPath::new).map(json -> entry(
                                json.strings("SearchResultsMoreLink").map(path -> Root+path),
                                json.strings("SearchResults")
                        ))
                )

                .map(items -> html(format("<html>%s</html>", items), Root))

                .map(XPath::new).flatMap(html -> html
                        .links("/html/body/li/a[@class='event-search-result-inner']/@href")
                        .map(url -> url.substring(0, url.indexOf('?'))) // ;( remove malformed query string
                );
    }

    private Xtream<Entry<IRI, Focus>> fetch(final String url) {
        return Xtream.of(url)

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(html -> html
                        .string("//script[@type='application/ld+json']")
                )

                .map(json -> {

                    try ( final StringReader reader=new StringReader(json) ) {

                        final RDFParser parser=new JSONLDParser();

                        parser.set(JSONLDSettings.SECURE_MODE, false); // ;( retrieve http://schema.org/ links

                        return rdf(reader, "", parser);

                    } catch ( final FormatException e ) {

                        logger.warning(JSONLD.class, e.getMessage());

                        return Set.<Statement>of();

                    }

                })

                .flatMap(model -> focus(Set.of(Event), normalize(model))
                        .seq(reverse(RDF.TYPE))
                        .split()
                )

                .map(focus -> entry(iri(url), focus));
    }

    private Frame convert(final Entry<? extends IRI, Focus> entry) {

        final IRI id=entry.getKey();
        final Focus focus=entry.getValue();

        return frame(

                field(ID, item(Events.Context, Linz, id.stringValue())),
                field(TYPE, Event),

                field(university, Linz.id),

                field(url, id),
                field(name, focus.seq(name).value(asString()).map(s -> literal(decode(s), "en"))),
                field(description, focus.seq(description).value(asString()).map(s -> literal(decode(s), "en"))),

                field(image, focus.seq(image)
                        .value(asIRI())
                        .map(iri -> frame(
                                field(ID, iri),
                                field(TYPE, Schema.ImageObject),
                                field(Schema.url, iri)
                        ))
                ),

                field(startDate, focus.seq(startDate).value(asString()).flatMap(this::datetime)),
                field(endDate, focus.seq(endDate).value(asString()).flatMap(this::datetime)),
                field(isAccessibleForFree, focus.seq(isAccessibleForFree).value(asBoolean()).map(Frame::literal)),

                field(publisher, Publisher),

                field(location, location(focus))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final String date) {
        try {

            return Optional.of(literal(DateTimeFormat.parseBest(date,
                    OffsetDateTime::from,
                    temporal -> LocalDate.from(temporal).atStartOfDay().atZone(Linz.zone)
            )));

        } catch ( final DateTimeException e ) {

            logger.warning(this, format("malformed date <%s>", date));

            return Optional.empty();
        }
    }

    private Stream<Frame> location(final Focus focus) {
        return focus.seq(location).split().flatMap(location -> location

                .seq(RDF.TYPE).value(asIRI())

                .map(type -> {

                    if ( type.equals(Place) ) {

                        final String name=location.seq(Schema.name).value(asString()).orElseThrow();

                        return frame(

                                field(ID, iri()),

                                field(Place, frame(

                                        field(ID, item(Locations.Context, Linz, name)),
                                        field(TYPE, Place),

                                        field(Schema.name, literal(decode(name), Linz.language)),

                                        field(address, address(location.seq(address)))

                                ))

                        );

                    } else {

                        logger.warning(this, format("unsupported location type <%s>", type));

                        return null;
                    }

                })

                .stream());
    }

    private Optional<Frame> address(final Focus address) {

        return address.seq(streetAddress).value(asString()).map(street -> frame(

                field(ID, item(Locations.Context, Linz, street)),
                field(TYPE, PostalAddress),

                field(streetAddress, literal(decode(street))),

                field(addressLocality, address.seq(addressLocality)
                        .value(asString())
                        .map(XPath::decode)
                        .map(Frame::literal)
                ),

                field(postalCode, address.seq(postalCode)
                        .value(asString())
                        .map(XPath::decode)
                        .map(Frame::literal)
                )

        ));

    }

}