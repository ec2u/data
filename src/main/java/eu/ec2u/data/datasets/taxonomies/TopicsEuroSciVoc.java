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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.flow.rdf.actions.Retrieve;
import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.ReferenceFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.work.ai.Analyzer;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.model.vocabulary.SKOSXL;

import java.net.URI;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.*;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Rover.*;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Locales.ANY;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static org.eclipse.rdf4j.rio.RDFFormat.TURTLE;

/**
 * European Science Vocabulary (EuroSciVoc).
 *
 * <p>European Science Vocabulary (EuroSciVoc) is the taxonomy of fields of science based on OECD's 2015 Frascati
 * Manual taxonomy. It was extended with fields of science categories extracted from CORDIS content through a
 * semi-automatic process developed with Natural Language Processing (NLP) techniques</p>
 *
 * @see <a
 *         href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/euroscivoc">European
 *         Science Vocabulary (EuroSciVoc)</a>
 */
public final class TopicsEuroSciVoc implements Runnable {

    public static final String PATH=Taxonomies.PATH+"euroscivoc/";

    private static final String VERSION="1.5-20241002";

    private static final String URL="https://op.europa.eu/o/opportal-service/euvoc-download-handler"
            +"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Feuroscivoc%2F20241002-0%2Fttl%2Fskos_xl%2FEuroSciVoc.ttl"
            +"&fileName=EuroSciVoc.ttl";


    private static final OrganizationFrame EU_PUBLICATION_OFFICE=new OrganizationFrame()
            .id(uri("https://op.europa.eu/"))
            .prefLabel(map(entry(EN, "Publications Office of the European Union")));

    public static final TaxonomyFrame EUROSCIVOC=new TaxonomyFrame()
            .id(uri(PATH))
            .version(VERSION)
            .title(map(entry(EN, "European Science Vocabulary")))
            .alternative(map(entry(EN, "EuroSciVoc")))
            .description(map(entry(EN, """
                    European Science Vocabulary (EuroSciVoc) is the taxonomy of fields of science based on OECD's \
                    2015 Frascati Manual taxonomy. It was extended with fields of science categories extracted from \
                    CORDIS content through a semi-automatic process developed with Natural Language Processing \
                    (NLP) techniques."""
            )))
            .issued(LocalDate.parse("2024-10-02"))
            .rights("Copyright © 2023 Publications Office of the European Union")
            .publisher(EU_PUBLICATION_OFFICE)
            .source(new ReferenceFrame()
                    .id(uri("https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource"
                            +"?uri=http://publications.europa.eu/resource/dataset/euroscivoc"
                    ))
            );


    private static final String EXTERNAL="http://data.europa.eu/8mn/euroscivoc/";
    private static final String INTERNAL=EUROSCIVOC.id().toString();


    public static void main(final String... args) {
        exec(() -> new TopicsEuroSciVoc().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Analyzer analyzer=service(analyzer());
    private final Logger logger=service(logger());

    private final Executor executor=executor(10); // ;( limit concurrent threads updating GDB


    @Override
    public void run() {
        time(() -> store.modify(

                array(list(Stream.concat(

                        Stream.of(
                                EUROSCIVOC,
                                EU_PUBLICATION_OFFICE
                        ),

                        Stream.of(URL)

                                .map(new Retrieve()
                                        .format(TURTLE)
                                )

                                .flatMap(model -> rover(model)
                                        .focus(SKOS.CONCEPT)
                                        .traverse(reverse(RDF.TYPE))
                                        .split()
                                )

                                .map(concept -> async(executor, () -> concept.uri()

                                        .map(id -> new TopicFrame()
                                                .id(adopt(id))
                                                .generated(true)
                                                .isDefinedBy(id)
                                                .inScheme(EUROSCIVOC)
                                                .topConceptOf(concept
                                                        .traverse(SKOS.TOP_CONCEPT_OF)
                                                        .uri()
                                                        .map(v -> EUROSCIVOC)
                                                        .orElse(null)
                                                )
                                                .notation(concept
                                                        .traverse(SKOS.NOTATION)
                                                        .string()
                                                        .orElse(null)
                                                )
                                                .prefLabel(map(concept
                                                        .traverse(SKOSXL.PREF_LABEL, SKOSXL.LITERAL_FORM)
                                                        .texts()
                                                        .filter(Reference::local)
                                                ))
                                                .altLabel(mapset(concept
                                                        .traverse(SKOSXL.ALT_LABEL, SKOSXL.LITERAL_FORM)
                                                        .texts()
                                                        .filter(Reference::local)
                                                ))
                                                .broader(set(concept
                                                        .traverse(SKOS.BROADER)
                                                        .uris()
                                                        .map(b -> new TopicFrame().id(adopt(b)))
                                                ))
                                                .broaderTransitive(set(concept
                                                        .traverse(plus(forward(SKOS.BROADER)))
                                                        .uris()
                                                        .map(b -> new TopicFrame().id(adopt(b)))
                                                ))
                                        )

                                        .map(this::define)
                                        .flatMap(Topic::review)

                                ))

                                .collect(joining())
                                .flatMap(Optional::stream)

                ))),

                value(query()
                        .model(new TopicFrame(true))
                        .where("inScheme", criterion().any(EUROSCIVOC))
                )

        )).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private URI adopt(final URI id) {
        return uri(id.toString().replace(EXTERNAL, INTERNAL));
    }

    private TopicFrame define(final TopicFrame frame) {
        return frame.definition(Optional.ofNullable(frame.prefLabel().get(EN))

                .flatMap(topic -> store.retrieve(new TopicFrame(true)
                                .id(frame.id())
                                .definition(map(entry(ANY, "")))
                        )

                        .value()
                        .flatMap(value -> value.get("definition").value())
                        .map(v -> map(v.texts()))

                        .or(() -> analyzer

                                .prompt("""
                                        Provide a definition between 250 and 500 chars for the research activity \
                                        related to the given topic in the European Science Vocabulary (EuroSciVoc) \
                                        taxonomy of fields of science based on OECD's 2015 Frascati Manual taxonomy.
                                        
                                        Respond with a JSON object
                                        """, """
                                        {
                                           "name": "topic",
                                           "schema": {
                                             "type": "object",
                                             "properties": {
                                               "definition": {
                                                 "type": "string"
                                               }
                                             },
                                             "required": [
                                               "definition"
                                             ],
                                             "additionalProperties": false
                                           },
                                           "strict": true
                                         }
                                        """
                                )

                                .apply(topic)
                                .flatMap(value -> value.get("definition").string())
                                .map(definition -> map(entry(EN, definition)))
                        ))

                .orElse(null)
        );
    }

}
