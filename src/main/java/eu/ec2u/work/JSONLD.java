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

package eu.ec2u.work;

import com.metreeca.http.FormatException;
import com.metreeca.rdf.Frame;
import com.metreeca.rdf.schemas.Schema;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Collection;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.rdf.Frame.frame;
import static com.metreeca.rdf.Values.inverse;
import static com.metreeca.rdf.formats.RDF.rdf;

import static java.nio.charset.StandardCharsets.UTF_8;

public final class JSONLD {

    public static Stream<Frame> jsonld(final String json, final IRI type) {

        try ( final InputStream input=new ByteArrayInputStream(json.getBytes(UTF_8)) ) {

            final Collection<Statement> model=Schema.normalize(rdf(input, null, new JSONLDParser()));

            return frame(type, model).frames(inverse(RDF.TYPE));

        } catch ( final FormatException e ) {

            service(logger()).warning(JSONLD.class, e.getMessage());

            return Stream.empty();

        } catch ( final IOException unexpected ) {

            throw new UncheckedIOException(unexpected);

        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private JSONLD() { }

}
