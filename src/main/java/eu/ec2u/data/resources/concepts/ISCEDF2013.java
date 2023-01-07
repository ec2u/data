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

package eu.ec2u.data.resources.concepts;

import com.metreeca.core.Xtream;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import static eu.ec2u.data.Data.exec;


/**
 * International Standard Classification of Education (ISCED-F 2013)
 *
 * @see <a href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa
 * .eu/resource/dataset/international-education-classification">...</a>
 */
final class ISCEDF2013 {

    public static void main(final String... args) {
        exec(() -> Xtream

                .of("https://op.europa.eu/o/opportal-service/euvoc-download-handler?cellarURI=http%3A%2F"
                        +"%2Fpublications.europa.eu%2Fresource%2Fcellar%2F2d457b09-b648-11ea-bb7a-01aa75ed71a1"
                        +".0001.01%2FDOC_1&fileName=international-education-classification-skos-ap-eu.rdf")

                .bagMap(new Retrieve())

                .batch(100*1000)

                .forEach(new Upload()
                        .clear(true)
                        .contexts(Concepts.Id)

                )
        );
    }

}