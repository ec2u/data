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

package eu.ec2u.data.concepts;

import com.metreeca.core.Xtream;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.link.Values.*;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static org.eclipse.rdf4j.rio.RDFFormat.TURTLE;

import static java.util.stream.Collectors.toList;

/**
 * European Science Vocabulary (EuroSciVoc).
 *
 * <p>European Science Vocabulary (EuroSciVoc) is the taxonomy of fields of science based on OECD's 2015 Frascati Manual
 * taxonomy. It was extended with fields of science categories extracted from CORDIS content through a semi-automatic
 * process developed with Natural Language Processing (NLP) techniques</p>
 *
 * @see <a href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa
 * .eu/resource/dataset/euroscivoc">European Science Vocabulary (EuroSciVoc)</a> .eu/resource/dataset/euroscivoc
 */
public final class EuroSciVoc implements Runnable {

    private static final IRI Scheme=iri(Concepts.Context, "/euroscivoc");
    private static final IRI Root=iri(Scheme, "/40c0f173-baa3-48a3-9fe6-d6e8fb366a00");

    private static final String External="http://data.europa.eu/8mn/euroscivoc/";
    private static final String Internal=Scheme+"/";

    private static final Set<IRI> DCTTemporal=Set.of(DCTERMS.CREATED, DCTERMS.ISSUED, DCTERMS.MODIFIED);

    private static final String URL="https://op.europa.eu/o/opportal-service/euvoc-download-handler"
            +"?cellarURI=http%3A%2F%2Fpublications.europa.eu"
            +"%2Fresource%2Fcellar%2Fa9cbda63-2d9c-11ec-bd8e-01aa75ed71a1.0001.02%2FDOC_1"
            +"&fileName=EuroSciVoc-skos-ap-eu.ttl";


    public static void main(final String... args) {
        exec(() -> new EuroSciVoc().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream.of(URL)

                .map(new Retrieve()
                        .format(TURTLE)
                )


                .flatMap(model -> Stream.of(

                        rdf(this, ".ttl", EC2U.Base),

                        model.stream()

                                .filter(pattern(null, RDF.TYPE, SKOS.CONCEPT_SCHEME)
                                        .or(pattern(null, RDF.TYPE, SKOS.CONCEPT))
                                )
                                .filter(statement -> statement.getSubject().stringValue().startsWith(External))

                                .map(statement -> statement(
                                        rewrite((IRI)statement.getSubject(), External, Internal),
                                        OWL.SAMEAS,
                                        statement.getSubject()
                                ))

                                .collect(toList()),

                        model.stream()

                                .map(statement -> rewrite(statement, External, Internal))
                                .map(statement -> replace(statement, Root, Scheme))

                                // migrate dct: temporal properties to xsd:dateTime to comply with Resource data model

                                .map(statement -> {

                                    final IRI predicate=statement.getPredicate();
                                    final Resource subject=statement.getSubject();
                                    final Value object=statement.getObject();

                                    return DCTTemporal.contains(predicate) && literal(object)
                                            .map(Literal::getDatatype)
                                            .filter(XSD.DATE::equals)
                                            .isPresent()

                                            ? statement(subject, predicate,
                                            literal(String.format("%sT00:00:00Z", object.stringValue()), XSD.DATETIME)
                                    )

                                            : statement;
                                })

                                .collect(toList())

                ))

                .forEach(new Upload()
                        .contexts(Scheme)
                        .langs(Resources.Languages)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Statement replace(final Statement statement, final IRI source, final IRI target) {
        return statement(
                replace(statement.getSubject(), source, target),
                statement.getPredicate(),
                replace(statement.getObject(), source, target)
        );
    }

    private <V extends Value, R extends V> V replace(final V resource, final R source, final R target) {
        return resource.equals(source) ? target : resource;
    }

}
