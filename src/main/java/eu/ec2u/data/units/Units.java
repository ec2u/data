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

package eu.ec2u.data.units;


import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.jsonld.handlers.Driver;
import com.metreeca.flow.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.Concepts;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.OrganizationalUnit;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.university;


public final class Units extends Delegator {

    public static final IRI Context=EC2U.item("/units/");
    public static final IRI ResearchTopics=iri(Concepts.Context, "/research-topics");

    public static final IRI Unit=EC2U.term("Unit");


    public static Shape Units() { return Dataset(Unit()); }

    public static Shape Unit() {
        return shape(Unit, Resource(), OrganizationalUnit(),

                property(DCTERMS.SUBJECT, multiple(Concept()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Units.class, Unit()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Units() {
        delegate(new Router()

                .path("/", handler(new Driver(Units()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                                field(university, iri()),
                                                field(ORG.CLASSIFICATION, iri())

                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Unit()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),

                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(university, iri()),
                                field(ORG.CLASSIFICATION, iri())

                        )))

                ))
        );
    }

}