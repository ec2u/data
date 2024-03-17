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

package eu.ec2u.data.resources;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import eu.ec2u.data.universities._Universities;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.universities.Universities.University;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toUnmodifiableSet;


public final class Resources extends Delegator {

    private static final IRI Context=item("/resources/");

    public static final IRI Resource=term("Resource");
    public static final IRI Publisher=term("Publisher");

    public static final IRI College=term("College");
    public static final IRI Association=term("Association");
    public static final IRI City=term("City");

    public static final IRI university=term("university");


    public static final Set<String> Languages=Stream

            .concat(
                    Stream.of("en"),
                    stream(_Universities.values()).map(u -> u.Language)
            )

            .collect(toUnmodifiableSet());


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Shape Reference() {
        return shape(

                property("id", ID, required(id())),

                property(RDFS.LABEL, required(localized())),
                property(RDFS.COMMENT, optional(localized()))

        );
    }

    public static Shape Resource() {
        return shape(Reference(),

                property(university, () -> required(University())),

                property(DCTERMS.TITLE, required(localized())),
                property(DCTERMS.ALTERNATIVE, optional(localized())),
                property(DCTERMS.DESCRIPTION, optional(localized())),

                property(DCTERMS.CREATED, optional(dateTime())),
                property(DCTERMS.ISSUED, optional(dateTime())),
                property(DCTERMS.MODIFIED, optional(dateTime())),

                property(DCTERMS.SOURCE, () -> optional(Resource())),
                property(DCTERMS.PUBLISHER, () -> optional(Publisher())),

                property(DCTERMS.TYPE, () -> multiple(SKOSConcept())),
                property(DCTERMS.SUBJECT, () -> multiple(SKOSConcept())),

                property(RDFS.SEEALSO, optional(id()))

        );
    }

    public static Shape Publisher() {
        return shape(Resource(),

                property(DCTERMS.COVERAGE, optional(id())),

                property(SKOS.PREF_LABEL, localized()),
                property(FOAF.HOMEPAGE, optional(id()))

        );
    }


    public static Shape localized() {
        return Shape.local(/*Languages*/); // !!!
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Resources() {
        delegate(handler(new Driver(virtual(Reference(),

                        property("members", RDFS.MEMBER, Resource())

                )), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("EC2U Knowledge Hub Resources", "en")),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD)),

                                                field(university, iri())

                                        ),

                                        filter(RDF.TYPE, Resource)

                                ))

                        )))

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Resources.class, ".ttl", _EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }

    }

}