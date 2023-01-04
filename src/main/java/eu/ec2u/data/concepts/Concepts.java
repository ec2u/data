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

package eu.ec2u.data.concepts;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;

import static eu.ec2u.data.ontologies.EC2U.*;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");


    private static Shape ConceptScheme() {
        return relate(EC2U.Resource(),

                field(DCTERMS.EXTENT, required(), datatype(XSD.INTEGER)),

                detail(

                        field(SKOS.HAS_TOP_CONCEPT, Reference())

                )

        );
    }

    private static Shape Concept() {
        return relate(EC2U.Resource(),

                field(SKOS.PREF_LABEL, multilingual()),
                field(SKOS.ALT_LABEL, multilingual()),
                field(SKOS.DEFINITION, multilingual()),

                field(SKOS.IN_SCHEME, required(), Reference()),
                field(SKOS.TOP_CONCEPT_OF, optional(), Reference()),

                detail(

                        field(SKOS.BROADER_TRANSITIVE, Reference(),
                                field(SKOS.BROADER, Reference())
                        ),

                        field(SKOS.BROADER, Reference()),
                        field(SKOS.NARROWER, Reference()),
                        field(SKOS.RELATED, Reference())

                )

                // !!! link(OWL.SAMEAS, Concept())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                new Driver(ConceptScheme(),

                        filter(clazz(SKOS.CONCEPT_SCHEME))

                ),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/{scheme}/", new Router()
                                .get(new Relator())
                        )

                        .path("/{scheme}/*", handler(

                                new Driver(Concept(),

                                        filter(clazz(SKOS.CONCEPT))

                                ),

                                new Router()
                                        .get(new Relator())

                        ))

        ));
    }

}