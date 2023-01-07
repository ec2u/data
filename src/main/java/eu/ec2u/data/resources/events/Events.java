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

package eu.ec2u.data.resources.events;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data._ontologies.EC2U;
import eu.ec2u.data.resources.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.resource;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Resources.Resource;

public final class Events extends Delegator {

    public static final IRI Context=EC2U.item("/events/");

    public static final IRI Event=EC2U.term("Event");

    public static final IRI College=EC2U.term("College");
    public static final IRI Association=EC2U.term("Association");
    public static final IRI City=EC2U.term("City");


    public static Shape Event() {
        return relate(Resource(), Schema.Event(),

                hidden(field(RDF.TYPE, all(Event))),

                field(DCTERMS.MODIFIED, required()), // housekeeping timestamp
                field("fullDescription", Schema.description) // prevent clashes with dct:description

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream.of(resource(Events.class, ".ttl").toString())

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

    public Events() {
        delegate(handler(

                new Driver(Event(),

                        filter(clazz(Event))

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