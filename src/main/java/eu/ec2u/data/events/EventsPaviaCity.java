/*
 * Copyright © 2020-2025 EC2U Alliance
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
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.focus.Focus;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.*;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.focus.Focus.focus;
import static java.time.Instant.now;
import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/city");

    private static final Frame Publisher=frame(

            field(ID, iri("http://www.vivipavia.it/site/home/eventi.html")),
            field(TYPE, Organization),

            field(university, Pavia.id),

            field(name,
                    literal("City of Pavia / ViviPavia", "en"),
                    literal("Comune di Pavia / ViviPavia", Pavia.language)
            ),

            field(about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        Data.exec(() -> new EventsPaviaCity().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(now())

                .flatMap(this::crawl)
                .flatMap(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<IRI> crawl(final Instant now) {
        return Xtream.of(now)

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
                        .seq(reverse(RDF.TYPE), url)
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

                            .map(s -> literal(s, Pavia.language));


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
                                            field(TYPE, Event),

                                            field(university, Pavia.id),

                                            field(Schema.url, url),
                                            field(name, focus.seq(name).value()),
                                            field(Schema.description, focus.seq(Schema.description).value().or(() -> description)),
                                            field(disambiguatingDescription, focus.seq(disambiguatingDescription).value()),

                                            field(image, focus.seq(image)
                                                    .value()
                                                    .map(iri -> frame(
                                                            field(ID, iri),
                                                            field(TYPE, Schema.ImageObject),
                                                            field(Schema.url, iri)
                                                    ))
                                            ),

                                            field(startDate, focus.seq(startDate).value()),
                                            field(endDate, focus.seq(endDate).value()),

                                            field(eventStatus, focus.seq(eventStatus).value()),

                                            field(publisher, Publisher),
                                            field(location, location(focus.seq(location)))

                                    ))
                            );

                });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Frame location(final Focus location) {
        return frame(

                field(ID, iri()),

                field(Place, frame(

                        field(ID, iri()),
                        field(TYPE, Place),

                        field(name, location.seq(name).value()),
                        field(address, address(location.seq(address)))

                ))
        );
    }

    private Optional<Frame> address(final Focus address) {
        return address.seq(streetAddress).value(asString()).map(sa -> frame(

                field(ID, item(Locations.Context, Pavia, skolemize(address, streetAddress, postalCode, addressLocality))),
                field(TYPE, PostalAddress),

                field(streetAddress, address.seq(streetAddress).value()),
                field(postalCode, address.seq(postalCode).value()),
                field(addressLocality, address.seq(addressLocality).value())

        ));
    }

}
