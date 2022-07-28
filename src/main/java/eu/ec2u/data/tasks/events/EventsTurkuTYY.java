/*
 * Copyright © 2020-2022 EC2U Alliance
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

import com.metreeca.core.Strings;
import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.cities.Turku;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.*;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;

public final class EventsTurkuTYY implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.tyy.fi/en/activities/calendar-events"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.Association)
            .values(RDFS.LABEL,
                    literal("The Student Union of the University of Turku (TYY) / Calendar of Events", "en"),
                    literal("Turun yliopiston ylioppilaskunta (TYY) / Tapahtumakalenteri", Turku.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsTurkuTYY().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::events)
                .optMap(this::event)

                .map(event -> event

                        .value(EC2U.university, Turku.University)

                        .frame(DCTERMS.PUBLISHER, Publisher)
                        .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                )

                .sink(events -> upload(EC2U.events,
                        validate(Event(), Set.of(EC2U.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> events(final Instant synced) {

        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.tyy.fi/events.json/en")
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Accept", JSON.MIME)
                ))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("events.*.event"));
    }

    private Optional<Frame> event(final JSONPath json) {

        final Optional<String> title=json.string("title");
        final Optional<String> description=json.string("content").map(Untag::untag);
        final Optional<String> disambiguatingDescription=description.map(Strings::normalize).map(Strings::clip);

        return json.string("nid")

                .map(nid -> md5(format("%s/%s", Publisher.focus().stringValue(), nid)))

                .map(id -> frame(iri(EC2U.events, id))

                        .value(RDF.TYPE, EC2U.Event)

                        .value(DCTERMS.SOURCE, json.string("url").map(Values::iri))

                        .value(Schema.url, json.string("url").map(Values::iri))
                        .value(Schema.name, title.map(s -> literal(s, "en")))
                        .value(Schema.image, json.string("image").map(Values::iri))
                        .value(Schema.description, description.map(s -> literal(s, "en")))
                        .value(Schema.disambiguatingDescription, disambiguatingDescription.map(s -> literal(s, "en")))

                        .value(Schema.startDate, json.string("start_date").map(this::datetime))
                        .value(Schema.endDate, json.string("end_date").map(this::datetime))

                        .frame(Schema.organizer, organizer(json))
                        .frame(Schema.location, location(json))

                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> organizer(final JSONPath json) {
        return json.string("organiser").map(organizer -> frame(iri(EC2U.organizations, md5(organizer)))

                .value(RDF.TYPE, Schema.Organization)

                .value(Schema.name, literal(organizer, Turku.Language))

        );
    }

    private Optional<Frame> location(final JSONPath json) {
        return json.string("location")

                .map(location -> frame(iri(EC2U.locations, md5(md5(format("%s{%s}", Publisher.focus(), location)))))

                        .value(RDF.TYPE, Schema.Place)

                        .value(Schema.name, literal(location, Turku.Language))
                        .frame(Schema.address, address(json))

                )

                .or(() -> address(json));
    }

    private Optional<Frame> address(final JSONPath json) {
        return json.string("address")

                .map(address -> frame(iri(EC2U.locations, md5(format("%s{%s}", Publisher.focus(), address))))

                        .value(RDF.TYPE, Schema.PostalAddress)

                        .value(Schema.name, literal(address, Turku.Language))

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal datetime(final String datetime) {
        return literal(OffsetDateTime
                .parse(datetime)
                .truncatedTo(ChronoUnit.SECONDS)
        );
    }

}
