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

package eu.ec2u.data.persons;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;

import static eu.ec2u.data.ontologies.EC2U.Reference;

public final class Persons extends Delegator {

    public static Shape Person() {
        return relate(EC2U.Resource(),

                hidden(field(RDF.TYPE, all(EC2U.Person))),

                field(FOAF.GIVEN_NAME, required(), datatype(XSD.STRING)),
                field(FOAF.FAMILY_NAME, required(), datatype(XSD.STRING)),

                field(ORG.HEAD_OF, multiple(), Reference()),
                field(ORG.MEMBER_OF, multiple(), Reference())

        );
    }


    public Persons() {
        delegate(handler(

                new Driver(Person(),

                        filter(clazz(EC2U.Person))

                ),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/{id}", new Router()
                                .get(new Relator())
                        )

        ));
    }

}