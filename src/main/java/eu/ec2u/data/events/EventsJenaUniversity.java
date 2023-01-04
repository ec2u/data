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
import com.metreeca.http.CodecException;
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.codecs.HTML;

import eu.ec2u.data.Data;
import eu.ec2u.data._cities.Jena;
import eu.ec2u.data._work.Work;
import eu.ec2u.data.ontologies.EC2U;
import eu.ec2u.data.ontologies.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.*;
import java.time.*;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.rdf.codecs.RDF.rdf;
import static com.metreeca.rdf.schemas.Schema.normalize;

import static eu.ec2u.data._tasks.Tasks.upload;
import static eu.ec2u.data._tasks.Tasks.validate;
import static eu.ec2u.data._work.Work.location;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events_.synced;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;
import static java.util.stream.Collectors.toList;

public final class EventsJenaUniversity implements Runnable {

    private static final List<Frame> Publishers=Xtream

            .of(

                    frame(iri("https://www.uni-jena.de/veranstaltungskalender")).values(RDFS.LABEL,
                            literal("Jena University / Events", "en"),
                            literal("Universität Jena / Veranstaltungen", "de")
                    ),

                    frame(iri("https://www.uni-jena.de/international/veranstaltungskalender")).values(RDFS.LABEL,
                            literal("Jena University / International / Events", "en"),
                            literal("Universität Jena / International / Veranstaltungen", "de")
                    ),

                    frame(iri("https://www.uni-jena.de/kalenderstudiuminternational")).values(RDFS.LABEL,
                            literal("Jena University / Calendar Studies international / Events", "en"),
                            literal("Universität Jena / Kalender Studium international / Veranstaltungen", "de")
                    ),

                    frame(iri("https://www.uni-jena.de/ec2u-veranstaltungen")).values(RDFS.LABEL,
                            literal("Jena University / EC2U / Events", "en"),
                            literal("Universität Jena / EC2U / Veranstaltungen", "de")
                    ),

                    frame(iri("https://www.uni-jena.de/promotion-events")).values(RDFS.LABEL,
                            literal("Jena University / Academic Career / Events", "en"),
                            literal("Universität Jena / Wissenschaftliche Karriere/ Veranstaltungen", "de")
                    )

            )

            .map(frame -> frame
                    .value(RDF.TYPE, EC2U.Publisher)
                    .value(DCTERMS.COVERAGE, EC2U.University)
                    .value(EC2U.university, Jena.University)
            )

            .collect(toList());


    public static void main(final String... args) {
        Data.exec(() -> new EventsJenaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.from(Publishers)

                .flatMap(publisher -> Xtream.of(synced(publisher.focus()))

                        .flatMap(synced -> crawl(publisher, synced))
                        .map(frame -> event(publisher, frame))

                )

                .distinct(Frame::focus) // events may be published multiple times by different publishers

                .sink(events -> upload(Events.Context,
                        validate(Event(), Set.of(EC2U.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Frame publisher, final Instant synced) {
        return Xtream

                .of(publisher.focus().stringValue())

                // paginate through catalog

                .loop(batch -> Xtream.of(batch)
                        .optMap(new GET<>(new HTML()))

                        .filter(document -> new XPath(document)

                                // ;( pagination links are disabled under javascript control: test for page links

                                .link("//div[contains(@class, 'entry_wrapper')]/div[@class='title']/a/@href")
                                .isPresent()

                        )

                        .map(XPath::new)
                        .flatMap(xpath -> xpath
                                .links("//div[@class='pagination']//li[last()]/a/@href")
                        )
                )

                // extract detail links

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).flatMap(xpath -> xpath
                        .links("//div[contains(@class, 'entry_wrapper')]/div[@class='title']/a/@href")
                )


                // extract JSON-LD

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> {

                            try ( final InputStream input=new ByteArrayInputStream(json.getBytes(UTF_8)) ) {

                                final Collection<Statement> model=normalize(rdf(input, null, new JSONLDParser()));

                                return frame(Schema.Event, model)
                                        .frames(inverse(RDF.TYPE));

                            } catch ( final CodecException e ) {

                                service(logger()).warning(this, e.getMessage());

                                return Stream.empty();

                            } catch ( final IOException unexpected ) {

                                throw new UncheckedIOException(unexpected);

                            }

                        }

                );

    }

    private Frame event(final Frame publisher, final Frame frame) {

        final Optional<Literal> label=frame.string(Schema.name)
                .map(text -> literal(text, "de"));

        final Optional<Literal> brief=frame.string(Schema.disambiguatingDescription)
                .or(() -> frame.string(Schema.description))
                .map(text -> literal(text, "de"));

        return frame(iri(Events.Context, frame.skolemize(Schema.url)))

                .value(RDF.TYPE, EC2U.Event)

                .value(EC2U.university, Jena.University)

                .value(DCTERMS.SOURCE, frame.value(Schema.url))

                .value(DCTERMS.CREATED, frame.value(Schema.dateCreated)
                        .flatMap(Values::literal)
                        .map(Literal::temporalAccessorValue)
                        .map(OffsetDateTime::from)
                        .map(v -> v.withOffsetSameInstant(UTC))
                        .map(Values::literal)
                )

                .value(DCTERMS.MODIFIED, frame.value(Schema.dateModified)
                        .flatMap(Values::literal)
                        .map(Literal::temporalAccessorValue)
                        .map(OffsetDateTime::from)
                        .map(v -> v.withOffsetSameInstant(UTC))
                        .map(Values::literal)
                        .orElseGet(() -> literal(now))
                )

                .frame(DCTERMS.PUBLISHER, publisher)

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)
                .value(Schema.description, frame.string(Schema.description)
                        .or(() -> frame.string(Schema.disambiguatingDescription))
                        .map(text -> literal(text, "de"))
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
                                .value(Schema.addressLocality, Jena.City)
                        ))
                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final Optional<String> datetime) {
        return datetime
                .map(date -> date.replaceFirst("\\+\\d{2}", "$0:")) // fix broken zone
                .map(OffsetDateTime::parse)
                .map(Values::literal);
    }

}