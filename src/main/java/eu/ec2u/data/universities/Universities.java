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

package eu.ec2u.data.universities;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.decimal;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.FormalOrganization;
import static eu.ec2u.data.resources.Resources.Resource;


public final class Universities extends Delegator {

    public static final IRI Context=item("/universities/");

    public static final IRI University=term("University");

    private static final IRI inception=term("inception");
    private static final IRI students=term("students");

    private static final IRI country=term("country");
    private static final IRI city=term("city");

    private static final IRI scope=term("scope");


    public static Shape Universities() {
        return Dataset(University());
    }

    public static Shape University() {
        return shape(University, Resource(), FormalOrganization(),

                property(FOAF.DEPICTION, required(id())),
                property(FOAF.HOMEPAGE, repeatable(id())),

                property(inception, required(year())),
                property(students, required(integer())),
                property(country, required(Resource())),
                property(city, required(Resource())),

                property(WGS84.LAT, required(decimal())),
                property(WGS84.LONG, required(decimal())),

                property(ORG.SUB_ORGANIZATION_OF, hasValue((iri("https://ec2u.eu/")))),

                property(scope, multiple(

                        property("dataset", reverse(VOID.SUBSET), required(Dataset())),
                        property(VOID.ENTITIES, required(integer()))

                ))

        );
    }


    public static void main(final String... args) {
        exec(
                () -> new Universities_().run(),
                () -> create(Context, Universities.class, University())
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Universities() {
        delegate(new Router()

                .path("/", handler(new Driver(Universities()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD))
                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(University()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(scope, frame(

                                        field(reverse(VOID.SUBSET), frame(
                                                field(ID, literal("")),
                                                field(RDFS.LABEL, literal(""))
                                        )),

                                        field(VOID.ENTITIES, literal(Frame.integer(0)))

                                ))

                        )))

                ))
        );

    }

}