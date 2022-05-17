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

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.GET;
import com.metreeca.rest.actions.Validate;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.cities.Jena;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.Work;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.time.*;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rdf.formats.RDFFormat.rdf;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.Work.location;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;
import static java.util.stream.Collectors.toList;

public final class EventsJenaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.uni-jena.de/veranstaltungskalender"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("Upcoming Events", "en"),
                    localize("Kommende Veranstaltungen", "de")
            );


    public static void main(final String... args) {
        exec(() -> new EventsJenaUniversity().run());
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

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream

                .of(
                        "https://www.uni-jena.de/veranstaltungskalender",
                        "https://www.uni-jena.de/international/veranstaltungskalender",
                        "https://www.uni-jena.de/kalenderstudiuminternational",
                        "https://www.uni-jena.de/ec2u-veranstaltungen",
                        "https://www.uni-jena.de/promotion-events"
                )

                // paginate through catalog

                .loop(batch -> Xtream.of(batch)
                        .optMap(new GET<>(html()))
                        .filter(new XPath<>(xpath -> xpath

                                // ;( pagination links are disabled under javascript control: test for page links

                                .link("//div[contains(@class, 'entry_wrapper')]//a[@class='link']/@href")
                                .isPresent()

                        )::apply)
                        .flatMap(new XPath<>(xpath -> xpath
                                .links("//div[@class='pagination']//li[last()]/a/@href")
                        ))
                )

                // extract detail links

                .optMap(new GET<>(html()))

                .flatMap(new XPath<>(xpath -> xpath
                        .links("//div[contains(@class, 'entry_wrapper')]//a[@class='link']/@href")
                ))

                // extract JSON-LD

                .optMap(new GET<>(html()))

                .optMap(new XPath<>(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                ))

                .flatMap(json -> rdf(new ByteArrayInputStream(json.getBytes(UTF_8)), null, new JSONLDParser())

                        .map(model -> model.stream()
                                .map(com.metreeca.rdf.schemas.Schema::normalize)
                                .collect(toList())
                        )

                        .fold(

                                error -> {

                                    service(logger()).warning(this, error.toString());

                                    return Stream.empty();

                                },

                                model -> frame(Schema.Event, model)
                                        .frames(inverse(RDF.TYPE))

                        )

                );

    }

    private Frame event(final Frame frame) {

        final Optional<Literal> label=frame.string(Schema.name)
                .map(text -> localize(text, "de"));

        final Optional<Literal> brief=frame.string(Schema.disambiguatingDescription)
                .or(() -> frame.string(Schema.description))
                .map(text -> localize(text, "de"));

        // don't skolemize on schema:url: events are published multiple times at different locations

        return frame(iri(EC2U.events, frame.skolemize(Schema.name, Schema.startDate, Schema.endDate)))

                .value(RDF.TYPE, EC2U.Event)
                .value(RDFS.LABEL, label)
                .value(RDFS.COMMENT, label)

                .value(EC2U.university, Jena.University)
                .value(EC2U.updated, literal(now))

                .value(DCTERMS.SOURCE, frame.value(Schema.url))
                // !!! dct:issued/created/modified

                .frame(DCTERMS.PUBLISHER, Publisher)
                // !!! dct:subject

                .value(RDF.TYPE, Schema.Event)

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)

                .value(Schema.description, frame.string(Schema.description)
                        .or(() -> frame.string(Schema.disambiguatingDescription))
                        .map(text -> localize(text, "de"))
                )

                .value(Schema.image, frame.value(Schema.image))
                .value(Schema.url, frame.value(Schema.url))

                .bool(Schema.isAccessibleForFree, frame.bool(Schema.isAccessibleForFree))

                .string(Schema.inLanguage, frame.string(Schema.inLanguage) // retain only language
                        .map(tag -> tag.toLowerCase(Locale.ROOT).replaceAll("^([a-z]+).*$", "$1"))
                )

                .value(Schema.startDate, datetime(frame.string(Schema.startDate)))
                .value(Schema.endDate, datetime(frame.string(Schema.endDate)))

                .frame(Schema.organizer, frame.frame(Schema.organizer)
                        .map(organizer -> Work.organizer(organizer, "de"))
                )

                .frame(Schema.location, frame.frame(Schema.location)
                        .map(location -> location(location, frame(bnode())
                                .value(Schema.addressCountry, Jena.Country)
                                .value(Schema.addressLocality, Jena.City)))

                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Literal localize(final String text, final String lang) {
        return literal(text, lang);
    }

    private Optional<Literal> datetime(final Optional<String> datetime) {
        return datetime
                .map(date -> date.replaceFirst("\\+\\d{2}", "$0:")) // fix broken zone
                .map(OffsetDateTime::parse)
                .map(Values::literal);
    }

}