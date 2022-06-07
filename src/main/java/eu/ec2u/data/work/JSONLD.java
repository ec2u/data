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

import com.metreeca.http.CodecException;
import com.metreeca.link.Frame;
import com.metreeca.rdf.schemas.Schema;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.*;
import java.util.Collection;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static java.nio.charset.StandardCharsets.UTF_8;

public final class JSONLD {

    public static Stream<Frame> jsonld(final String json, final IRI type) {

        try ( final InputStream input=new ByteArrayInputStream(json.getBytes(UTF_8)) ) {

            final Collection<Statement> model=Schema.normalize(rdf(input, null, new JSONLDParser()));

            return frame(type, model).frames(inverse(RDF.TYPE));

        } catch ( final CodecException e ) {

            service(logger()).warning(JSONLD.class, e.getMessage());

            return Stream.empty();

        } catch ( final IOException unexpected ) {

            throw new UncheckedIOException(unexpected);

        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private JSONLD() { }

}
