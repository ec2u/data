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

package eu.ec2u.data.ports;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Link.link;

import static eu.ec2u.data.terms.EC2U.multilingual;


public final class Universities extends Delegator {


    public static Shape University() {
        return relate(

                filter(clazz(EC2U.University)),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual()),

                field(EC2U.schac, required(), datatype(XSD.STRING)),
                field(EC2U.image, optional(), datatype(IRIType)),

                link(OWL.SAMEAS,

                        field(EC2U.country, optional(),
                                field(RDFS.LABEL, optional(), multilingual())
                        ),

                        detail(

                                field(EC2U.location, optional(),
                                        field(RDFS.LABEL, optional(), multilingual())
                                ),

                                field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
                                field(WGS84.LONG, optional(), datatype(XSD.DECIMAL)),

                                field(EC2U.inception, optional(), datatype(XSD.DATETIME)),
                                field(EC2U.students, optional(), datatype(XSD.DECIMAL))
                        )

                )

        );
    }


    public Universities() {
        delegate(handler(new Driver(University()), new Router()

                .path("/", new Router()
                        .get(new Relator())
                )

                .path("/{id}", new Router()
                        .get(new Relator())
                )));
    }

}