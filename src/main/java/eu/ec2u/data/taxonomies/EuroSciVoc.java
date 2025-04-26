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

package eu.ec2u.data.taxonomies;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.services.Analyzer;
import com.metreeca.flow.rdf.actions.Retrieve;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.model.vocabulary.SKOSXL;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.json.services.Analyzer.analyzer;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.resources.Localized.LOCALES;
import static eu.ec2u.data.taxonomies.Taxonomies.TAXONOMIES;
import static eu.ec2u.work.Rover.rover;
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
public final class EuroSciVoc implements Runnable {

    public static final URI EUROSCIVOC=TAXONOMIES.resolve("euroscivoc");


    private static final String VERSION="1.5";

    private static final String EXTERNAL="http://data.europa.eu/8mn/euroscivoc/";
    private static final String INTERNAL=EUROSCIVOC+"/";

    private static final String URL="https://op.europa.eu/o/opportal-service/euvoc-download-handler"
                                    +"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Feuroscivoc%2F20241002-0%2Fttl%2Fskos_xl%2FEuroSciVoc.ttl"
                                    +"&fileName=EuroSciVoc.ttl";


    private static final OrgOrganizationFrame EU_PUBLICATION_OFFICE=new OrgOrganizationFrame()
            .id(uri("https://op.europa.eu/"))
            .prefLabel(map(entry(EN, "Publications Office of the European Union")));

    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(EUROSCIVOC)
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
                    )));


    public static void main(final String... args) {
        exec(() -> new EuroSciVoc().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        store.partition(EUROSCIVOC).update(array(list(Xtream

                .from(

                        Stream.of(
                                TAXONOMY,
                                EU_PUBLICATION_OFFICE
                        ),

                        Xtream.of(URL)

                                .map(new Retrieve()
                                        .format(TURTLE)
                                )

                                .flatMap(model -> rover(model)
                                        .focus(SKOS.CONCEPT)
                                        .reverse(RDF.TYPE)
                                        .split()
                                )

                                .parallel()

                                .optMap(concept -> concept.uri().map(id -> new TopicFrame()
                                        .generated(true)
                                        .id(adopt(id))
                                        .inScheme(TAXONOMY)
                                        .topConceptOf(concept.forward(SKOS.TOP_CONCEPT_OF)
                                                .uri().map(v -> TAXONOMY).orElse(null)
                                        )
                                        .notation(concept.forward(SKOS.NOTATION)
                                                .string().orElse(null)
                                        )
                                        .prefLabel(concept.forward(SKOSXL.PREF_LABEL).forward(SKOSXL.LITERAL_FORM)
                                                .texts(LOCALES).orElse(null)
                                        )
                                        .altLabel(concept.forward(SKOSXL.ALT_LABEL).forward(SKOSXL.LITERAL_FORM)
                                                .textsets(LOCALES).orElse(null)
                                        )
                                        .definition(concept.forward(SKOSXL.PREF_LABEL).forward(SKOSXL.LITERAL_FORM)
                                                .texts(LOCALES)
                                                .map(map -> map.get(EN))
                                                .flatMap(topic -> define(adopt(id), topic))
                                                .orElse(null)
                                        )
                                        .broader(set(concept.forward(SKOS.BROADER)
                                                .uris().map(b -> new TopicFrame().id(adopt(b)))
                                        ))
                                        .broaderTransitive(set(concept.plus(SKOS.BROADER)
                                                .uris().map(b -> new TopicFrame().id(adopt(b)))
                                        ))
                                        .exactMatch(set(new TopicFrame().id(id)))
                                ))
                )

                .optMap(new Validate<>())

        )), FORCE);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private URI adopt(final URI id) {
        return uri(id.toString().replace(EXTERNAL, INTERNAL));
    }

    private Optional<Map<Locale, String>> define(final URI id, final String topic) {
        return store.retrieve(new TopicFrame(true)
                        .id(id)
                        .definition(map(entry(ANY, "")))
                )

                .map(value -> value.get("definition"))
                .map(v -> map(v.texts()))

                .or(() -> analyzer

                        .prompt("""
                                Provide a definition between 250 and 500 chars for the research activity related \
                                to the given topic in the European Science Vocabulary (EuroSciVoc) taxonomy of \
                                fields of science based on OECD's 2015 Frascati Manual taxonomy.
                                
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
                        .map(definition -> map(entry(EN, definition))));

    }

}
