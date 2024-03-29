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
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.rdf.actions.*;
import com.metreeca.rdf.actions.Normalize.DateToDateTime;
import com.metreeca.rdf.actions.Normalize.StringToDate;
import com.metreeca.xml.codecs.HTML;

import eu.ec2u.data.Data;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Set;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.link.shifts.Alt.alt;
import static com.metreeca.link.shifts.Seq.seq;
import static com.metreeca.link.shifts.Step.step;

import static eu.ec2u.data.EC2U.University.Pavia;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events.synced;
import static eu.ec2u.work.validation.Validators.validate;

import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/city");

    private static final Frame Publisher=frame(iri("http://www.vivipavia.it/site/home/eventi.html"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Events.City)
            .values(RDFS.LABEL,
                    literal("Comune di Pavia / ViviPavia", "it"),
                    literal("City of Pavia / ViviPavia", "en")
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsPaviaCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Context, Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .pipe(events -> validate(Event(), Set.of(Event), events))

                .forEach(new Events.Updater(Context));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

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

                .flatMap(model -> frame(Schema.Event, model)
                        .strings(seq(inverse(RDF.TYPE), Schema.url))
                )

                .flatMap(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))
                        .flatMap(new Microdata())

                        .map(new Normalize(
                                new StringToDate(),
                                new DateToDateTime()
                        ))

                        .map(new Localize("it"))

                        .batch(0)

                        .flatMap(model -> frame(Schema.Event, model)
                                .values(inverse(RDF.TYPE))
                                .map(event -> frame(event, model)
                                        .value(DCTERMS.SOURCE, iri(url))
                                )
                        )

                );
    }

    private Frame event(final Frame frame) {
        return frame(iri(Events.Context, frame.skolemize(DCTERMS.SOURCE)))

                .values(RDF.TYPE, Events.Event)

                .value(Resources.university, Pavia.Id)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.SOURCE, frame.value(DCTERMS.SOURCE))
                .value(DCTERMS.MODIFIED, frame.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                .values(Schema.name, frame.values(Schema.name))
                .values(Schema.description, frame.values(Schema.description))
                .values(Schema.disambiguatingDescription, frame.values(Schema.disambiguatingDescription))
                .values(Schema.image, frame.values(Schema.image))
                .values(Schema.url, frame.values(DCTERMS.SOURCE))

                .value(Schema.startDate, frame.value(Schema.startDate))
                .value(Schema.endDate, frame.value(Schema.endDate))

                .value(Schema.eventStatus, frame.value(Schema.eventStatus))

                .frame(Schema.location, frame.frame(Schema.location).map(this::location));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Frame location(final Frame location) {
        return frame(item(Locations.Context, location.skolemize(
                seq(Schema.name), seq(step(Schema.address), alt(Schema.name, Schema.streetAddress,
                        Schema.addressLocality)))))

                .value(RDF.TYPE, Schema.Place)

                .value(Schema.name, location.value(alt(seq(Schema.name), seq(Schema.address, Schema.name))))
                .frame(Schema.address, location.frame(Schema.address).map(this::address));
    }

    private Frame address(final Frame address) {
        return frame(iri(Locations.Context, address.skolemize(Schema.streetAddress, Schema.addressLocality)))

                .value(RDF.TYPE, Schema.PostalAddress)

                .value(Schema.streetAddress, address.value(Schema.streetAddress))
                .value(Schema.addressLocality, address.value(Schema.addressLocality));
    }

}
