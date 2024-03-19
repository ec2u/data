/*
 * Copyright © 2020-2024 EC2U Alliance
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
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf.schemas.Schema;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.StringReader;
import java.util.Collection;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.link.Frame.reverse;

public final class JSONLD {

    public static Stream<Frame> jsonld(final String json, final IRI type) {


        try {

            final Collection<Statement> model=Schema.normalize(rdf(new StringReader(json), "", new JSONLDParser()));

            return frame(type, model).frames(reverse(RDF.TYPE));

        } catch ( final FormatException e ) {

            service(logger()).warning(JSONLD.class, e.getMessage());

            return Stream.empty();

        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private JSONLD() { }

}
