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
import com.metreeca.mesh.pipe.Store;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.ReferenceFrame;
import eu.ec2u.work.ai.Analyzer;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.net.URI;
import java.time.LocalDate;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
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
import static org.eclipse.rdf4j.model.util.Values.iri;
import static org.eclipse.rdf4j.rio.RDFFormat.RDFXML;

/**
 * International Standard Classification of Education (ISCED-F 2013)
 *
 * @see <a
 *         href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/international-education-classification">...</a>
 */
public final class TopicsISCEDF2013 implements Runnable {

    public static final String PATH=Taxonomies.PATH+"isced-f-2013/";

    private static final String VERSION="20240110-0";

    private static final String URL="https://op.europa.eu/o/opportal-service/euvoc-download-handler"
            +"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution"
            +"%2Finternational-education-classification%2F20240110-0%2Frdf%2Fskos_ap_eu"
            +"%2Finternational-education-classification-skos-ap-eu.rdf"
            +"&fileName=international-education-classification-skos-ap-eu.rdf";


    public static final TaxonomyFrame ISCEDF2013=new TaxonomyFrame()
            .id(uri(PATH))
            .version(VERSION)
            .title(map(entry(EN, "International Standard Classification of Education: Fields of Education and Training 2013")))
            .alternative(map(entry(EN, "ISCED-F 2013")))
            .description(map(entry(EN, """
                    International Standard Classification of Education: Fields of Education and Training 2013
                    (ISCED-F 2013) - is a classification of fields of education, which accompanies ISCED 2011. \
                    ISCED-F 2013 contains 11 broad fields (2 digits), 29 narrow fields (3 digits) and about 80 \
                    detailed fields (4 digits).""")))
            .issued(LocalDate.parse("2013-11-13"))
            .rights("Copyright © 2015 UNESCO Institute for Statistics")
            .publisher(TopicsISCED.UNESCO_INSTITUTE_FOR_STATISTICS)
            .source(new ReferenceFrame()
                    .id(uri("https://uis.unesco.org"
                            +"/sites/default/files/documents"
                            +"/international-standard-classification-of-education-fields-of-education-and-training-2013-detailed-field-descriptions-2015-en.pdf"
                    ))
            );


    private static final String EXTERNAL="http://data.europa.eu/snb/isced-f/";
    private static final String INTERNAL=ISCEDF2013.id().toString();

    private static final IRI XL_NOTATION=iri("http://publications.europa.eu/ontology/euvoc#", "xlNotation");


    public static void main(final String... args) {
        exec(() -> new TopicsISCEDF2013().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Analyzer analyzer=service(analyzer());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.modify(

                array(list(Stream.concat(

                        Stream.of(
                                ISCEDF2013
                        ),

                        Stream.of(URL)

                                .map(new Retrieve()
                                        .format(RDFXML)
                                )

                                .flatMap(model -> rover(model)
                                        .focus(SKOS.CONCEPT)
                                        .traverse(reverse(RDF.TYPE))
                                        .split()
                                )

                                .map(concept -> async(() -> concept.uri()

                                        .map(id -> new TopicFrame()
                                                .id(adopt(id))
                                                .generated(true)
                                                .isDefinedBy(id)
                                                .inScheme(ISCEDF2013)
                                                .topConceptOf(concept
                                                        .traverse(SKOS.TOP_CONCEPT_OF)
                                                        .uri()
                                                        .map(v -> ISCEDF2013)
                                                        .orElse(null)
                                                )
                                                .notation(concept
                                                        .traverse(XL_NOTATION, RDF.VALUE)
                                                        .string()
                                                        .orElse(null)
                                                )
                                                .prefLabel(map(concept
                                                        .traverse(SKOS.PREF_LABEL)
                                                        .texts()
                                                        .filter(Reference::local)
                                                ))
                                                .altLabel(mapset(concept
                                                        .traverse(SKOS.ALT_LABEL)
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
                        .where("inScheme", criterion().any(ISCEDF2013))
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
                                        Provide a definition between 250 and 500 chars for the field of education  \
                                        related to the given topic in the International Standard Classification of \
                                        Education: Fields of Education and Training 2013 taxonomy.
                                        
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
