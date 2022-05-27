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

package eu.ec2u.data.work;

import com.metreeca.json.Frame;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.util.stream.Stream;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.inverse;
import static com.metreeca.rdf.formats.RDFFormat.rdf;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.stream.Collectors.toList;

public final class JSONLD {

    public static Stream<Frame> jsonld(final String json, final IRI type) {
        return rdf(new ByteArrayInputStream(json.getBytes(UTF_8)), null, new JSONLDParser())

                .map(model -> model.stream()
                        .map(com.metreeca.rdf.schemas.Schema::normalize)
                        .collect(toList())
                )

                .fold(

                        error -> {

                            service(logger()).warning(JSONLD.class, error.toString());

                            return Stream.empty();

                        },

                        model -> frame(type, model).frames(inverse(RDF.TYPE))

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private JSONLD() { }

}
