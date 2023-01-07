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

package eu.ec2u.data.resources.events;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.resources.locations.Locations;
import eu.ec2u.data.resources.organizations.Organizations;
import eu.ec2u.data.resources.things.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data._delta.Uploads.upload;
import static eu.ec2u.data._ontologies.EC2U.Universities.Turku;
import static eu.ec2u.data.resources.events.Events.Event;
import static eu.ec2u.data.resources.events.Events_.synced;
import static eu.ec2u.data.utilities.validation.Validators.validate;

import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;

public final class EventsTurkuTYY implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.tyy.fi/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Events.Association)
            .values(RDFS.LABEL,
                    literal("The Student Union of the University of Turku (TYY) / Calendar of Events", "en"),
                    literal("Turun yliopiston ylioppilaskunta (TYY) / Tapahtumakalenteri", Turku.Language)
            );

    private static final Pattern LangPattern=Pattern.compile("/([a-z]{2})/");


    public static void main(final String... args) {
        Data.exec(() -> new EventsTurkuTYY().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::events)
                .optMap(this::event)

                .map(event -> event

                        .value(Resources.university, Turku.Id)

                        .frame(DCTERMS.PUBLISHER, Publisher)
                        .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                )

                .sink(events -> upload(Events.Context,
                        validate(Event(), Set.of(Events.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> events(final Instant synced) {

        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.tyy.fi/{lang}/events.json")
                        .values("lang", "fi", "en")
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Accept", JSON.MIME)
                ))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> event(final JSONPath json) {

        final Optional<String> url=json.string("url");

        final Optional<String> source=url // canonical URL; will redirect to Finnish version ;-(
                .map(LangPattern::matcher)
                .map(v -> v.replaceFirst("/"));

        final String lang=url
                .map(LangPattern::matcher)
                .filter(Matcher::find)
                .map(v -> v.group(1))
                .orElse(Turku.Language);

        final Optional<String> title=json.string("title");
        final Optional<String> description=json.string("content").map(Untag::untag);
        final Optional<String> disambiguatingDescription=description.map(Strings::normalize).map(Strings::clip);

        return json.string("nid")

                .map(nid -> md5(format("%s/%s", Publisher.focus().stringValue(), nid)))

                .map(id -> frame(iri(Events.Context, id))

                                .value(RDF.TYPE, Events.Event)

                                .value(DCTERMS.SOURCE, source.map(Values::iri))

                                .value(Schema.url, url.map(Values::iri))
                                .value(Schema.name, title.map(s -> literal(s, lang)))
                                .value(Schema.image, json.string("image").map(Values::iri))
                                .value(Schema.description, description.map(s -> literal(s, lang)))
                                .value(Schema.disambiguatingDescription,
                                        disambiguatingDescription.map(s -> literal(s, lang))
                                )

                                .value(Schema.startDate, json.string("start_date").flatMap(this::datetime))
                                .value(Schema.endDate, json.string("end_date").flatMap(this::datetime))

                        // ;-( apparently no longer included after 2022-09-22

                        //.frame(Schema.organizer, organizer(json))
                        //.frame(Schema.location, location(json))

                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> organizer(final JSONPath json) {
        return json.string("organiser").map(organizer -> frame(iri(Organizations.Context, md5(organizer)))

                .value(RDF.TYPE, Schema.Organization)

                .value(Schema.name, literal(organizer, Turku.Language))

        );
    }

    private Optional<Frame> location(final JSONPath json) {
        return json.string("location")

                .map(location -> frame(iri(Locations.Context, md5(md5(format("%s{%s}", Publisher.focus(), location)))))

                        .value(RDF.TYPE, Schema.Place)

                        .value(Schema.name, literal(location, Turku.Language))
                        .frame(Schema.address, address(json))

                )

                .or(() -> address(json));
    }

    private Optional<Frame> address(final JSONPath json) {
        return json.string("address")

                .map(address -> frame(iri(Locations.Context, md5(format("%s{%s}", Publisher.focus(), address))))

                        .value(RDF.TYPE, Schema.PostalAddress)

                        .value(Schema.name, literal(address, Turku.Language))

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final String datetime) {
        return Optional.of(datetime)
                .map(LocalDateTime::parse)
                .map(v -> v.truncatedTo(ChronoUnit.SECONDS))
                .map(v -> v.atOffset(Turku.TimeZone.getRules().getOffset(v)))
                .map(Values::literal);
    }

}
