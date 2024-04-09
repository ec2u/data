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

package eu.ec2u.data.concepts;

import com.metreeca.http.rdf4j.actions.Upload;

import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.update;


public final class ESCO implements Runnable {

    public static final IRI Context=iri(Concepts.Context, "/esco");

    public static final IRI Occupations=iri(Concepts.Context, "/esco-occupations");
    public static final IRI Skills=iri(Concepts.Context, "/esco-skils");
    public static final IRI Qualifications=iri(Concepts.Context, "/esco-qualifications");


    public static void main(final String... args) {
        exec(() -> new ESCO().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Stream

                .of(rdf(resource(this, ".ttl"), BASE))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }
}
