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

package eu.ec2u.data.units;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.rdf4j.services.Graph;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.rdf4j.services.Graph.graph;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.units.Units.ResearchTopics;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.data.universities.University.Coimbra;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static org.eclipse.rdf4j.model.util.Values.literal;

public final class UnitsCoimbra implements Runnable {

    private static final IRI Context=iri(Units.Context, "/coimbra");

    private static final String APIUrl="units-coimbra-url";
    private static final String APIKey="units-coimbra-key";


    public static void main(final String... args) {
        exec(() -> new UnitsCoimbra().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Graph graph=service(graph());
    private final Logger logger=service(logger());


    @Override public void run() {
        update(connection -> Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .optMap(this::unit)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> units(final Instant updated) {

        final String url=vault.get(APIUrl);
        final String key=service(vault()).get(APIKey);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Key", key)
                ))

                .map(JSONPath::new)

                .filter(json -> json.string("error")

                        .map(message -> {

                            logger.error(this, json.toString());

                            return message;

                        })

                        .isEmpty())

                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> unit(final JSONPath json) {
        return json.string("id").map(id -> frame(

                field(ID, item(Units.Context, Coimbra, id)),
                field(TYPE, Unit),

                field(Resources.university, Coimbra.id),

                field(FOAF.HOMEPAGE, json.string("web_url").map(Frame::iri)),
                field(FOAF.MBOX, json.string("email").map(Frame::literal)),

                field(ORG.IDENTIFIER, literal(id)),
                field(SKOS.PREF_LABEL, json.string("name_en").filter(not(String::isEmpty)).map(v -> literal(v, "en"))),
                field(SKOS.PREF_LABEL, json.string("name_pt").filter(not(String::isEmpty)).map(v -> literal(v, Coimbra.language))),
                field(SKOS.ALT_LABEL, json.string("acronym_en").filter(not(String::isEmpty)).map(v -> literal(v, "en"))),
                field(SKOS.ALT_LABEL, json.string("acronym_pt").filter(not(String::isEmpty)).map(v -> literal(v, Coimbra.language))),
                field(SKOS.DEFINITION, json.string("description_en").filter(not(String::isEmpty)).map(v -> literal(v, "en"))),
                field(SKOS.DEFINITION, json.string("description_pt").filter(not(String::isEmpty)).map(v -> literal(v, Coimbra.language))),

                field(reverse(ORG.HEAD_OF), json.string("surname").flatMap(surname ->
                        json.string("forename").map(forename -> frame(

                                field(ID, item(Persons.Context, Coimbra, format("%s, %s", surname, forename))),
                                field(TYPE, FOAF.PERSON),

                                field(FOAF.GIVEN_NAME, literal(forename)),
                                field(FOAF.FAMILY_NAME, literal(surname))

                        ))
                )),

                field(ORG.UNIT_OF, Coimbra.id),
                field(ORG.CLASSIFICATION, json.string("type_en").flatMap(this::type)),

                field(DCTERMS.SUBJECT, sector(json)), // !!! review property
                field(DCTERMS.SUBJECT, subjects(json))

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> sector(final JSONPath json) {
        return json.string("knowledge_branch_en")

                .map(type -> frame(

                        field(ID, item(ResearchTopics, Coimbra, type)),
                        field(TYPE, SKOS.CONCEPT),

                        field(SKOS.TOP_CONCEPT_OF, ResearchTopics),

                        field(SKOS.PREF_LABEL, json.string("knowledge_branch_en").map(v -> literal(v, "en"))),
                        field(SKOS.PREF_LABEL, json.string("knowledge_branch_pt").map(v -> literal(v, Coimbra.language)))

                ));
    }

    private Stream<Frame> subjects(final JSONPath json) {
        return json.paths("topics.*")

                .map(topic -> frame(

                        field(ID, topic.string("name_en").map(v -> item(ResearchTopics, Coimbra, v))),
                        field(TYPE, SKOS.CONCEPT),

                        field(SKOS.TOP_CONCEPT_OF, ResearchTopics),

                        field(SKOS.PREF_LABEL, topic.string("name_en").map(v -> literal(v, "en")))
                        // field(SKOS.PREF_LABEL, topic.string("name_pt").map(v -> literal(v, Coimbra.language)))

                ));
    }


    //// !!! Factor with CSVLoader /////////////////////////////////////////////////////////////////////////////////////

    private final Map<String, Value> types=new HashMap<>();


    private Optional<Value> type(final String type) {
        return Optional

                .of(types.computeIfAbsent(type, key -> graph.query(connection -> {

                    final TupleQuery query=connection.prepareTupleQuery(""
                            +"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
                            +"\n"
                            +"select ?concept {\n"
                            +"\n"
                            +"\t?concept skos:inScheme $scheme; skos:prefLabel|skos:altLabel $label. \n"
                            +"\n"
                            +"\tfilter (lcase(str(?label)) = lcase(str($value)))\n"
                            +"\n"
                            +"}\n"
                    );

                    query.setBinding("scheme", OrganizationTypes.OrganizationTypes);
                    query.setBinding("value", literal(key));

                    try ( final TupleQueryResult evaluate=query.evaluate() ) {

                        return evaluate.stream().findFirst()
                                .map(bindings -> bindings.getValue("concept"))
                                .orElseGet(() -> {

                                    logger.warning(this, format("unknown unit type <%s>", key));

                                    return RDF.NIL;

                                });

                    }

                })))

                .filter(not(RDF.NIL::equals));
    }

}
