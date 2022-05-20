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
import com.metreeca.rdf.actions.Localize;
import com.metreeca.rdf.actions.Normalize;
import com.metreeca.rdf.actions.Normalize.DateToDateTime;
import com.metreeca.rdf.actions.Normalize.StringToDate;
import com.metreeca.rdf4j.actions.Microdata;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.data.cities.Pavia;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.format.DateTimeFormatter;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.json.shifts.Seq.seq;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.Work.location;

import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

    private static final Frame Publisher=frame(iri("http://www.vivipavia.it/site/home/eventi.html"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("ViviPavia", "en"),
                    literal("ViviPavia", "it")
            );


    public static void main(final String... args) {
        exec(() -> new EventsPaviaCity().run());
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

                .optMap(new GET<>(html()))
                .flatMap(new Microdata())
                .batch(0)

                .flatMap(model -> frame(Schema.Event, model)
                        .strings(seq(inverse(RDF.TYPE), Schema.url))
                )

                .flatMap(url -> Xtream.of(url)

                        .optMap(new GET<>(html()))
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


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Frame event(final Frame frame) {

        return frame(iri(EC2U.events, frame.skolemize(seq(DCTERMS.SOURCE))))

                .values(RDF.TYPE, EC2U.Event, Schema.Event)
                .values(RDFS.LABEL, frame.values(Schema.name))

                .value(EC2U.university, Pavia.University)

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
                .value(Schema.typicalAgeRange, frame.value(Schema.typicalAgeRange))

                .frame(Schema.location, frame.frame(Schema.location).map(location ->
                        location(location, frame(bnode())
                                .value(Schema.addressCountry, Pavia.Country)
                                .value(Schema.addressLocality, Pavia.City))
                ));
    }

}
