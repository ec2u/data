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

package eu.ec2u.data.concepts;

import com.metreeca.flow.rdf.actions.Retrieve;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.work.Xtream;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.stream.Stream;

import static com.metreeca.flow.rdf.Values.*;
import static com.metreeca.flow.rdf.formats.RDF.rdf;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.resources.Resources.locales;
import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.rio.RDFFormat.RDFXML;


/**
 * International Standard Classification of Education (ISCED-F 2013)
 *
 * @see <a
 * href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/international-education-classification">...</a>
 */
public final class ISCEDF2013 implements Runnable {

    public static final IRI Scheme=iri(Concepts.Context, "/isced-f-2013");

    private static final IRI Root=iri(Scheme, "/25831c2");

    private static final String External="http://data.europa.eu/snb/isced-f/";
    private static final String Internal=Scheme+"/";

    private static final String URL="https://op.europa.eu/o/opportal-service/euvoc-download-handler"
            +"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fcellar"
            +"%2F2d457b09-b648-11ea-bb7a-01aa75ed71a1.0001.01%2FDOC_1"
            +"&fileName=international-education-classification-skos-ap-eu.rdf";


    public static void main(final String... args) {
        exec(() -> new ISCEDF2013().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(URL)

                .map(new Retrieve()
                        .format(RDFXML)
                )

                .flatMap(model -> Stream.of(

                        rdf(resource(this, ".ttl"), BASE),

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

                                .collect(toList())

                ))

                .forEach(new Upload()
                        .contexts(Scheme)
                        .langs(locales())
                        .clear(true)
                )

        );
    }

}
