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

import com.metreeca.http.FormatException;
import com.metreeca.http.Request;
import com.metreeca.http.actions.Fetch;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import javax.json.Json;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Shift.Seq.seq;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.toolkits.Strings.clip;

import static eu.ec2u.data.EC2U.University.Jena;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.work.JSONLD.jsonld;
import static eu.ec2u.work.validation.Validators.validate;
import static java.util.function.Predicate.not;

public final class EventsJenaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/jena/city");

    private static final Frame Publisher=frame(iri("https://www.jena-veranstaltungen.de/veranstaltungen"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("City of Jena / Event Calendar", "en"),
                    literal("Stadt Jena / Veranstaltungskalender", Jena.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsJenaCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        Xtream.of(Events.synced(Context, Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .pipe(events -> validate(Events.Event(), Set.of(Events.Event), events))

                .forEach(new Events.Updater(Context));
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
                                .header("Content-Type", JSON.MIME)
                                .header("Accept", JSON.MIME)
                                .input(() -> new ByteArrayInputStream(Json.createObjectBuilder() // !!! review
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

                        .optMap(response -> {
                            try {

                                return Optional.of(response.body(new JSON()));

                            } catch ( final FormatException e ) {

                                service(logger()).error(this, "unable to parse message body", e);

                                return Optional.empty();

                            }
                        })

                        .map(JSONPath::new).map(path -> Map.entry(

                                path.values("docs.*").findAny().isPresent() ? Stream.of(page+1) : Stream.empty(),
                                path.strings("docs.*.url")

                        ))

                )

                // extract JSON-LD event descriptions

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> jsonld(json, Schema.Event));
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

            // repeating events are described multiple times with different start dates

            return frame(iri(Events.Context, frame.skolemize(Schema.url, Schema.startDate)))

                    .values(RDF.TYPE, Events.Event)

                    .frames(DCTERMS.SUBJECT, frame.string(Schema.term("keywords")).stream()
                            .flatMap(keywords -> Arrays.stream(keywords.split(",")))
                            .filter(not(keyword -> keyword.startsWith("import_")))
                            .filter(not(keyword -> keyword.startsWith("ausgabekanal_")))
                            .map(keyword -> frame(item(Events.Scheme, keyword))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.TOP_CONCEPT_OF, Events.Scheme)
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

                    .value(Resources.university, Jena.Id)

                    .value(Schema.url, url)
                    .value(Schema.name, name)
                    .value(Schema.image, frame.string(seq(Schema.image, Schema.url)).map(Values::iri))
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription)

                    .value(Schema.startDate, frame.value(Schema.startDate).map(this::datetime))
                    .value(Schema.endDate, frame.value(Schema.endDate).map(this::datetime))

                    .frame(Schema.organizer, frame.frame(Schema.organizer)
                            .flatMap(location -> thing(location, Organizations.Context))
                    )

                    .frame(Schema.location, frame.frame(Schema.location)
                            .flatMap(location -> thing(location, Locations.Context))
                    );

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal datetime(final Value v) {
        return literal(v.stringValue(), XSD.DATETIME);
    }

    private Optional<Frame> thing(final Frame frame, final IRI collection) {
        return frame.value(Schema.url).or(() -> frame.value(Schema.name))

                .map(Value::stringValue)

                .map(id -> frame(item(collection, frame.skolemize(Schema.url, Schema.name)))

                        .value(RDF.TYPE, frame.value(RDF.TYPE))

                        .value(Schema.url, frame.value(Schema.url).map(v -> iri(v.stringValue())))
                        .value(Schema.name, frame.value(Schema.name).map(v -> literal(v.stringValue(), Jena.Language)))
                );
    }

}
