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

package eu.ec2u.data.resources;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.multiple;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.And.and;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;
import static com.metreeca.link.shapes.Guard.hidden;

import static eu.ec2u.data.ontologies.EC2U.multilingual;


public final class Resources extends Delegator {

    public static final IRI Resource=EC2U.term("Resource");
    public static final IRI Publisher=EC2U.term("Publisher");

    public static final IRI university=EC2U.term("university");


    public static Shape Resource() {
        return and(Reference(),

                hidden(field(RDF.TYPE, all(Resource))),

                field(university, optional(),
                        field(RDFS.LABEL, multilingual())
                ),

                field(DCTERMS.TITLE, multilingual()),
                field(DCTERMS.DESCRIPTION, multilingual()),

                field(DCTERMS.PUBLISHER, optional(), Publisher()),
                field(DCTERMS.SOURCE, optional(), datatype(IRIType)),

                field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

                field(DCTERMS.TYPE, multiple(), Reference()),
                field(DCTERMS.SUBJECT, multiple(), Reference())

        );
    }

    public static Shape Reference() {
        return and(

                datatype(IRIType),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual())

        );
    }

    public static Shape Publisher() {
        return and(Reference(),

                field(DCTERMS.COVERAGE, optional(), datatype(IRIType))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Resources() {
        delegate(handler(

                new Driver(Resource(),

                        filter(clazz(Resource)),

                        field(RDF.TYPE, Reference()),
                        field(DCTERMS.SUBJECT, Reference())

                ),

                new Router()
                        .get(new Relator())

        ));
    }

}