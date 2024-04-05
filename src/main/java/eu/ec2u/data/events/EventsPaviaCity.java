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

import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;

import java.time.ZonedDateTime;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Pavia;
import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/city");

    private static final Frame Publisher=Frame.frame(

            field(ID, iri("http://www.vivipavia.it/site/home/eventi.html")),
            field(TYPE, Organization),

            field(owner, Pavia.Id),

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
        // update(connection -> Xtream.of(synced(Context, Publisher.id().orElseThrow()))
        //
        //         .flatMap(this::crawl)
        //         .map(this::event)
        //
        //         .flatMap(Frame::stream)
        //         .batch(0)
        //
        //         .forEach(new Events_.Loader(Context))
        //
        // );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // private Xtream<Frame> crawl(final Instant synced) {
    //     return Xtream.of(synced)
    //
    //             .flatMap(new Fill<Instant>()
    //                     .model("http://www.vivipavia.it/site/cdq/listSearchArticle.jsp"
    //                             +"?new=yes"
    //                             +"&instance=10"
    //                             +"&channel=34"
    //                             +"&size=9999"
    //                             +"&node=4613"
    //                             +"&fromDate=%{date}"
    //                     )
    //                     .value("date", date -> LocalDate.ofInstant(date, UTC)
    //                             .atStartOfDay(UTC)
    //                             .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    //                     )
    //             )
    //
    //             .optMap(new GET<>(new HTML()))
    //             .flatMap(new Microdata())
    //             .batch(0)
    //
    //             .flatMap(model -> focus(Set.of(Event), model)
    //                     .seq(reverse(RDF.TYPE), Schema.url)
    //                     .values(asString())
    //             )
    //
    //             .flatMap(url -> Xtream.of(url)
    //
    //                     .optMap(new GET<>(new HTML()))
    //                     .flatMap(new Microdata())
    //
    //                     .map(new Normalize(
    //                             new StringToDate(),
    //                             new DateToDateTime()
    //                     ))
    //
    //                     .map(new Localize("it"))
    //
    //                     .batch(0)
    //
    //                     .flatMap(model -> focus(Set.of(Event), model)
    //                             .seq(reverse(RDF.TYPE))
    //                             .map(event -> frame(event, model)
    //                                     .value(DCTERMS.SOURCE, iri(url))
    //                             )
    //                     )
    //
    //             );
    // }
    //
    // private Frame event(final Frame frame) {
    //     return frame(iri(Events.Context, frame.skolemize(DCTERMS.SOURCE)))
    //
    //             .values(RDF.TYPE, Event)
    //
    //             .value(owner, Pavia.Id)
    //
    //             .frame(publisher, Publisher)
    //             .value(DCTERMS.SOURCE, frame.value(DCTERMS.SOURCE))
    //
    //             .values(Schema.name, frame.values(Schema.name))
    //             .values(Schema.description, frame.values(Schema.description))
    //             .values(Schema.disambiguatingDescription, frame.values(Schema.disambiguatingDescription))
    //             .values(Schema.image, frame.values(Schema.image))
    //             .values(Schema.url, frame.values(DCTERMS.SOURCE))
    //
    //             .value(startDate, frame.value(startDate))
    //             .value(endDate, frame.value(endDate))
    //
    //             .value(eventStatus, frame.value(eventStatus))
    //
    //             .frame(location, frame.frame(location).map(this::location));
    // }
    //
    //
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
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
