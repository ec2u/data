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

package eu.ec2u.data.datasets;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.ontologies.EC2U;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.resource;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;
import static com.metreeca.link.shapes.Guard.relate;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.ontologies.EC2U.item;
import static eu.ec2u.data.ontologies.EC2U.multilingual;

public final class Datasets extends Delegator {

    private static final IRI Context=item("/");

    public static final IRI Dataset=EC2U.term("Dataset");


    private static Shape Dataset() {
        return relate(Resources.Resource(),

                filter(clazz(Dataset)),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual()),

                field(DCTERMS.LICENSE, required(), datatype(IRIType),
                        field(RDFS.LABEL, multilingual())
                ),

                field(DCTERMS.RIGHTS, required(), datatype(XSD.STRING)),
                field(DCTERMS.ACCESS_RIGHTS, optional(), multilingual()),

                field(VOID.URI_SPACE, optional(), datatype(XSD.STRING)),
                field(VOID.ENTITIES, optional(), datatype(XSD.INTEGER))

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream.of(resource(Datasets.class, ".ttl").toString())

                .map(new Retrieve()
                        .base(EC2U.Base)
                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Datasets() {
        delegate(handler(

                new Driver(Dataset()),

                new Router()

                        .get(new Relator())

        ));
    }

}