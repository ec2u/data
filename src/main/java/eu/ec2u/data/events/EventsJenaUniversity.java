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
import com.metreeca.http.actions.GET;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.organizations.Organizations_;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.focus.Focus;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.StringReader;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf.schemas.Schema.normalize;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.skolemize;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.partner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.things.Schema.schema;
import static eu.ec2u.data.universities.Universities.University;
import static eu.ec2u.data.universities._Universities.Jena;
import static eu.ec2u.work.focus.Focus.focus;
import static java.util.stream.Collectors.toList;

public final class EventsJenaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/jena/university");

    private static final List<Frame> Publishers=Xtream

            .of(

                    frame(
                            field(ID, iri("https://www.uni-jena.de/veranstaltungskalender")),
                            field(Schema.name,
                                    literal("Jena University / Events", "en"),
                                    literal("Universität Jena / Veranstaltungen", Jena.Language)
                            )
                    ),

                    frame(
                            field(ID, iri("https://www.uni-jena.de/international/veranstaltungskalender")),
                            field(Schema.name,
                                    literal("Jena University / International / Events", "en"),
                                    literal("Universität Jena / International / Veranstaltungen", Jena.Language)
                            )
                    ),

                    frame(
                            field(ID, iri("https://www.uni-jena.de/kalenderstudiuminternational")),
                            field(Schema.name,
                                    literal("Jena University / Calendar Studies international / Events", "en"),
                                    literal("Universität Jena / Kalender Studium international / Veranstaltungen", Jena.Language)
                            )
                    ),

                    frame(
                            field(ID, iri("https://www.uni-jena.de/ec2u-veranstaltungen")),
                            field(Schema.name,
                                    literal("Jena University / EC2U / Events", "en"),
                                    literal("Universität Jena / EC2U / Veranstaltungen", Jena.Language)
                            )
                    ),

                    frame(
                            field(ID, iri("https://www.uni-jena.de/promotion-events")),
                            field(Schema.name,
                                    literal("Jena University / Academic Career / Events", "en"),
                                    literal("Universität Jena / Wissenschaftliche Karriere/ Veranstaltungen", Jena.Language)
                            )
                    )

            )

            .map(frame -> frame(frame,

                    field(RDF.TYPE, Organization),
                    field(partner, Jena.Id),
                    field(Schema.about, University)

            ))

            .collect(toList());


    public static void main(final String... args) {
        Data.exec(() -> new EventsJenaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.from(Publishers)

                .flatMap(publisher -> Xtream.of(updated(Context, publisher.id().orElseThrow()))

                        .flatMap(updated -> crawl(publisher, updated))
                        .map(frame -> event(publisher, frame))

                )

                .distinct(frame -> frame.id().orElse(RDF.NIL)) // events may be published multiple times by different publishers

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Focus> crawl(final Frame publisher, final Instant updated) {
        return Xtream

                .of(publisher.id().orElseThrow().stringValue())

                // paginate through catalog

                .loop(batch -> Xtream.of(batch)

                        .optMap(new GET<>(new HTML()))

                        .filter(document -> new XPath(document)

                                // ;( pagination links are disabled under javascript control: test for page links

                                .link("//ul[contains(@class, 'entries')]//a[contains(@class, 'entry')]")
                                .isPresent()

                        )

                        .map(XPath::new)
                        .flatMap(xpath -> xpath
                                .links("//nav[@class='pagination']//a[@data-direction='next']/@href")
                        )
                )

                // extract detail links

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).flatMap(xpath -> xpath
                        .links("//ul[contains(@class, 'entries')]//a[contains(@class, 'entry')]/@href")
                )


                // extract JSON-LD

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> {

                    try ( final StringReader reader=new StringReader(json) ) {

                        final Collection<Statement> model=normalize(rdf(reader, "", new JSONLDParser()));

                        return focus(Set.of(Event), model)
                                .seq(reverse(RDF.TYPE))
                                .split()
                                .filter(focus -> focus.seq(reverse(schema("subEvent"))).isEmpty());

                        // !!! handle subevents using parent as default

                    } catch ( final FormatException e ) {

                        service(logger()).warning(this, e.getMessage());

                        return Stream.empty();

                    }

                });

    }

    private Frame event(final Frame publisher, final Focus focus) {

        final Optional<Literal> label=focus.seq(Schema.name).value(asString())
                .map(text -> literal(text, "de"));

        final Optional<Literal> brief=focus.seq(Schema.disambiguatingDescription).value(asString())
                .or(() -> focus.seq(Schema.description).value(asString()))
                .map(text -> literal(text, Jena.Language));

        return frame(

                field(ID, iri(Events.Context, skolemize(focus, Schema.url))),

                field(RDF.TYPE, Event),

                field(partner, Jena.Id),

                field(Schema.url, focus.seq(Schema.url).value()),
                field(Schema.name, label),
                field(Schema.image, focus.seq(Schema.image).value()),

                field(Schema.disambiguatingDescription, brief),
                field(Schema.description, focus.seq(Schema.description).value(asString())
                        .or(() -> focus.seq(Schema.disambiguatingDescription).value(asString()))
                        .map(text -> literal(text, Jena.Language))
                ),

                // .value(DCTERMS.CREATED, focus.value(dateCreated)
                //         .flatMap(Values::literal)
                //         .map(Literal::temporalAccessorValue)
                //         .map(OffsetDateTime::from)
                //         .map(v -> v.withOffsetSameInstant(UTC))
                //         .map(Values::literal)
                // )
                //
                // .value(DCTERMS.MODIFIED, focus.value(dateModified)
                //         .flatMap(Values::literal)
                //         .map(Literal::temporalAccessorValue)
                //         .map(OffsetDateTime::from)
                //         .map(v -> v.withOffsetSameInstant(UTC))
                //         .map(Values::literal)
                //         .orElseGet(() -> literal(now))
                // )

                field(startDate, datetime(focus.seq(startDate).value(asString()))),
                field(endDate, datetime(focus.seq(endDate).value(asString()))),

                field(isAccessibleForFree, focus.seq(isAccessibleForFree).value(asBoolean()).map(Frame::literal)),

                field(Schema.inLanguage, focus.seq(Schema.inLanguage).value(asString()) // retain only language
                        .map(tag -> tag.toLowerCase(Locale.ROOT).replaceAll("^([a-z]+).*$", "$1"))
                        .map(Frame::literal)
                ),

                field(eventAttendanceMode, focus.seq(eventAttendanceMode).value(asString()) // ;( included as strings
                        .map(Frame::iri)
                ),

                field(Events.publisher, publisher),

                field(organizer, Organizations_.organization(focus.seq(organizer), Jena.Language))

                // !!! restore after https://github.com/ec2u/data/issues/41 is resolved
                //
                // field(Schema.location, focus.seq(Schema.location).split()
                //        .map(location -> location(location, frame(
                //                field(Schema.addressCountry, Jena.Country),
                //                field(Schema.addressLocality, Jena.City)
                //        ))
                // ))

        );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final Optional<String> datetime) {
        return datetime
                .map(OffsetDateTime::parse)
                .map(Frame::literal);
    }

}