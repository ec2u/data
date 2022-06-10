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
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Range.range;

public final class Events extends Delegator {

    public static Shape Event() {
        return relate(

                filter(clazz(EC2U.Event)),

                hidden(
                        field(RDF.TYPE, all(EC2U.Event), range(EC2U.Event, Schema.Event))
                ),

                EC2U.Resource(),
                Schema.Event(),

                field(DCTERMS.MODIFIED, required()), // housekeeping timestamp
                field("fullDescription", Schema.description) // prevent clashes with dct:description

        );
    }


    public Events() {
        delegate(handler(new Driver(Event()), new Router()

                .path("/", new Router()
                        .get(new Relator())
                )

                .path("/{id}", new Router()
                        .get(new Relator())
                )
        ));
    }

}