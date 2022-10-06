/*
 * Copyright © 2020-2022 EC2U Alliance
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
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;

import static eu.ec2u.data.terms.EC2U.Reference;
import static eu.ec2u.data.terms.EC2U.multilingual;


public final class Units extends Delegator {

    public static Shape Unit() {
        return relate(EC2U.Resource(),

                hidden(field(RDF.TYPE, all(EC2U.Unit))),

                field(FOAF.HOMEPAGE, optional(), datatype(IRIType)),

                field(SKOS.PREF_LABEL, multilingual()),
                field(SKOS.ALT_LABEL, multilingual()),

                field(ORG.IDENTIFIER, optional(), datatype(XSD.STRING)),
                field(ORG.CLASSIFICATION, optional(), Reference()),

                field(ORG.UNIT_OF, repeatable(), Reference()),
                field(ORG.HAS_UNIT, multiple(), Reference()),

                field("head", inverse(ORG.HEAD_OF), optional(), Reference())

        );
    }


    public Units() {
        delegate(handler(

                new Driver(Unit(),

                        filter(clazz(EC2U.Unit))

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