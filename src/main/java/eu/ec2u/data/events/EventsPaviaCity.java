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
import com.metreeca.http.rdf.actions.Localize;
import com.metreeca.http.rdf.actions.Microdata;
import com.metreeca.http.rdf.actions.Normalize;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Extract;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.partner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Pavia;
import static eu.ec2u.work.focus.Focus.focus;
import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/city");

    private static final Frame Publisher=Frame.frame(

            field(ID, iri("http://www.vivipavia.it/site/home/eventi.html")),
            field(TYPE, Organization),

            field(partner, Pavia.Id),

            field(Schema.name,
                    literal("City of Pavia / ViviPavia", "en"),
                    literal("Comune di Pavia / ViviPavia", Pavia.Language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        Data.exec(() -> new EventsPaviaCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        update(connection -> Xtream.of(updated(Context, Publisher.id().orElseThrow()))

                .flatMap(this::crawl)
                .flatMap(this::event)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<IRI> crawl(final Instant updated) {
        return Xtream.of(updated)

                .flatMap(new Fill<Instant>()
                        .model("http://www.vivipavia.it/site/cdq/listSearchArticle.jsp"
                                +"?new=yes"
                                +"&instance=10"
                                +"&channel=34"
                                +"&size=9999"
                                +"&node=4613"
                                +"&fromDate=%{date}"
                        )
                        .value("date", date -> LocalDate.ofInstant(date, UTC)
                                .atStartOfDay(UTC)
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        )
                )

                .optMap(new GET<>(new HTML()))


                .flatMap(new Microdata())
                .batch(0)

                .flatMap(model -> focus(Set.of(Event), model)
                        .seq(reverse(RDF.TYPE), Schema.url)
                        .values(asIRI())
                );
    }

    private Xtream<Frame> event(final IRI url) {
        return Xtream.of(url.stringValue())

                .optMap(new GET<>(new HTML()))

                .flatMap(document -> {

                    final Optional<Value> description=Optional.of(document)

                            .map(d -> document.getElementsByTagName("body").item(0))

                            .flatMap(new Extract())
                            .map(new Untag())

                            .map(s -> literal(s, Pavia.Language));


                    return Xtream.of(document)

                            .flatMap(new Microdata())

                            .map(new Normalize(
                                    new Normalize.StringToDate(),
                                    new Normalize.DateToDateTime()
                            ))

                            .map(new Localize("it"))

                            .batch(0)

                            .flatMap(model -> focus(Set.of(Event), model)

                                    .seq(reverse(RDF.TYPE))
                                    .split()

                                    .map(focus -> frame(

                                            field(ID, item(Events.Context, url.stringValue())),

                                            field(RDF.TYPE, Event),

                                            field(partner, Pavia.Id),

                                            field(Schema.url, url),
                                            field(Schema.name, focus.seq(Schema.name).value()),
                                            field(Schema.description, focus.seq(Schema.description).value().or(() -> description)),
                                            field(Schema.disambiguatingDescription, focus.seq(Schema.disambiguatingDescription).value()),
                                            field(Schema.image, focus.seq(Schema.image).values()),

                                            field(startDate, focus.seq(startDate).value()),
                                            field(endDate, focus.seq(endDate).value()),

                                            field(eventStatus, focus.seq(eventStatus).value()),

                                            field(publisher, Publisher)
                                            // field(location, focus.frame(location).map(this::location))

                                    ))
                            );

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // private Frame location(final Frame location) {
    //     return frame(item(Locations.Context, location.skolemize(
    //             seq(Schema.name),
    //             seq(step(Schema.address), alt(Schema.name, Schema.streetAddress, Schema.addressLocality))
    //     )))
    //
    //             .value(RDF.TYPE, Schema.Place)
    //
    //             .value(Schema.name, location.value(alt(seq(Schema.name), seq(Schema.address, Schema.name))))
    //             .frame(Schema.address, location.frame(Schema.address).map(this::address));
    // }
    //
    // private Frame address(final Frame address) {
    //     return frame(iri(Locations.Context, address.skolemize(Schema.streetAddress, Schema.addressLocality)))
    //
    //             .value(RDF.TYPE, Schema.PostalAddress)
    //
    //             .value(Schema.streetAddress, address.value(Schema.streetAddress))
    //             .value(Schema.addressLocality, address.value(Schema.addressLocality));
    // }

}
