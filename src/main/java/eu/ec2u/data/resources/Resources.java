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
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.universities.Universities.University;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toUnmodifiableSet;


public final class Resources extends Delegator {

    public static final IRI Context=item("/resources/");

    public static final IRI Resource=term("Resource");

    public static final IRI university=term("university");


    private static final Set<String> locales=Stream

            .concat(
                    Stream.of(NOT_LOCALE, "en"),
                    stream(eu.ec2u.data.universities.University.values()).map(u -> u.language)
            )

            .collect(toUnmodifiableSet());


    public static Set<String> locales() {
        return locales;
    }


    public static Shape Resources() { return Dataset(Resource()); }

    public static Shape Resource() {
        return shape(

                property("id", ID, required(id())),

                property(RDF.TYPE, multiple(id())),
                property(RDFS.LABEL, optional(text(locales()), maxLength(1_000))), // !!! 1000
                property(RDFS.COMMENT, optional(text(locales()), maxLength(10_000))), // !!! 1_000

                property(RDFS.SEEALSO, multiple(id())),
                property(RDFS.ISDEFINEDBY, optional(id())),

                property(university, () -> optional(University())),

                property("dataset", reverse(RDFS.MEMBER), () -> multiple(Dataset()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Resources.class, Resource()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Resources() {
        delegate(handler(new Driver(Resources()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("EC2U Knowledge Hub Resources", "en")),

                        field(RDFS.MEMBER, query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                        field(reverse(RDFS.MEMBER), iri()),
                                        field(university, iri())

                                )

                        ))

                )))

        ));
    }

}