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

import com.metreeca.http.FormatException;
import com.metreeca.http.Request;
import com.metreeca.http.actions.Fetch;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.jsonld.formats.JSONLD;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.focus.Focus;
import jakarta.json.Json;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.model.vocabulary.XSD;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.StringReader;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf.schemas.Schema.normalize;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.toolkits.Strings.clip;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.location;
import static eu.ec2u.data.things.Schema.schema;
import static eu.ec2u.data.universities.University.Jena;
import static eu.ec2u.work.focus.Focus.focus;
import static java.util.function.Predicate.not;

public final class EventsJenaCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/jena/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.jena-veranstaltungen.de/veranstaltungen")),
            field(TYPE, Schema.Organization),

            field(university, Jena.id),

            field(Schema.name,
                    literal("City of Jena / Event Calendar", "en"),
                    literal("Stadt Jena / Veranstaltungskalender", Jena.language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        exec(() -> new EventsJenaCity().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(Instant.now())

                .flatMap(this::crawl)
                .optMap(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Focus> crawl(final Instant now) {
        return Xtream.of(0)

                // paginate through search results

                .crawl(page -> Xtream

                        .of(new Request()
                                .method(POST)
                                .base("https://www.jena-veranstaltungen.de/")
                                .query("ndssolr=search")
                                .header("Accept", JSON.MIME)
                                .body(new JSON(), Json.createObjectBuilder()
                                        .add("q", "*")
                                        .add("selectedFilter", Json.createArrayBuilder()
                                                .add("tx_ndsdestinationdataevent_domain_model_event")
                                        )
                                        .add("page", page)
                                        .build()
                                )
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

                .map(json -> {

                    final RDFParser parser=new JSONLDParser();

                    parser.set(JSONLDSettings.SECURE_MODE, false); // ;( retrieve http://schema.org/ links

                    try ( final StringReader reader=new StringReader(json) ) {

                        return rdf(reader, "", parser);

                    } catch ( final FormatException e ) {

                        service(logger()).warning(JSONLD.class, e.getMessage());

                        return Set.<Statement>of();

                    }

                })

                .flatMap(model -> focus(Set.of(Event), normalize(model))
                        .seq(reverse(RDF.TYPE))
                        .split()
                );
    }

    private Optional<Frame> event(final Focus focus) {
        return focus.seq(Schema.url).value(asIRI()).map(url -> {

            final Optional<Literal> name=focus.seq(Schema.name).value()
                    .map(Value::stringValue)
                    .map(text -> literal(text, Jena.language));

            final Optional<Literal> description=focus.seq(Schema.description).value()
                    .map(Value::stringValue)
                    .map(Untag::untag)
                    .map(text -> literal(text, Jena.language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(literal -> literal(clip(literal.stringValue()), Jena.language));

            // repeating events are described multiple times with different start dates

            return frame(

                    field(ID, iri(Events.Context, skolemize(focus, Schema.url, startDate))),

                    field(RDF.TYPE, Event),

                    field(university, Jena.id),

                    field(Schema.url, url),
                    field(Schema.name, name),
                    field(Schema.description, description),
                    field(Schema.disambiguatingDescription, disambiguatingDescription),

                    field(Schema.image, focus.seq(Schema.image, Schema.url).value(asString())
                            .map(Frame::iri)
                            .map(iri -> frame(
                                    field(ID, iri),
                                    field(TYPE, Schema.ImageObject),
                                    field(Schema.url, iri)
                            ))
                    ),

                    field(startDate, focus.seq(startDate).value().map(this::datetime)),
                    field(endDate, focus.seq(endDate).value().map(this::datetime)),

                    field(publisher, Publisher),

                    field(organizer, thing(focus.seq(organizer), Organizations.Context)),
                    field(location, thing(focus.seq(location), Locations.Context)),

                    field(Schema.about, focus.seq(schema("keywords")).value(asString()).stream()
                            .flatMap(keywords -> Arrays.stream(keywords.split(",")))
                            .filter(not(keyword -> keyword.startsWith("import_")))
                            .filter(not(keyword -> keyword.startsWith("ausgabekanal_")))
                            .map(keyword -> frame(

                                    field(ID, item(Topics, keyword)),

                                    field(RDF.TYPE, SKOS.CONCEPT),
                                    field(SKOS.TOP_CONCEPT_OF, Topics),
                                    field(SKOS.PREF_LABEL, literal(keyword, Jena.language))

                            ))
                    )
            );

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal datetime(final Value value) {
        return literal(value.stringValue(), XSD.DATETIME);
    }

    private Optional<Frame> thing(final Focus focus, final IRI collection) {
        return focus.seq(Schema.url).value().or(() -> focus.seq(Schema.name).value())

                .map(Value::stringValue)

                .map(id -> frame(

                        field(ID, item(collection, skolemize(focus, Schema.url, Schema.name))),

                        field(RDF.TYPE, focus.seq(RDF.TYPE).value()),

                        field(Schema.url, focus.seq(Schema.url).value().map(v -> iri(v.stringValue()))),
                        field(Schema.name, focus.seq(Schema.name).value().map(v -> literal(v.stringValue(), Jena.language)))

                ));
    }

}
