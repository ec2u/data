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
import com.metreeca.rest.Request;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.rest.formats.JSONFormat;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.cities.Jena;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Stream;

import javax.json.Json;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.clip;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.json.shifts.Seq.seq;
import static com.metreeca.rest.Request.POST;
import static com.metreeca.rest.formats.InputFormat.input;
import static com.metreeca.rest.formats.JSONFormat.json;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.terms.Schema.Event;
import static eu.ec2u.data.work.JSONLD.jsonld;

import static java.util.function.Predicate.not;

public final class EventsJenaCity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.jena-veranstaltungen.de/veranstaltungen"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("City of Jena / Event Calendar", "en"),
                    literal("Stadt Jena / Veranstaltungskalender", Jena.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsJenaCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .optMap(new Validate(eu.ec2u.data.ports.Events.Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(0)

                // paginate through search results

                .scan(page -> Xtream

                        .of(new Request()
                                .method(POST)
                                .base("https://www.jena-veranstaltungen.de/")
                                .query("ndssolr=search")
                                .header("Content-Type", JSONFormat.MIME)
                                .header("Accept", JSONFormat.MIME)
                                .body(input(), () -> new ByteArrayInputStream(Json.createObjectBuilder() // !!! review
                                        .add("q", "*")
                                        .add("selectedFilter", Json.createArrayBuilder()
                                                .add("tx_ndsdestinationdataevent_domain_model_event")
                                        )
                                        .add("page", page)
                                        .build()
                                        .toString()
                                        .getBytes(StandardCharsets.UTF_8)
                                ))
                        )

                        .optMap(new Fetch())
                        .optMap(response -> response.body(json()).get())

                        .map(JSONPath.Processor::new).map(path -> Map.entry(

                                path.values("docs.*").findAny().isPresent() ? Stream.of(page+1) : Stream.empty(),
                                path.strings("docs.*.url")

                        ))

                )

                // extract JSON-LD event descriptions

                .optMap(new GET<>(html()))

                .optMap(new XPath<>(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                ))

                .flatMap(json -> jsonld(json, Event));
    }

    private Optional<Frame> event(final Frame frame) {
        return frame.value(Schema.url).map(url -> {

            final Optional<Literal> name=frame.value(Schema.name)
                    .map(Value::stringValue)
                    .map(text -> literal(text, Jena.Language));

            final Optional<Literal> description=frame.value(Schema.description)
                    .map(Value::stringValue)
                    .map(Untag::untag)
                    .map(text -> literal(text, Jena.Language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(literal -> literal(clip(literal.stringValue()), Jena.Language));

            return frame(iri(EC2U.events, md5(url.stringValue())))

                    .values(RDF.TYPE, EC2U.Event, Event)
                    .value(RDFS.LABEL, name)
                    .value(RDFS.COMMENT, disambiguatingDescription)

                    .value(DCTERMS.TITLE, name)
                    .value(DCTERMS.DESCRIPTION, disambiguatingDescription)

                    .frames(DCTERMS.SUBJECT, frame.string(Schema.term("keywords")).stream()
                            .flatMap(keywords -> Arrays.stream(keywords.split(",")))
                            .filter(not(keyword -> keyword.startsWith("import_")))
                            .filter(not(keyword -> keyword.startsWith("ausgabekanal_")))
                            .map(keyword -> frame(iri(EC2U.concepts, md5(keyword)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(RDFS.LABEL, literal(keyword, Jena.Language))
                                    .value(SKOS.PREF_LABEL, literal(keyword, Jena.Language))

                            )
                    )

                    .value(DCTERMS.SOURCE, url)
                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.CREATED, frame.value(Schema.dateCreated).map(this::datetime))
                    .value(DCTERMS.MODIFIED, frame.value(Schema.dateModified).map(this::datetime)
                            .orElseGet(() -> literal(now.atOffset(ZoneOffset.UTC)))
                    )

                    .value(EC2U.university, Jena.University)

                    .value(Schema.url, url)
                    .value(Schema.name, name)
                    .value(Schema.image, frame.string(seq(Schema.image, Schema.url)).map(Values::iri))
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription)

                    .value(Schema.startDate, frame.value(Schema.startDate).map(this::datetime))
                    .value(Schema.endDate, frame.value(Schema.endDate).map(this::datetime))

                    .frame(Schema.organizer, frame.frame(Schema.organizer)
                            .flatMap(location -> location(location, EC2U.organizations))
                    )

                    .frame(Schema.location, frame.frame(Schema.location)
                            .flatMap(location -> location(location, EC2U.locations))
                    );

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal datetime(final Value v) {
        return literal(v.stringValue(), XSD.DATETIME);
    }

    private Optional<Frame> location(final Frame frame, final IRI locations) {
        return frame.value(Schema.url).or(() -> frame.value(Schema.name))

                .map(Value::stringValue)

                .map(id -> frame(iri(locations, md5(id.trim())))

                        .value(RDF.TYPE, frame.value(RDF.TYPE))
                        .value(RDFS.LABEL, frame.value(Schema.name).map(v -> literal(v.stringValue(), Jena.Language)))

                        .value(Schema.url, frame.value(Schema.url).map(v -> iri(v.stringValue())))
                        .value(Schema.name, frame.value(Schema.name).map(v -> literal(v.stringValue(), Jena.Language)))
                );
    }

}
